const repo = require('./user.repo');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');

exports.getUsers = async () => {
  return repo.findUsers();
};

exports.getOneUser=async(id)=>{
  if(!id) throw ApiError.badRequest("Id must be given");
  const user=await repo.findUserById(id);
  if(!user)throw ApiError.notFound("User not found");
  return user;

}

exports.createUser = async (userData) => {
  const { email, password, ...rest } = userData;
  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required");
  }
  const existingUser = await repo.findUserByEmail(email);
  if (existingUser) {
    throw ApiError.conflict("Email already taken");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const userToCreate = {
    email,
    password: hashedPassword,
    ...rest
  };
  const user = await repo.createUser(userToCreate);
  const { password: _, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};


exports.deleteUser=async(id)=>{
  console.log(id);
  if(id===undefined) throw ApiError.badRequest("Id is undefined");
  
  const deletedUser=await repo.deleteUser(id);

if (!deletedUser)
  throw ApiError.notFound("User not found");
  return deletedUser;
}