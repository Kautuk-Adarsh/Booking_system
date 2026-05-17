const { PrismaClient } = require('@prisma/client');
const { eventUpdateQueue } = require('../../queues/eventUpdate.queue');

const prisma = new PrismaClient();

const createEvent = async (organizerId, data) => {
  const { title, description, date, location, totalSeats, price } = data;
  return prisma.event.create({
    data: {
      title, description,
      date: new Date(date),
      location, totalSeats,
      availableSeats: totalSeats,
      price, organizerId
    }
  });
};

const getAllEvents = async () => {
  return prisma.event.findMany({
    select: {
      id: true, title: true, description: true,
      date: true, location: true,
      totalSeats: true, availableSeats: true,
      price: true, organizerId: true, createdAt: true
    }
  });
};

const getEventById = async (id) => {
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true,
      date: true, location: true,
      totalSeats: true, availableSeats: true,
      price: true, organizerId: true, createdAt: true
    }
  });
  if (!event) throw new Error('Event not found');

  return {
    ...event,
    maxSeatsPerBooking: Math.min(event.availableSeats, 10)
  };
};

const updateEvent = async (id, organizerId, data) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new Error('Event not found');
  if (event.organizerId !== organizerId) throw new Error('Not your event');

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      ...(data.date && { date: new Date(data.date) })
    }
  });

  await eventUpdateQueue.add('event-update', { eventId: id });

  return updated;
};

const deleteEvent = async (id, organizerId) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new Error('Event not found');
  if (event.organizerId !== organizerId) throw new Error('Not your event');

  await prisma.event.delete({ where: { id } });
  return { message: 'Event deleted' };
};

const getEventBookings = async (id, organizerId) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new Error('Event not found');
  if (event.organizerId !== organizerId) throw new Error('Not your event');

  return prisma.booking.findMany({
    where: { eventId: id },
    include: { customer: { select: { id: true, name: true, email: true } } }
  });
};

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, getEventBookings };