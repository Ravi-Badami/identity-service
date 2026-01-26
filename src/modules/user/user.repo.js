const User=require('./user.model')

exports.findAllUsers=async()=>{
  return await User.find().select('-password').lean();
}

exports.addUsers=async(userData)=>{
  return await User.create(userData);
}

exports.findUserByEmail=async(email)=>{
  return await User.findOne({email});
}

exports.findUserById=async(id)=>{
  return await User.findById({_id:id});
}

exports.deleteUser=async(id)=>{
  return await User.deleteOne({_id:id});
}