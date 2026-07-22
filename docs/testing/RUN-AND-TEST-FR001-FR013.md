# AutoWash Pro — Run and test FR-001 to FR-013

## Requirements

- Java JDK 17 and Maven 3.9+
- Node.js 20+
- SQL Server on port 1433 and SSMS
- Database login: `sa` / `AutoWash@123456`
- Firebase web configuration in `Front-end/.env`
- Firebase Admin service account at `Back-end/src/main/resources/firebase-service-account.json`

## Start

1. Execute `Back-end/database/AutoWashPro.sql` in SSMS.
2. In `Back-end`, run `mvn clean test` and then `mvn spring-boot:run`.
3. In `Front-end`, run `npm install`, `npm run build`, then `npm run dev`.
4. Open `http://localhost:5173`. Swagger is at `http://localhost:8080/swagger-ui/index.html`.

The application has Customer, Washing Counter, and Admin portal buttons after login.

## Verification matrix

| FR | Test | Expected result |
|---|---|---|
| FR-001 | Register using a real Firebase phone OTP | Firebase ID token is verified by backend and customer is inserted |
| FR-002 | Login using phone and password | JWT is returned and automatically attached to protected API calls |
| FR-003 | Add, edit, set default and delete vehicles | Changes persist in `vehicles`; the final vehicle cannot be deleted |
| FR-004 | Move forward/backward through six booking steps | State is preserved; occupied slots come from SQL Server |
| FR-005 | Confirm booking | `bookings` and `booking_services` are inserted; backend price and VietQR are displayed |
| FR-006 | Complete a checked-in booking | Points are credited once and recorded in `point_history` |
| FR-007 | Complete bookings across tier thresholds | Member/Silver/Gold/Platinum changes based on spending; maintenance API expires old points |
| FR-008 | Redeem voucher and apply it to booking | Points are deducted transactionally; voucher locks, is restored on cancellation, or used on checkout |
| FR-009 | Use Washing Counter buttons | Only PENDING→CONFIRMED→CHECKED_IN→COMPLETED or allowed cancellation succeeds |
| FR-010 | Open Admin Customers | SQL-backed customer list/search and vehicle plates are shown |
| FR-011 | Open Admin Bookings | Server-side paginated booking log is returned with filters |
| FR-012 | Open Revenue/Audit | Revenue excludes non-completed bookings; point audit entries are shown |
| FR-013 | Create campaign | Campaign is stored; active date/tier multiplier affects checkout points |

## Important API test sequence

Use the JWT from `/api/v1/auth/login` as `Authorization: Bearer <token>`.

1. `POST /api/v1/bookings`
2. Three calls to `PATCH /api/v1/washing-counter/bookings/{id}/status` with `CONFIRMED`, `CHECKED_IN`, `COMPLETED`
3. `GET /api/v1/loyalty/customers/{id}/points`
4. `POST /api/v1/loyalty/vouchers/redeem`
5. `GET /api/v1/admin/revenue?period=month`

An attempt to skip a booking status or complete it twice must return an error and must not credit points twice.
