const User = require('../user/user.model');
const Token=require('./token.model');

exports.registerUser=async(data)=>{
 return await User.create(data);
}

exports.findUserByEmailWithPassword = async (email) => {
  return await User.findOne({ email }).select('+password').maxTimeMS(10000);
}

exports.saveRefreshToken=async(userId,refreshToken)=>{
  return await User.findByIdAndUpdate(userId,{refreshToken},{new:true});
}

exports.createTokenFamily=async(data)=>{
  return await Token.create(data);
}

exports.findTokenFamily=async(familyId)=>{
return await Token.findOne({familyId});
}

exports.rotateToken=async(familyId,newToken,oldToken,graceExpiry)=>{
  return await Token.findOneAndUpdate(
    {familyId},
{token:newToken,previousToken:oldToken,graceExpiresAt:graceExpiry},
  {new:true}
  );
};

exports.revokeFamily=async(familyId)=>{
  return await Token.deleteMany({familyId});
}




