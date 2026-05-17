const { Queue } = require('bullmq');
const { bullMQRedis } = require('../config/redis');

const eventUpdateQueue = new Queue('event-update', {
  connection: bullMQRedis
});

module.exports = { eventUpdateQueue };