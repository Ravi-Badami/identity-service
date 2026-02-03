const userRepo = require('../user/user.repo');
const authRepo=require('./auth.repo');
const jwtUtils=require('../../utils/jwt.utils');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const redisClient = require('../../config/redis');
const sendEmail = require('../email/email.service');
const crypto = require('crypto');


exports.loginUser = async (userData) => {
  const { email, password } = userData;
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const userWithPassword = await authRepo.findUserByEmailWithPassword(email);
  const familyId = jwtUtils.generateFamilyId();

  if (!userWithPassword) {
    logger.debug(`Login failed. User not found for email: ${email}`);
    // Double check if user exists without password select
    const checkUser = await userRepo.findUserByEmail(email);
    logger.debug(`Checking regular findUserByEmail: ${checkUser ? 'Found' : 'Not Found'} ${checkUser}`);
    throw ApiError.notFound("Invalid email or pass");
  }

  const isMatch = await bcrypt.compare(password, userWithPassword.password);
  if (!isMatch) {
    logger.debug(`Login failed. Password mismatch for: ${email}`);
    logger.debug(`Stored hash: ${userWithPassword.password}`);
    logger.debug(`Provided pass: ${password}`);
    throw ApiError.notFound("Invalid email or pass");
  }

  const accessToken=jwtUtils.generateAccessToken(userWithPassword.id,userWithPassword.role);

  const refreshToken=jwtUtils.generateRefreshToken(userWithPassword.id,familyId);

const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 


    await authRepo.createTokenFamily({
    user: userWithPassword._id,
    familyId: familyId,
    token: refreshToken,
   expires: expires 
  });

   return { 
    accessToken, 
    refreshToken,
    user: {
        id: userWithPassword._id, 
        email: userWithPassword.email,
        role: userWithPassword.role
    }
  };
}

exports.refreshAuth = async (incomingToken) => {
  // 1. Verify & Decode
  let decoded;
  try {
    decoded = jwtUtils.verifyRefreshToken(incomingToken);
  } catch (err) {
    throw ApiError.unauthorized("Invalid Refresh Token");
  }
  const { familyId, id: userId } = decoded;
  // 2. Find Family
  const family = await authRepo.findTokenFamily(familyId);

  // SCENARIO 1: Family Revoked or Invalid
  if (!family) {
    throw ApiError.unauthorized("Invalid token (Family revoked)");
  }

  // SCENARIO 2: Reuse Detection (Theft Attempt)
  // If Incoming != Current AND Incoming != Grace
  if (incomingToken !== family.token && incomingToken !== family.previousToken) {
    await authRepo.revokeFamily(familyId); // Revoke everything!
    throw ApiError.forbidden("Reuse detected. Login required.");
  }

  // SCENARIO 3: Grace Period (Concurrency)
  if (incomingToken === family.previousToken) {
    const now = new Date();
    // Valid Grace? Return EXISTING current token (don't rotate again)
    if (family.graceExpiresAt && now < new Date(family.graceExpiresAt)) {
      const newAccess = jwtUtils.generateAccessToken(userId, "user"); 
      return { accessToken: newAccess, refreshToken: family.token };
    } else {
      // Grace expired -> Theft!
      await authRepo.revokeFamily(familyId);
      throw ApiError.forbidden("Token reuse outside grace period");
    }
  }

  // SCENARIO 4: Standard Rotation (Success)
  // Incoming matches family.token
  const newRefToken = jwtUtils.generateRefreshToken(userId, familyId);
  const newAccessToken = jwtUtils.generateAccessToken(userId, "user");

  // Rotate: Old becomes Grace (valid for 60s)
  await authRepo.rotateToken(
    familyId,
    newRefToken,
    incomingToken, 
    new Date(Date.now() + 60 * 1000) // 60s grace
  );

  return { accessToken: newAccessToken, refreshToken: newRefToken };
};

exports.registerUser = async (userData) => {
  const { email, password, ...rest } = userData;
  
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) {
    throw ApiError.conflict("Email already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create the user in DB (Initially returns Mongoose Document)
  const user = await authRepo.registerUser({
    email,
    password: hashedPassword,
    ...rest
  });

  // 2. Generate Verification Token (Updates the document in memory)
  const verificationToken = user.getVerificationToken();

  // 3. Save the token to DB via Repository
  await authRepo.saveUser(user);

  // 4. Send Verification Email
  const verifyUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/v1/auth/verifyemail/${verificationToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Please verify your email: ${verifyUrl}`
    });
  } catch (err) {
    // 5. Rollback: If email fails, delete the user
    await userRepo.deleteUser(user._id);
    throw new ApiError(500, 'Email could not be sent. Please try again.');
  }

  const { password: _, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};

exports.verifyEmail = async (token) => {
  // 1. Hash the token (matches how we stored it)
  const verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  // 2. Find user with this token AND who is not expired
  const user = await authRepo.findUserByVerificationToken(verificationToken);
  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }
  // 3. Mark verified and clear token
  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await authRepo.saveUser(user);
  return { message: 'Email verified successfully' };
};

exports.logoutUser = async (refreshToken, accessToken) => {
  if(!refreshToken){
    throw ApiError.badRequest("Refresh Token is required");
  }

  // 1. Blacklist Access Token (if provided)
  if (accessToken) {
    try {
      const decoded = jwtUtils.verifyAccessToken(accessToken); // Or just decode without verify if we trust it's ours
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await redisClient.setEx(`bl_${accessToken}`, ttl, "revoked");
        logger.info(`Access Token blacklisted. TTL: ${ttl}s`);
      }
    } catch (err) {
      logger.warn(`Logout: Could not blacklist access token: ${err.message}`);
      // Continue to revoke refresh token anyway
    }
  }

  // 2. Revoke Refresh Token Family
  let decoded;
  try {
     decoded = jwtUtils.verifyRefreshToken(refreshToken);
  } catch (error) {
     // Even if token is expired/invalid, we technically can't find the family easily 
     // unless we decode without verification, but for security, if it's invalid, 
     // we can just imply they are logged out. 
     // However, let's treat it as success to be idempotent.
     return;
  }
  const { familyId } = decoded;
  await authRepo.revokeFamily(familyId);
};