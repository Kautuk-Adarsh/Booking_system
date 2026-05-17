require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./modules/auth/auth.routes');
const eventRoutes = require('./modules/events/events.routes');
const bookingRoutes = require('./modules/bookings/bookings.routes');

require('./queues/bookingConfirmation.worker');
require('./queues/eventUpdate.worker');

const app = express();

app.use(helmet());
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down.' }
}));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts.' }
}));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));