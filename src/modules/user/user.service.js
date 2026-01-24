const repo=require('./user.repo');
exports.getAllUsers=async()=>{
  const users=await repo.findAllUsers();
  return users;
  
}