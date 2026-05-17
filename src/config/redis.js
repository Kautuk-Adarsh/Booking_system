const { Redis } = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
redis.on('error', (err) => console.error('Redis error:', err));

const bullMQRedis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});
bullMQRedis.on('error', (err) => console.error('BullMQ Redis error:', err));

module.exports = { redis, bullMQRedis };