const express=require('express');
const authController=require("./auth.controller");
const strictLimiter = require('../../middlewares/strictLimiter.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createUserSchema,userLoginSchema

 } = require('../user/user.validation');
const router=express.Router();

router.post('/auth/register', strictLimiter, validate(createUserSchema), authController.registerUser);

router.post('/auth/login',strictLimiter,validate(userLoginSchema),authController.loginUser)




module.exports=router;