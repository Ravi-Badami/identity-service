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