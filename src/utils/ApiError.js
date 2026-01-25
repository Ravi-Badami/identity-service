class ApiError extends Error{
  constructor(statusCode,message,isOperational=true,details=null){
    super(message);
    this.name=this.constructor.name;
    this.statusCode=statusCode;
    this.isOperational=isOperational;
    this.details=details;
    this.timestamp=new Date().toString();
    Error.captureStackTrace(this,this.constructor);
  }
  //400 - Bad Request
  static badRequest(message,details=null){
    return new ApiError(400,message,true,details);
  }
  //401 - Unauthorized   
  static unauthorized(message="Unauthorized"){
    return new ApiError(401,message);
  }
  //403 - Forbidden
  static forbidden(message='Forbidden'){
    return new ApiError(403,message);
  }
  //404 - Not Found
  static notFound(message='Resource Not Found'){
    return new ApiError(404,message);
  }
  //405 - Method Not Allowed
  static methodNotAllowed(message='Method not allowed'){
    return new ApiError(405,message);
  }
  //408 - Request Timeout
  static requestTimeout(message='Request Timeout'){
return new ApiError(408,message);
  }

  //409 - Conflict
  static conflict(message='Conflict'){
    return new ApiError(409,message);
  }

  //410 - Gone
  static gone(message='Resource no longer available'){
    return new ApiError(410,message);
  }

  //413 - payloadTooLarge
  static payloadTooLarge(message='payload too large'){
return new ApiError(413,message);
  }

  //415 - unsupported media type
  static unsupportedMediaType(message='unsupported media type'){
    return new ApiError(415,message);
  }

  //422 - unprocessable Entity (Validation error)
  static validationError(message='validation failed'){
    return new ApiError(422,message);
  }
//429 - Too many requests
  static tooManyRequests(message='Too many requests'){
    return new ApiError(429,message);
    
  }

  //500 - Internal server error
  static internal(message="Internal server error"){
    return new ApiError(500,message);
  }

  //502 - Bad Gateway
  static badGateWay(message='Bad Gateway'){
    return new ApiError(502,message);
  }

  //503 - Service unavailable
  static serviceUnavailabe(message='Service unavailable'){
    return new ApiError(503,message);
  }

  //504 - Gateway Timeout
  static gatewayTimeout(message='Gateway timeout'){
    return new ApiError(504,message);
  }
}

module.exports=ApiError;