const repo = require('./user.repo');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

exports.getUsers = async (query) => {
  const limit = parseInt(query.limit) || 20;
  const page = parseInt(query.page) || 1;
  const cursor = query.cursor;

  let filter = {};
  let skip = 0;

  if (cursor) {
    // Sequential navigation: use cursor (fast)
    filter = { _id: { $gt: cursor } };
  } else if (page > 1) {
    // Page jumping: use offset (slower but acceptable)
    skip = (page - 1) * limit;
  }

  const users = await repo.findUsers(filter, skip, limit);
  const total = await repo.countUsers();
  
  // Calculate next cursor
  const nextCursor = users.length > 0 ? users[users.length - 1]._id : null;

  return {
    data: users,
    nextCursor,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.getOneUser=async(id)=>{
  if(!id) throw ApiError.badRequest("Id must be given");
  const user=await repo.findUserById(id);
  if(!user)throw ApiError.notFound("User not found");
  return user;

}




exports.deleteUser=async(id)=>{
  logger.debug(`Deleting user with id: ${id}`);
  if(id===undefined) throw ApiError.badRequest("Id is undefined");
  
  const deletedUser=await repo.deleteUser(id);

if (!deletedUser)
  throw ApiError.notFound("User not found");
  return deletedUser;
}