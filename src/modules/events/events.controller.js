const service = require('./events.service');

const createEvent = async (req, res) => {
  try {
    const event = await service.createEvent(req.user.id, req.body);
    res.status(201).json(event);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

const getAllEvents = async (req, res) => {
  try {
    res.json(await service.getAllEvents());
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getEventById = async (req, res) => {
  try {
    res.json(await service.getEventById(req.params.id));
  } catch (err) { res.status(404).json({ error: err.message }); }
};

const updateEvent = async (req, res) => {
  try {
    res.json(await service.updateEvent(req.params.id, req.user.id, req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
};

const deleteEvent = async (req, res) => {
  try {
    res.json(await service.deleteEvent(req.params.id, req.user.id));
  } catch (err) { res.status(400).json({ error: err.message }); }
};

const getEventBookings = async (req, res) => {
  try {
    res.json(await service.getEventBookings(req.params.id, req.user.id));
  } catch (err) { res.status(400).json({ error: err.message }); }
};

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, getEventBookings };