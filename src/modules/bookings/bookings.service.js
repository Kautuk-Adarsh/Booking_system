const { PrismaClient } = require('@prisma/client');
const { bookingConfirmationQueue } = require('../../queues/bookingConfirmation.queue');

const prisma = new PrismaClient();

const createBooking = async (customerId, { eventId, seatsBooked }) => {
  if (!seatsBooked || seatsBooked < 1 || seatsBooked > 10)
    throw new Error('seatsBooked must be between 1 and 10');

  const booking = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');
    if (event.availableSeats < seatsBooked)
      throw new Error(`Only ${event.availableSeats} seats available`);

    await tx.event.update({
      where: { id: eventId },
      data: { availableSeats: { decrement: seatsBooked } }
    });

    return tx.booking.create({
      data: { customerId, eventId, seatsBooked, status: 'CONFIRMED' },
      include: { event: { select: { title: true } } }
    });
  });

  // Dispatch confirmation job
  await bookingConfirmationQueue.add('booking-confirmation', { bookingId: booking.id });

  return booking;
};

const getMyBookings = async (customerId) => {
  return prisma.booking.findMany({
    where: { customerId },
    include: {
      event: {
        select: { id: true, title: true, date: true, location: true, price: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const cancelBooking = async (bookingId, customerId) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.customerId !== customerId) throw new Error('Not your booking');
  if (booking.status === 'CANCELLED') throw new Error('Already cancelled');

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    }),
    prisma.event.update({
      where: { id: booking.eventId },
      data: { availableSeats: { increment: booking.seatsBooked } }
    })
  ]);

  return { message: 'Booking cancelled' };
};

module.exports = { createBooking, getMyBookings, cancelBooking };