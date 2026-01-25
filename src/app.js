const express=require("express");
const app=express();
const userRoutes=require("./modules/user/user.routes");
const { errorHandler,handleUnhandledRejection, handleUncaughtException } = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');


app.use(express.json());
app.use(userRoutes);

//404 handler (BEFORE error middleware)
app.use((req,res,next)=>{
  next(ApiError.notFound('Route ${req.originalUrl} not found'));
})

app.use(errorHandler);



handleUnhandledRejection();
handleUncaughtException();







module.exports=app;