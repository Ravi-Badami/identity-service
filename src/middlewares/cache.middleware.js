const redisClient = require('../config/redis');
const logger = require('../config/logger');

exports.cacheGet = (keyPrefix) => {
  return async (req, res, next) => {
    try {
      // Use req.params.id for "getUser" and req.user.id for "getMe" scenarios
      const id = req.params.id || req.user?.id;
      if (!id) return next();

      const key = `${keyPrefix}:${id}`;
      const cached = await redisClient.get(key);

      if (cached) {
        logger.info(`Cache hit: ${key}`);
        return res.json(JSON.parse(cached));
      }

      logger.info(`Cache miss: ${key}`);
      req.cacheKey = key;
      next();
    } catch (err) {
      logger.error(`Cache error: ${err.message}`);
      next(); // Continue without cache on error
    }
  };
};

exports.cacheSet = async (key, data, ttl = 300) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    logger.info(`Cache set: ${key} (TTL: ${ttl})`);
  } catch (err) {
    logger.error(`Cache set error: ${err.message}`);
  }
};

exports.cacheDelete = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache deleted: ${pattern}, count: ${keys.length}`);
    }
  } catch (err) {
    logger.error(`Cache delete error: ${err.message}`);
  }
};