const express=require("express");
const app=express();
const userRoutes=require("./modules/user/user.routes");

app.use(userRoutes);



app.listen(5000,()=>{
  console.log("listening to 5000");
})