const jwt=require("jsonwebtoken");
const jwtConfig=require("../config/jwt");
const {v4:uuidv4}=require('uuid');

exports.generateFamilyId=()=>uuidv4();

exports.generateAccessToken=(userId,role)=>{
  return jwt.sign(
    {id:userId,role},
    jwtConfig.secret,
    {expiresIn:jwtConfig.accessExpire}
  );
};

exports.generateRefreshToken = (userId, familyId) => {
  return jwt.sign(
    { id: userId, familyId },
    jwtConfig.refreshSecret, 
    { expiresIn: jwtConfig.refreshExpire }
  );
};

exports.verifyAccessToken=(token)=>{
  return jwt.verify(token,jwtConfig.secret);
};

exports.verifyRefreshToken=(token)=>{
  return jwt.verify(token,jwtConfig.refreshSecret);
};