# Event Booking System

A RESTful backend API for an event booking platform supporting two user roles: Event Organizers and Customers, with background job processing via BullMQ.

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js | Fast, non-blocking I/O suits a booking system with concurrent requests |
| Framework | Express | Minimal, unopinionated, fastest to wire up a layered architecture |
| Database | PostgreSQL | Relational data (Users → Bookings → Events) with real foreign key constraints |
| ORM | Prisma v5 | Schema-first design, clean migrations, readable query API |
| Auth | JWT (stateless) | No server-side session state needed; scales horizontally without sticky sessions |
| Job Queue | BullMQ + Redis | Persistent, Redis-backed queue with retry support; survives server restarts unlike in-process async |
| Security | helmet + express-rate-limit | HTTP header hardening and per-IP throttling at app layer |

## Architecture

Layered architecture: `routes → controllers → services → models`

- **Routes**: Define endpoints and attach middleware guards
- **Controllers**: Handle HTTP req/res, delegate to services
- **Services**: All business logic lives here (seat validation, ownership checks, job dispatch)
- **Models**: Prisma schema defines the data layer

## Folder Structure
src/
├── config/          # Redis connection
├── middleware/      # JWT auth guard, role guard
├── modules/
│   ├── auth/        # Register, Login
│   ├── events/      # CRUD for events
│   └── bookings/    # Book, cancel, history
├── queues/          # BullMQ queue definitions + workers
└── app.js           # Express setup, middleware, route mounting

## Data Models
User        → id, name, email, password (bcrypt), role (ORGANIZER | CUSTOMER)
Event       → id, title, description, date, location, totalSeats, availableSeats, price, organizerId
Booking     → id, customerId, eventId, seatsBooked, status (CONFIRMED | CANCELLED), createdAt

## API Endpoints

### Auth (Public)
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register as ORGANIZER or CUSTOMER |
| POST | `/api/auth/login` | Returns JWT token |

### Events
| Method | Route | Role | Notes |
|---|---|---|---|
| GET | `/api/events` | Public | Returns availableSeats + maxSeatsPerBooking |
| GET | `/api/events/:id` | Public | Single event detail |
| POST | `/api/events` | ORGANIZER | Create event |
| PUT | `/api/events/:id` | ORGANIZER (owner) | Update — triggers notification job |
| DELETE | `/api/events/:id` | ORGANIZER (owner) | Delete event |
| GET | `/api/events/:id/bookings` | ORGANIZER (owner) | All bookings for event |

### Bookings
| Method | Route | Role | Notes |
|---|---|---|---|
| POST | `/api/bookings` | CUSTOMER | Book tickets — triggers confirmation job |
| GET | `/api/bookings/my` | CUSTOMER | Full booking history |
| DELETE | `/api/bookings/:id` | CUSTOMER (owner) | Cancel — restores seats |

## Background Jobs

### booking-confirmation queue
- Triggered on successful booking
- Worker verifies booking status before acting (idempotency check)
- If booking was cancelled before worker processed the job, email is skipped
- Logs: ` Sending booking confirmation to <email> for event "<title>"`

### event-update queue
- Triggered when an organizer updates an event
- Fetches all customers with CONFIRMED bookings for that event
- Notifies each one individually
- Logs: ` Notifying <email> — event "<title>" has been updated`

## Key Design Decisions

**Why idempotency checks in workers?**
A customer can book and immediately cancel before BullMQ processes the confirmation job. Attempting to remove jobs from the queue mid-flight introduces its own race condition. The correct pattern is to check the current DB state inside the worker and bail out if the booking is no longer CONFIRMED.

**Why Prisma transactions for booking?**
Seat availability check and decrement must be atomic. A race condition between two concurrent bookings on the same event would allow overbooking without a transaction wrapping both the check and the update.

**Why rate limiting on auth routes separately?**
Global limit is 100 req/15min. Auth routes are tightened to 10 req/15min to prevent brute force attacks on passwords without blocking normal API usage.

**Why maxSeatsPerBooking = min(availableSeats, 10)?**
Prevents a single customer from wiping out an entire event's inventory in one request. Enforced both at the API response level (so clients know the cap) and in the service layer (so it cannot be bypassed).

**Why PostgreSQL over MongoDB?**
The data has clear relational structure. Bookings reference both Users and Events with foreign keys. MongoDB would require manual reference management and lose transactional guarantees needed for seat decrement logic.

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+

### Setup
```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up -d

# Run migrations
npx prisma migrate dev --name init

# Start server
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/eventbooking"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="supersecretkey123"
PORT=3000
```

## Deployment

Hosted on Railway with managed PostgreSQL and Redis services.

- PostgreSQL and Redis provisioned as Railway plugins
- App deployed via GitHub-connected Railway service
- Environment variables set in Railway dashboard
- Dockerfile used for production build

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire in 24 hours
- All sensitive routes protected by auth + role middleware
- HTTP headers hardened via helmet
- Rate limiting at both global and route level