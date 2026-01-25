const User=require('./user.model')

exports.findAllUsers=async()=>{
  return await User.find().select('-password').lean();
}

exports.addUsers=async(userData)=>{
  return await User.create(userData);
}

exports.findByEmail=async(email)=>{
  return await User.findOne({email});
}