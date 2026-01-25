const repo=require('./user.repo');
const bycrypt=require('')
exports.getAllUsers=async()=>{
  const users=await repo.findAllUsers();
  return users;
}
exports.createUsers=async(userData)=>{
  const user=await repo.addUsers(userData);
  return user;
}