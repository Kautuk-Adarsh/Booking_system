const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { bullMQRedis } = require('../config/redis');

const prisma = new PrismaClient();

const worker = new Worker('event-update', async (job) => {
  const { eventId } = job.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      bookings: {
        where: { status: 'CONFIRMED' },
        include: { customer: { select: { email: true, name: true } } }
      }
    }
  });

  if (!event) {
    console.log(`[NOTIFY WORKER] Event ${eventId} not found. Skipping.`);
    return;
  }

  if (event.bookings.length === 0) {
    console.log(`[NOTIFY WORKER] No confirmed bookings for event "${event.title}". No notifications sent.`);
    return;
  }

  event.bookings.forEach(({ customer }) => {
    console.log(`[NOTIFY WORKER]  Notifying ${customer.email} (${customer.name}) — event "${event.title}" has been updated.`);
  });
}, { connection: bullMQRedis });

worker.on('failed', (job, err) => {
  console.error(`[NOTIFY WORKER] Job ${job.id} failed:`, err.message);
});

module.exports = worker;