# Local Development Setup Guide

This guide will help you set up the Renters application for local development with MongoDB running on your machine.

## Prerequisites

- **Node.js** (v18+) and **pnpm** (latest)
- **Docker** and **Docker Compose** (for MongoDB) — OR install MongoDB locally
- **Git**

## Step 1: Clone & Install Dependencies

```bash
git clone <repo-url>
cd renters
pnpm install
```

## Step 2: Set Up MongoDB

### Option A: Using Docker (Recommended)

1. Start MongoDB container:
```bash
pnpm db:up
```

This starts MongoDB on `localhost:27017` with:
- Username: `admin`
- Password: `password`
- Database: `renters`

2. Stop MongoDB (when done):
```bash
pnpm db:down
```

### Option B: Install MongoDB Locally

1. [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. Verify connection: `mongosh mongodb://localhost:27017`

## Step 3: Configure Environment

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your local settings (already configured for local dev):
```env
MONGO_URI=mongodb://localhost:27017/renters
JWT_SECRET=dev-secret-key-12345
PORT=3000
NODE_ENV=development
```

## Step 4: Seed Sample Data

Run the seed script to populate the database with test users and properties:

```bash
pnpm seed
```

### Test Credentials

After seeding, you can log in with:

| Role   | Email                  | Password      |
|--------|------------------------|---------------|
| Seller | seller@example.com     | password123   |
| Buyer  | buyer@example.com      | password123   |
| Admin  | admin@example.com      | password123   |

## Step 5: Start Development Server

```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3000/api (Express)

## Step 6: Test API Routes

### Auth Routes

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"password123"}'
```

### Properties Routes

**List Properties:**
```bash
curl http://localhost:3000/api/properties?page=1&limit=10&city=NewYork
```

**Get Property by ID:**
```bash
curl http://localhost:3000/api/properties/<property_id>
```

**Create Property (requires owner header for dev):**
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -d '{"title":"My Property","price":500000,"type":"Apartment","address":{"city":"NewYork"}}'
```

### User Routes

**Get Profile:**
```bash
curl -H "x-user-id: <user_id>" http://localhost:3000/api/users/me
```

**Update Profile:**
```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -d '{"name":"Updated Name"}'
```

## Database Management

### View MongoDB Data

1. Connect with MongoDB client:
```bash
mongosh mongodb://localhost:27017
```

2. Use database and collections:
```javascript
use renters
db.users.find().pretty()
db.properties.find().pretty()
```

### Reset Database

Clear all data and reseed:
```bash
pnpm seed
```

## Troubleshooting

### MongoDB Connection Error

**Problem**: `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
- Check if Docker is running: `docker ps`
- Restart MongoDB: `pnpm db:down && pnpm db:up`
- Or verify MongoDB is running locally: `mongosh`

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

Or change PORT in `.env.local`:
```env
PORT=4000
```

### Module Not Found Errors

**Solution**: Ensure dependencies are installed:
```bash
pnpm install
pnpm typecheck
```

## Development Workflow

1. **Start MongoDB**: `pnpm db:up`
2. **Seed data**: `pnpm seed`
3. **Start dev server**: `pnpm dev`
4. **Code & save** → auto-reload (Vite frontend, Express backend)
5. **Stop MongoDB**: `pnpm db:down` (when done)

## Next Steps

- Explore the API by testing routes in `curl` or Postman
- Integrate frontend components with API calls (see `client/data/mock.ts` for examples)
- Add real-time features (Socket.io) — coming next
- Implement authentication middleware for production

## Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
