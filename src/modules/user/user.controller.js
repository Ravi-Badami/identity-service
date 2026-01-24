
const userService=require("./user.service");

exports.getAllUsers=async(req,res)=>{
await res.send(userService.getAllUsers());
};