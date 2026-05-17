const { Queue } = require('bullmq');
const { bullMQRedis } = require('../config/redis');

const bookingConfirmationQueue = new Queue('booking-confirmation', {
  connection: bullMQRedis
});

module.exports = { bookingConfirmationQueue };