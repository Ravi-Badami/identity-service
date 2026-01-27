
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const userService=require("./user.service");

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await userService.getUsers();
  res.status(200).send(users);
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const getSingleUser = await userService.getOneUser(req.params.id);
  res.status(200).send(getSingleUser);
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const newUser = await userService.createUser(req.body);
  res.status(201).send(newUser);
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const deleteUser = await userService.deleteUser(req.params.id);
  res.status(200).send(deleteUser);
});

