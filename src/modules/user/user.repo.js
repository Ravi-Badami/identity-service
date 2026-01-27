const User=require('./user.model')

exports.findUsers = async (query = {}, skip = 0, limit = 10) => {
  return await User.find(query)
    .sort({ _id: 1 }) // Crucial for cursor pagination
    .skip(skip)
    .limit(limit)
    .select('-password')
    .lean();
};

exports.countUsers = async () => {
  return await User.countDocuments();
};

exports.createUser=async(userData)=>{
  return await User.create(userData);
}

exports.findUserByEmail=async(email)=>{
  return await User.findOne({email});
}

exports.findUserById=async(id)=>{
  return await User.findById({_id:id});
}

exports.deleteUser=async(id)=>{
  return await User.findByIdAndDelete(id);
}