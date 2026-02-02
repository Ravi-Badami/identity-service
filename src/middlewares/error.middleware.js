const ApiError=require("../utils/ApiError");
const logger = require('../config/logger');

const errorHandler=(err,req,res,next)=>{
  let error =err;

  //Default values
  error.statusCode=error.statusCode||500;
  error.message=error.message||"Internal server error";
  
  //Log error
  logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if(process.env.NODE_ENV === "development"){
    logger.debug(error.stack);
  }

  //
  if(err.name==="ValidationError"){
    const messages=Object.values(err.errors).map(e=>e.message);
    error=ApiError.badRequest("Validation failed",messages);
  }

   // Duplicate key error
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    error = ApiError.conflict(`${field} already exists`, { field });
  }

    // Cast Error
  if (err.name === "CastError") {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }


  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expired");
  }

  // Wrap unknown errors
  if (!(error instanceof ApiError)) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Error is NOT instance of ApiError. Type: ${error.constructor.name}`);
    }
    error = ApiError.internal(error.message);
  }
// Hide non-operational errors in production
  if (!error.isOperational && process.env.NODE_ENV === "production") {
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }


   const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      originalError: err.name
    })
  };
   res.status(error.statusCode).json(response);
};
const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (reason) => {
    logger.error(`UNHANDLED REJECTION 💥 ${reason}`);
    process.exit(1);
  });
};

const handleUncaughtException = () => {
  process.on("uncaughtException", (err) => {
    logger.error(`UNCAUGHT EXCEPTION 💥 ${err.name}: ${err.message}`);
    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException
};