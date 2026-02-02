const jwtUtils = require('../utils/jwt.utils');
const ApiError = require('../utils/ApiError');
const redisClient = require('../config/redis');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is missing or invalid');
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw ApiError.unauthorized('Access token is missing');
    }

    try {
      // Verify the token
      const decoded = jwtUtils.verifyAccessToken(token);

      // [NEW] Check Blocklist
      const isBlacklisted = await redisClient.get(`bl_${token}`);
      if (isBlacklisted) {
        throw ApiError.unauthorized('Token is revoked');
      }
      
      // Attach user info (including role) to the request object
      req.user = decoded; 
      
      next();
    } catch (error) {
       if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token has expired');
       }
       throw ApiError.unauthorized('Invalid token');
    }

  } catch (error) {
    next(error);
  }
};
