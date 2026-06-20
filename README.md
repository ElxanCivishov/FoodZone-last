# FoodZone - Complete Restaurant QR Menu & Ordering System

Restaurant QR Menu & Ordering System with 4 panels: Customer, Admin, Kitchen, and Waiter.

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + Framer Motion
- Zustand (state management)
- TanStack Query (data fetching)
- i18next (AZ/EN/RU/TR)
- Socket.io Client (real-time)
- html5-qrcode (QR scanning)

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- Socket.io (real-time)
- JWT Auth + RBAC

## Setup

```bash
# Install dependencies
npm install
cd server && npm install

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# Database
cd server
npx prisma migrate dev --name init
npx prisma db seed  # Optional: seed demo data

# Run development (both client and server)
npm run dev

# Or run separately
npm run client:dev  # Client (port 3000)
npm run server:dev  # Server (port 5000)
```

## Access Points

| Panel        | URL                        | Role          |
|--------------|---------------------------|---------------|
| Customer App | http://localhost:3000     | Customer      |
| Admin Panel  | http://localhost:3000/admin | Admin, Manager |
| Kitchen Panel| http://localhost:3000/kitchen | Kitchen Staff |
| Waiter Panel | http://localhost:3000/waiter | Waiter        |

## Real-time Features

All panels are connected via Socket.io:

- **Customer** → places order → Kitchen receives it
- **Kitchen** → marks ready → Waiter receives it
- **Waiter** → serves order → Customer sees "Served"
- **Customer** → calls waiter → Waiter receives request
