# Plan: Backend API and Swagger First

- Date: 2026-07-21
- Status: Owner-directed active plan. This document changes delivery order only;
  it authorizes no application code, database migration, or frontend change.
- Sources: `docs/srs/FR-004-booking-wizard-navigation.md`,
  `docs/srs/FR-005-booking-checkout-vietqr-payment.md`, and
  `docs/srs/06-BUSINESS-RULES-V2.md`.

## Gate and delivery order

### 1. Complete Backend/API for FR-004/FR-005 v2

- Guest booking and OTP verification.
- Bays, 15-minute slots, soft holds, and double-booking protection.
- `PENDING_DEPOSIT` booking lifecycle.
- VNPAY create, IPN, return, expiry, and hold release.
- RBAC, input validation, idempotency, and a stable error contract.

### 2. Complete Swagger/OpenAPI

- Every endpoint has documented request, success response, and error examples.
- Endpoints can be exercised in Swagger with the appropriate authentication.
- No booking, payment, or guest endpoint remains a stub or lacks a contract.

### 3. Verify the backend

- HTTP integration and security tests.
- Concurrent reservation test proving double booking is rejected.
- VNPAY IPN, expiry, and idempotency tests.
- Live verification against SQL Server with recorded evidence.

### 4. Start frontend only after the backend gate passes

Begin frontend work only when stages 1–3 are complete and the Swagger/API gate
has passed:

- Implement the real guest flow.
- Implement the 15-minute weekly calendar grid.
- Connect frontend and backend, then perform E2E verification.

## Scope boundary for this planning pass

This plan-change pass does **not** implement application code, database
migrations, or frontend changes. It preserves the existing worktree and does
not claim that backend APIs, Swagger, or the stated verification gates have
already passed.
