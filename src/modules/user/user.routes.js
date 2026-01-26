const express=require("express");
const router=express.Router();
const userController=require('./user.controller');

router.get('/',userController.getAllUsers);
router.get('/:id',userController.getUserById);
router.post('/',userController.createNewUser);
router.delete('/:id',userController.deleteUser);

module.exports=router;