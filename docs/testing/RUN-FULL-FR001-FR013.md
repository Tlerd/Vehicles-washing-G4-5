# AutoWash Pro — Run and test

## 1. Upgrade the existing SQL Server database

In SSMS select `autowash_pro` and run only:

`Back-end/database/FR001_FR013_upgrade_migration.sql`

Do not rerun the complete `AutoWashPro.sql` against an existing database.

## 2. Start backend

Use JDK 17, then from `Back-end` run:

```powershell
mvn clean spring-boot:run
```

The first successful start creates these local test accounts when absent:

| Role | Phone | Password |
|---|---|---|
| STAFF | `0900000001` | `Staff@123` |
| ADMIN | `0900000002` | `Admin@123` |

Change these passwords before deploying outside a local test machine.

## 3. Start frontend

From `Front-end` run:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. A browser reload keeps a valid logged-in session.

## 4. Roles

- CUSTOMER sees only the customer portal.
- STAFF sees only the washing counter and can progress booking states.
- ADMIN sees only administration, reports, logs and campaigns.
- Backend returns HTTP 403 for a role that calls a forbidden API directly.

## 5. Booking and payment

- District 1 is bookable. District 7 is coming soon and disabled.
- One customer may have only one PENDING or CONFIRMED booking.
- Service duration determines the occupied start/end interval.
- An ACTIVE unexpired voucher may be applied and becomes LOCKED.
- Estimated and credited points use final cash paid after the voucher.
- VietQR is manual payment. Configure the real bank details in `application.properties` before accepting money.

