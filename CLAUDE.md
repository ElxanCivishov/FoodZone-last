# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoodZone is a full-stack restaurant QR menu & ordering system. Customers scan a QR code on their table, browse the menu, and place orders. Staff access separate panels for admin, kitchen, and waiter workflows.

## Commands

### Development
```bash
npm run dev              # Start both client (port 3000) and server (port 5000) concurrently
npm run client:dev       # Client only
npm run server:dev       # Server only (tsx watch)
```

### Build & Type Check
```bash
npm run client:build     # tsc + vite build
npm run type-check       # TypeScript check (client)
npm run type-check:server  # TypeScript check (server)
npm run lint             # ESLint (client)
```

### Database (run from root, delegates to server/)
```bash
npm run db:push          # Push schema changes without migration history
npm run db:migrate       # Create and apply a migration
npm run db:seed          # Seed the database
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

### Monorepo Layout
- `src/` — React/TypeScript frontend (Vite, port 3000)
- `server/` — Express/TypeScript backend (tsx watch, port 5000)
- `server/prisma/` — Prisma schema + migrations + seed

In development, Vite proxies `/api` to `http://localhost:5000`, so the frontend uses relative `/api` paths. Socket.io connects directly using `VITE_API_URL` (empty string in dev = same host).

### Required Environment Variables

**Server (`server/.env`):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Token signing secret
- `CLIENT_URL` — CORS origin (default: `http://localhost:3000`)
- `PORT` — Server port (default: 5000)

**Client (`.env`):**
- `VITE_API_URL` — Socket.io server URL (empty in dev, set for production)

### Data Model Hierarchy

```
Restaurant → Branch → Category → Product
                   → Table → Order → OrderItem
                   → WaiterRequest
                   → CashDrawer / Shift
                   → Customer / PromoCode / Reservation
```

All `Product`, `Category` records carry multilingual name/description fields: `nameAz`, `nameEn`, `nameRu`, `nameTr`. The `name` field holds the canonical/display value.

### User Roles & Access

Roles in order of privilege: `super_admin > admin > manager > kitchen > waiter/staff`

- `super_admin` bypasses all role checks server-side (`auth.ts:isSuperAdmin`)
- `/admin/*` — admin, manager
- `/kitchen` — admin, manager, kitchen
- `/waiter` — admin, manager, waiter, staff

Auth is JWT. The token is stored in `localStorage` under key `token` and auto-attached via an Axios request interceptor (`src/services/api.ts`). `authStore` (Zustand, persisted as `fz_auth`) holds user/token state client-side.

### Frontend Routing

`App.tsx` defines four route zones:

| Path | Component | Notes |
|---|---|---|
| `/` | `CustomerFlow` | Screen-based SPA (no URL changes) |
| `/login` | `LoginScreen` | Shared staff login |
| `/admin/*` | `AdminApp` | Sub-router with sidebar navigation |
| `/kitchen` | `KitchenPanel` | Fullscreen kanban board |
| `/waiter` | `WaiterPanel` | Fullscreen order/request view |

**Customer flow is screen-based**, not URL-based. `uiStore.currentScreen` drives which component renders. The flow is: `qr-scan → language → welcome → home → product-detail → cart → checkout → order-success / order-tracking`. Session data (restaurantId, branchId, tableId) lives in `sessionStore`.

**Admin panel** uses URL sub-routing: `/admin/:tab`. The active tab maps to a view component inside `AdminApp.tsx`. Navigation sections are defined in `src/components/admin/navigation.ts`.

### State Management (Zustand stores)

| Store | Purpose |
|---|---|
| `authStore` | JWT auth, persisted to localStorage |
| `uiStore` | Customer screen navigation, global loading |
| `sessionStore` | QR session: restaurantId, branchId, tableId |
| `cartStore` | Shopping cart items |
| `kitchenStore` | Kitchen panel order state |
| `waiterStore` | Waiter panel orders + requests |
| `themeStore` | Dark/light theme, persisted |
| `notificationsStore` | Admin in-app notifications |

### Real-time (Socket.io)

`src/services/socket.tsx` exports a `SocketProvider` and `useSocketContext()` hook. Clients call `joinRoom(branchId, role, userId)` after connecting. The server emits branch-scoped events defined in `server/src/events/socketEvents.ts`. Event names are defined in `src/utils/constants.ts` as `SOCKET_EVENTS`. The `io` instance is attached to every Express request as `req.io` for use inside route handlers.

### API Conventions

All API responses follow `ApiResponse<T> = { success: boolean; data: T; message?: string }`. The Axios instance in `src/services/api.ts` unwraps `response.data` automatically, so callers receive `ApiResponse<T>` directly. A 401 response auto-redirects to `/login`.

### Server Route Map

```
/api/qr            — QR code generation & validation
/api/branches      — Menu data (categories, products)
/api/orders        — Order CRUD & status transitions
/api/waiter-requests — Waiter call system
/api/auth          — Login / token
/api/dashboard     — Aggregated stats
/api/upload        — Image uploads (multer, served from /uploads)
/api/staff         — Staff CRUD
/api/settings      — Global & per-branch settings
/api/cash          — Cash drawer open/close/reconcile
/api/inventory     — Stock movements & alerts
/api/shifts        — Shift open/close & reports
/api/promo         — Promo codes
/api/notifications — In-app notifications
/api/customers     — CRM (loyalty points, history)
/api/reservations  — Table reservations
/api/audit         — Audit log
/api/feedback      — Customer feedback & ratings
```

### Internationalization

4 languages: `az` (Azerbaijani, default), `en`, `ru`, `tr`. Translation files live in `src/i18n/`. The active language is saved to `localStorage` as `fz_language`. All UI strings use `useTranslation()` — never hardcode user-visible text.

### Scheduled Jobs

`server/src/jobs/scheduler.ts` (started via `startScheduler(io)` in `index.ts`) runs background tasks with `node-cron` — e.g. sending low-stock alerts and expiring promo codes.

### Path Alias

`@/` resolves to `src/` in both Vite and TypeScript configs.
