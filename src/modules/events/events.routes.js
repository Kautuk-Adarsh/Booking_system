const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roleGuard');
const c = require('./events.controller');

router.get('/', c.getAllEvents);
router.get('/:id', c.getEventById);
router.post('/', auth, role('ORGANIZER'), c.createEvent);
router.put('/:id', auth, role('ORGANIZER'), c.updateEvent);
router.delete('/:id', auth, role('ORGANIZER'), c.deleteEvent);
router.get('/:id/bookings', auth, role('ORGANIZER'), c.getEventBookings);

module.exports = router;