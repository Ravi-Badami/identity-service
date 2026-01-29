const userRepo = require('../user/user.repo');
const authRepo=require('./auth.repo');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');


exports.loginUser = async (userData) => {
  const { email, password } = userData;
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  // 1. Get the user document (which includes the password field)
  const userWithPassword = await authRepo.findUserByEmailWithPassword(email);

  if (!userWithPassword) {
    throw ApiError.notFound("Invalid email or pass");
  }

  // 2. Pass the PASSWORD STRING (userWithPassword.password) to bcrypt
  const isMatch = await bcrypt.compare(password, userWithPassword.password);

  if (!isMatch) {
    throw ApiError.notFound("Invalid email or pass");
  }

  // 3. Return the email (do not use res.send() inside the service)
  return userWithPassword.email;
}



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