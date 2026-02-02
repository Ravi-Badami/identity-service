const redis = require('redis');
const logger = require('./logger');
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});
client.on('error', (err) => logger.error(`Redis error: ${err}`));
client.on('connect', () => logger.info('Redis connected'));
client.connect();
module.exports = client;