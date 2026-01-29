const User = require('../user/user.model')

exports.registerUser=async(data)=>{
 return await User.create(data);
}

exports.findUserByEmailWithPassword = async (email) => {
  return await User.findOne({ email }).select('+password').maxTimeMS(10000);
}


