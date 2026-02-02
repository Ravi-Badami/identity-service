const express=require("express");
const router=express.Router();
const userController=require('./user.controller');

const validate=require('../../middlewares/validate.middleware')
const {userIdSchema}=require('./user.validation');
const auth = require('../../middlewares/auth.middleware');
const rbac = require('../../middlewares/rbac.middleware');
const {cacheGet}=require("../../middlewares/cache.middleware");


router.get('/', auth.authenticate, rbac.authorize(['admin']), userController.getUsers);
router.get('/:id', auth.authenticate, rbac.authorize(['user', 'admin']), validate(userIdSchema),cacheGet('user') ,userController.getUser);

router.delete('/:id', auth.authenticate, rbac.authorize(['admin']), validate(userIdSchema), userController.deleteUser);

module.exports=router;