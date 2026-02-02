const express=require("express");
const app=express();
const userRoutes=require("./modules/user/user.routes");
const authRoutes=require("./modules/auth/auth.routes");
const { errorHandler,handleUnhandledRejection, handleUncaughtException } = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');
const requestTimeout = require('./middlewares/timeout.middleware');

const requestLogger=require("./middlewares/logger.middleware");


const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use(express.json());

app.use(requestLogger);

// Swagger Page
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/users', userRoutes);
app.use('/api/v1', authRoutes);

//404 handler (BEFORE error middleware)
app.use((req,res,next)=>{
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
})

app.use(errorHandler);

handleUnhandledRejection();
handleUncaughtException();

module.exports=app;