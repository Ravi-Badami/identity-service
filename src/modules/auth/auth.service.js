const userRepo = require('../user/user.repo');
const authRepo=require('./auth.repo');
const jwtUtils=require('../../utils/jwt.utils');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');


exports.loginUser = async (userData) => {
  const { email, password } = userData;
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const userWithPassword = await authRepo.findUserByEmailWithPassword(email);
  const familyId = jwtUtils.generateFamilyId();

  if (!userWithPassword) {
    throw ApiError.notFound("Invalid email or pass");
  }

  const isMatch = await bcrypt.compare(password, userWithPassword.password);
  if (!isMatch) {
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
  const userToCreate = {
    email,
    password: hashedPassword,
    ...rest
  };
  const user = await authRepo.registerUser(userToCreate);
  const { password: _, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};

exports.logoutUser = async (refreshToken) => {
  if(!refreshToken){
    throw ApiError.badRequest("Refresh Token is required");
  }
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