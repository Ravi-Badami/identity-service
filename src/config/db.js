const mongoose=require("mongoose");
const logger = require('./logger');

const connectDB=async()=>{
  try{
  const conn=await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  logger.info(`MongoDB connected:${conn.connection.host}`);
}catch(error){
  logger.error(`Databse connection failed: ${error.message}`);
  process.exit(1);
}};

module.exports=connectDB;