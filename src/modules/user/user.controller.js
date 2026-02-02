
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const userService=require("./user.service");
const {cacheSet,cacheDelete}=require("../../middlewares/cache.middleware");s

exports.getUsers = asyncHandler(async (req, res, next) => {
  const result = await userService.getUsers(req.query);
  res.status(200).send(result);
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const getSingleUser = await userService.getOneUser(req.params.id);
    if (req.cacheKey) {
    await cacheSet(req.cacheKey, getSingleUser, 600); // 600s = 10 minutes
  }
  res.status(200).send(getSingleUser);
});



exports.deleteUser = asyncHandler(async (req, res, next) => {
  const deleteUser = await userService.deleteUser(req.params.id);
    await cacheDelete(`user:${req.params.id}`);
  res.status(200).send(deleteUser);
});

