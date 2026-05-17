const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { bullMQRedis } = require('../config/redis');

const prisma = new PrismaClient();

const worker = new Worker('booking-confirmation', async (job) => {
  const { bookingId } = job.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { email: true, name: true } },
      event: { select: { title: true } }
    }
  });

  if (!booking) {
    console.log(`[EMAIL WORKER] Booking ${bookingId} not found. Skipping.`);
    return;
  }

  if (booking.status === 'CANCELLED') {
    console.log(`[EMAIL WORKER] Booking ${bookingId} was cancelled before processing. Skipping confirmation email.`);
    return;
  }

  console.log(`[EMAIL WORKER]  Sending booking confirmation to ${booking.customer.email} for event "${booking.event.title}" — ${booking.seatsBooked} seat(s) booked.`);
}, { connection: bullMQRedis });

worker.on('failed', (job, err) => {
  console.error(`[EMAIL WORKER] Job ${job.id} failed:`, err.message);
});

module.exports = worker;