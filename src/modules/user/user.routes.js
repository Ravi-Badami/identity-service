const express=require("express");
const router=express.Router();
const userController=require('./user.controller');

router.get('/',userController.getAllUsers);

module.exports=router;