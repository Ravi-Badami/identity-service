const User=require('./user.model')

exports.findAllUsers=async()=>{
  return await User.find().select('-password').lean();
}