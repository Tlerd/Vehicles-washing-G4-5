# Test guide — FR-005 to FR-009

## 1. Prepare

1. Run `Back-end/database/AutoWashPro.sql` in SSMS.
2. Put a valid `firebase-service-account.json` in `Back-end/src/main/resources`.
3. Start backend: `cd Back-end` then `mvn spring-boot:run`.
4. Start frontend: `cd Front-end`, run `npm install`, then `npm run dev`.
5. Register/login and add at least one saved vehicle before opening Booking.

Default database location: `localhost:1433`, database `autowash_pro`. Supply a
dedicated least-privileged login through `Back-end/.env`; no password is stored
in this document.

## 2. FR-005 — booking and VietQR

Use the six-step wizard, choose a saved vehicle, service `wc1`–`wc5`, branch, future date and an available time. Confirm. Expected: database receives `bookings` and `booking_services` rows; payment step displays the booking reference, exact backend total and VietQR.

## 3. FR-006 and FR-007 — points and tier

In Swagger (`http://localhost:8080/swagger-ui/index.html`), call:

`PATCH /api/v1/washing-counter/bookings/{id}/status` in this order with bodies:

```json
{"status":"CONFIRMED"}
```

```json
{"status":"CHECKED_IN"}
```

```json
{"status":"COMPLETED"}
```

Expected: points are credited once, a row is added to `point_history`, spend/wash totals update, and tier changes at 3,000,000 / 7,000,000 / 15,000,000 VND. Calling COMPLETED twice is rejected.

## 4. FR-008 — voucher

Call `POST /api/v1/loyalty/vouchers/redeem`:

```json
{"customerId":1,"voucherType":"DISCOUNT_50K","pointsCost":500}
```

Expected: points decrease atomically and an ACTIVE voucher valid for three months is created. Pass its `voucherId` while creating a booking to lock and apply it. Cancellation returns it to ACTIVE; checkout changes it to USED.

## 5. FR-009 — washing queue

Call `GET /api/v1/washing-counter/queue?date=YYYY-MM-DD`. Test valid transitions `PENDING → CONFIRMED → CHECKED_IN → COMPLETED` and cancellation from PENDING/CONFIRMED. Invalid skips are rejected with HTTP 400.

All protected endpoints require the JWT returned by login: `Authorization: Bearer <token>`.
