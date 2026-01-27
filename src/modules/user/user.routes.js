const express=require("express");
const router=express.Router();
const userController=require('./user.controller');

const validate=require('../../middlewares/validate.middleware')
const {createUserSchema,userIdSchema}=require('./user.validation');

router.get('/',userController.getUsers);
router.get('/:id',validate(userIdSchema),userController.getUser);
router.post('/',validate(createUserSchema),userController.createUser);
router.delete('/:id',validate(userIdSchema),userController.deleteUser);

module.exports=router;