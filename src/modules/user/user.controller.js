
const userService=require("./user.service");

exports.getAllUsers=async(req,res,next)=>{
  try{
const users=await userService.getAllUsers();
res.send(users);
  }
  catch(error){
    next(error);
  }
};

exports.createNewUser=async(req,res,next)=>{
  try {
    const newUser=await userService.createUsers(req.body);
    res.send(newUser);
  } catch (error) {
    next(error)
  }
};

