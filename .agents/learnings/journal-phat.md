# Phat development journal

## 2026-07-13 — FR-001..FR-013 completion pass

- Added database-backed CUSTOMER/STAFF/ADMIN roles and role claims in JWT.
- Enforced backend route authorization and customer resource ownership.
- Restored authenticated sessions from local storage on browser reload.
- Removed the unsafe portal switcher; each role receives exactly one portal.
- Restricted production booking to District 1; District 7 is displayed as coming soon.
- Added active-booking rejection, voucher selection/locking and post-voucher point estimates.
- Corrected tier thresholds and added scheduled point expiration/monthly tier review.
- Added welcome/automatic reward vouchers and configurable VietQR information.
- Added an idempotent SQL Server upgrade migration.

