const service = require('./bookings.service');

const createBooking = async (req, res) => {
  try {
    res.status(201).json(await service.createBooking(req.user.id, req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
};

const getMyBookings = async (req, res) => {
  try {
    res.json(await service.getMyBookings(req.user.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    res.json(await service.cancelBooking(req.params.id, req.user.id));
  } catch (err) { res.status(400).json({ error: err.message }); }
};

module.exports = { createBooking, getMyBookings, cancelBooking };