const asyncHandler = require('../../utils/asyncHandler');
const authService=require('./auth.service');

exports.registerUser=asyncHandler( async(req,res)=>{
const registerUser=await authService.registerUser(req.body);
res.status(200).send(registerUser);
});

exports.loginUser=asyncHandler(async(req,res)=>{
  const loginUser=await authService.loginUser(req.body);
  res.status(200).send(loginUser);
})

exports.refreshAuth=asyncHandler(async(req,res)=>{
  const tokens=await authService.refreshAuth(req.body.refreshToken);
  res.status(200).send(tokens);
})

exports.logoutUser=asyncHandler(async(req,res)=>{
  await authService.logoutUser(req.body.refreshToken);
  res.status(200).json({ success: true, message: "Logged out successfully" });
})