# Demo-fast FE/API connection — 2026-07-22

## Task

The owner requested a fast demo pass, explicitly deferring tests, and asked for
the current progress to be logged. The scope was limited to connecting the
existing React booking wizard to the backend contract already available in the
repository.

## Changes

- `Front-end/src/lib/api/client.ts` now falls back to
  `http://localhost:8080/api/v1` when `VITE_API_BASE_URL` is not provided and
  removes a trailing slash before composing paths.
- `Front-end/src/lib/api/bookings.ts` now loads branches from the minimized,
  public `GET /api/v1/branches` endpoint. Catalog services, availability,
  customer vehicles, login, and the authenticated legacy booking create route
  remain real API calls.

## Evidence and limits

- Repository source inspection confirmed the frontend API base, auth-token
  propagation, CORS allow-list, branch endpoint, catalog routes, availability
  adapter, vehicle CRUD, and booking create route.
- Tests, typecheck, production build, and browser E2E were intentionally not
  run in this demo-priority pass per the owner instruction.
- The backend lifecycle-expiry implementation is still uncommitted and its
  test suite is intentionally deferred; the Backend + Swagger gate remains
  open. This log is not final FR traceability evidence.

## Manual demo setup

1. Start SQL Server and the backend with the existing environment-only
   configuration.
2. Start Vite from `Front-end` (`npm run dev`).
3. Open `http://localhost:5173/login`, sign in with a configured customer, then
   open `/app/booking`.
4. The wizard reads branches/services/availability and vehicles from the API;
   confirming a booking uses the current authenticated `POST /api/v1/bookings`
   compatibility route.
