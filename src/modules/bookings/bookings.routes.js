const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roleGuard');
const c = require('./bookings.controller');

router.post('/', auth, role('CUSTOMER'), c.createBooking);
router.get('/my', auth, role('CUSTOMER'), c.getMyBookings);
router.delete('/:id', auth, role('CUSTOMER'), c.cancelBooking);

module.exports = router;