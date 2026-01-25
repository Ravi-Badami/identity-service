const express=require("express");
const router=express.Router();
const userController=require('./user.controller');

router.get('/',userController.getAllUsers);
router.post('/',userController.createNewUser);

module.exports=router;