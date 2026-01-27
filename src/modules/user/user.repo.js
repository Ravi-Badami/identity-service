const User=require('./user.model')

exports.findUsers=async()=>{
 return await User.findById(id).select('-password').lean();

}

exports.createUser=async(userData)=>{
  return await User.create(userData);
}

exports.findUserByEmail=async(email)=>{
  return await User.findOne({email});
}

exports.findUserById=async(id)=>{
  return await User.findById({_id:id});
}

exports.deleteUser=async(id)=>{
  return await User.findByIdAndDelete(id);
}