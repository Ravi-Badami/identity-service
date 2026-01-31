const mongoose = require("mongoose");
const tokenSchema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  familyId:{ type:String,required:true,index:true },
  token:{type:String,required:true},
  expires:{type:Date,required:true},
  previousToken:{type:String},
  graceExpiresAt:{type:Date},
},{timestamps:true});

tokenSchema.index({expires:1},{expireAfterSeconds:0});

module.exports=mongoose.model('RefreshToken',tokenSchema);


