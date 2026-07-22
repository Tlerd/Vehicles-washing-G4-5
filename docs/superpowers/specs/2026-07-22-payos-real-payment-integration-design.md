# Design: Real PayOS payment integration (replaces demo VietQR self-confirm)

Date: 2026-07-22
Status: Draft, revised after a 4-lens adversarial review (security,
data-migration, API-contract, test-coverage) — pending owner approval
Related: `docs/plans/00-QUYET-DINH-REFACTOR.md` (D-26, D-27),
`docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md` §6,
`docs/srs/FR-005-booking-checkout-vietqr-payment.md`

## 1. Why, and relationship to existing docs

The team's own decision log (D-27) already decided real payments go through
**payOS**, replacing VNPAY. That was never implemented — the shipped code
instead has a demo mechanism: `BookingManagementService` builds a
`https://img.vietqr.io/...` image URL string on the fly, and the customer
self-confirms payment by clicking a button that just flips a `Payment` row's
status, with no real gateway involved at all.

**FR-005** (`docs/srs/FR-005-booking-checkout-vietqr-payment.md`) is stale
relative to both the current code and D-27: it describes VNPAY, a tiered
**deposit** (50k/200k/500k per D-26), a `PENDING_DEPOSIT` booking status, and
15-minute bay/slot holds gated on deposit payment. None of that exists in the
current implementation, which creates bookings as immediate `PENDING` with
the **full** total price due, no slot-hold-on-payment mechanic.

**Explicit scope decision for this work (confirmed with the owner)**: this
integration charges the **full booking total** via payOS — not the D-26
deposit tiers — and does **not** introduce `PENDING_DEPOSIT` or payment-gated
slot holds. This is a deliberate, scoped simplification that matches what's
actually shipped today, not a full reconciliation of FR-005/D-26. FR-005's
text remains stale after this work; rewriting it is out of scope here.

## 2. Goals

1. Replace the demo self-confirm VietQR flow with a real payOS-created
   payment link per booking (`payments.provider = "PAYOS"`).
2. Frontend shows a real, client-rendered QR from payOS's own `qrCode` data,
   an "Open payment page" button using payOS's real `checkoutUrl`, and a
   payment status sourced only from a real gateway status check.
3. Payment status is authoritative only from payOS's own
   get-payment-link-information API (server-to-server), polled on demand —
   never trusted from anything the frontend sends.

## 3. Non-goals (explicitly out of scope this pass)

- D-26 deposit tiers, `PENDING_DEPOSIT` booking state, slot holds tied to
  payment.
- A webhook/IPN receiver. PayOS webhooks require a publicly reachable URL,
  which isn't available for local dev; this phase uses polling only
  (confirmed with the owner). Deferred to a future phase if the app is ever
  deployed somewhere PayOS can reach.
- Rewriting FR-005/the "v2 flow" doc to match reality.
- The admin interface (separately, explicitly deferred already).
- Response-signature verification on payOS's replies (defense-in-depth only
  — our outbound call is already over TLS to payOS directly; signature
  verification matters most for inbound webhooks, which don't exist in this
  phase). Noted as a possible future hardening step, not built now.
- **`expiredAt`/payment-link expiry enforcement.** payOS returned
  `expiredAt: null` in every verified call (no expiry was requested). This
  design does not request or enforce a payment-link expiry, and does not
  attempt to coordinate one with the existing slot-hold-expiry machinery.
  A `PENDING` payment can be paid at any time after booking creation. This
  is an explicit, accepted scope boundary, not an oversight — full
  hold/expiry coordination is the deposit-tier design's job (§3, already
  out of scope) and would meaningfully grow this pass.
- **Automatic reconciliation of a payOS link that was created successfully
  on payOS's side but never got recorded locally** (e.g. our request
  timed out on the way back). §5.4 adds a bounded mitigation (a
  compensating check-and-cancel attempt) but does not add a scheduled
  reconciliation job. Documented as an accepted residual risk in §8.

## 4. Verified PayOS API contract

Verified with five live calls against the configured merchant account
during design across two credential sets (each test payment link was
immediately cancelled as cleanup — confirmed via the cancel call's
`"status":"CANCELLED"` response each time). **The account behind the
configured credentials is confirmed by the owner to be a live/production
PayOS merchant account tied to a real bank account, and the owner has
explicitly chosen to proceed with it.** Any payment link this code creates
once deployed is a real, payable link.

### 4.1 Create payment link

`POST https://api-merchant.payos.vn/v2/payment-requests`
Headers: `x-client-id`, `x-api-key`, `Content-Type: application/json`.

Request body:
```json
{
  "orderCode": 884713244,
  "amount": 2000,
  "description": "AWP-TEST01",
  "cancelUrl": "http://localhost:5173/app/booking/cancel",
  "returnUrl": "http://localhost:5173/app/booking/return",
  "signature": "<hmac>"
}
```

`signature` = `HMAC_SHA256(checksumKey, "amount=<amount>&cancelUrl=<cancelUrl>&description=<description>&orderCode=<orderCode>&returnUrl=<returnUrl>")`,
hex-encoded, fields in exactly that (alphabetical) order. **Verified working
against the live API, twice, across two different credential sets.**

Verified response (fields confirmed present, values from a real test call):
```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "bin": "970416",
    "accountNumber": "...",
    "accountName": "...",
    "amount": 2000,
    "description": "CSSW5YI4T28 AWPTEST01",
    "orderCode": 884713244,
    "currency": "VND",
    "paymentLinkId": "69ebd1c890c44491b6ca8eff186ac0b1",
    "status": "PENDING",
    "expiredAt": null,
    "checkoutUrl": "https://pay.payos.vn/web/69ebd1c890c44491b6ca8eff186ac0b1",
    "qrCode": "00020101021238600010A000000727013000069704160116..."
  },
  "signature": "<hmac over data>"
}
```

**Important, empirically discovered behavior**: PayOS silently transforms
`description` — it strips characters like `-` and prepends its own tracking
token (our sent `"AWP-TEST01"` came back as `"CSSW5YI4T28 AWPTEST01"`), and
description has a short length budget (looked like PayOS's documented ~25
chars). **Consequence for this design**: `description` is cosmetic only —
it is not reliable for programmatically matching a payment back to a
booking, and must never be relied on for that. `orderCode` is the real,
untouched, reliable key, which is why this design uses our own `payment_id`
as `orderCode` (see §5).

### 4.2 Get payment link information

`GET https://api-merchant.payos.vn/v2/payment-requests/{orderCode}`
Headers: `x-client-id`, `x-api-key`. No body/signature needed for GET.

Verified response:
```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "id": "69ebd1c890c44491b6ca8eff186ac0b1",
    "orderCode": 884713244,
    "amount": 2000,
    "amountPaid": 0,
    "amountRemaining": 2000,
    "status": "PENDING",
    "createdAt": "2026-07-22T16:24:06+07:00",
    "transactions": [],
    "canceledAt": null,
    "cancellationReason": null
  },
  "signature": "<hmac over data>"
}
```

Real, observed `status` values: `PENDING`, `PROCESSING`, `CANCELLED`
(triggered live). `PAID` is payOS's documented success value (not triggered
live in this session since nothing was actually paid). **This design's
status vocabulary is exactly these four values — see §5.3's revised
constraint; the earlier draft speculatively included `FAILED`, which no
verified call ever produced and no code path would ever write, and has been
removed to avoid a dead, unreachable state.**

The response carries more than just `status`: `amountPaid`,
`amountRemaining`, `canceledAt`, `cancellationReason`, and `transactions`
were all verified present. §5.6 now persists the ones with real
support/debugging value.

### 4.3 Cancel payment link

`POST https://api-merchant.payos.vn/v2/payment-requests/{orderCode}/cancel`
Body: `{"cancellationReason": "..."}`.

Verified response: same shape as §4.2 with `status: "CANCELLED"`,
`canceledAt` populated, `cancellationReason` echoed back.

## 5. Backend design

### 5.1 Config (env-only secrets, matching `autowash.jwt.secret` convention)

`application.properties` additions:
```properties
autowash.payos.client-id=${PAYOS_CLIENT_ID}
autowash.payos.api-key=${PAYOS_API_KEY}
autowash.payos.checksum-key=${PAYOS_CHECKSUM_KEY}
autowash.payos.base-url=${PAYOS_BASE_URL:https://api-merchant.payos.vn}
autowash.payos.return-url=${PAYOS_RETURN_URL:http://localhost:5173/app/booking/return}
autowash.payos.cancel-url=${PAYOS_CANCEL_URL:http://localhost:5173/app/booking/cancel}
autowash.payos.connect-timeout-ms=${PAYOS_CONNECT_TIMEOUT_MS:5000}
autowash.payos.read-timeout-ms=${PAYOS_READ_TIMEOUT_MS:10000}
```
No defaults for the three secrets (app fails fast at startup if unset, same
posture as `JWT_SECRET` today). A new `PayOsProperties`
(`@ConfigurationProperties(prefix = "autowash.payos")`, plain
getters/setters — matches the existing `SystemAccountSeedProperties`
precedent, not `@Value` fields) holds these.

**Review fix (security M1)**: explicit connect/read timeouts are now part
of the config, applied to the `RestClient`'s underlying `ClientHttpRequestFactory`.
Without them, a hanging payOS response would hold open a pooled DB
connection for the duration of the call (`create()` and `refreshStatus()`
are both `@Transactional`), risking connection-pool exhaustion under
payOS slowness combined with concurrent requests.

### 5.2 New `PayOsClient`

Uses Spring's built-in `RestClient` (no new HTTP dependency — already
available via `spring-boot-starter-web` on Boot 3.5) and `javax.crypto.Mac`
for HMAC-SHA256 (JDK built-in).

```java
public interface PayOsClient {
    PayOsPaymentLink createPaymentLink(long orderCode, BigDecimal amount, String description);
    PayOsPaymentLinkStatus getPaymentLinkInfo(long orderCode);
    void cancelPaymentLink(long orderCode, String reason); // best-effort, see §5.5
}
```
- `amount` converted to a whole-VND `long` via **`BigDecimal.longValueExact()`**
  (review fix, api-contract H7/test-coverage HIGH) — not a plain
  `longValue()`/implicit narrowing. `Booking.totalPrice` is produced at
  scale 0 everywhere it's set (`BookingManagementService.create()` already
  calls `.setScale(0, RoundingMode.HALF_UP)` on every price component), so
  `longValueExact()` should never throw in practice — but it converts a
  latent "this invariant broke somewhere upstream" bug into a loud,
  immediate `ArithmeticException` (mapped to `ServiceUnavailableException`
  by the caller) instead of silently truncating a real charge amount. A
  unit test exercises a deliberately non-integer-scale input to prove the
  guard actually throws (§7).
- `description` = the booking reference (e.g. `AWP-XXXXXXXX`), accepted as
  best-effort human context — not relied on for lookups (§4.1).
- Any non-2xx response, timeout, or unexpected shape throws the **existing**
  `ServiceUnavailableException` (`com.autowashpro.exception.custom`, already
  mapped to HTTP 503 in `GlobalExceptionHandler`) — reused as-is, no new
  exception type needed.
- **Review fix (api-contract H5)**: `getPaymentLinkInfo`'s return type
  (`PayOsPaymentLinkStatus`) carries `status`, `amountPaid`, and
  `cancellationReason` — not just `status` — so callers can persist the
  richer, verified fields (§5.6).

### 5.3 `payments` table migration (additive)

New file `Back-end/database/FR005_payos_payment_integration_migration.sql`,
with the same header block as existing migrations
(`SET ANSI_NULLS ON` / `SET QUOTED_IDENTIFIER ON`, required for the filtered
unique index below) and the same guarded/idempotent style:
```sql
USE [autowash_pro]  -- and separately against autowash_pro_test, per existing convention
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF COL_LENGTH('dbo.payments', 'order_code') IS NULL
    ALTER TABLE dbo.payments ADD order_code BIGINT NULL;
GO
IF COL_LENGTH('dbo.payments', 'checkout_url') IS NULL
    ALTER TABLE dbo.payments ADD checkout_url NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.payments', 'qr_code') IS NULL
    ALTER TABLE dbo.payments ADD qr_code NVARCHAR(MAX) NULL;
GO

-- Existing rows from the retired demo self-confirm flow used 'SUCCESS';
-- migrate them to the new vocabulary BEFORE tightening the constraint.
UPDATE dbo.payments SET status = 'PAID' WHERE status = 'SUCCESS';
GO

-- Review fix (data-migration CRITICAL): pre-existing 'PENDING' rows from the
-- demo flow (e.g. the real booking_ref AWP-6968C119 recorded in PROGRESS.md)
-- have no order_code and can never be completed through payOS — there is no
-- real payOS link behind them. Left as PENDING, PaymentServiceImpl.refreshStatus
-- would call getPaymentLinkInfo(null) and NPE on unboxing. Mark them CANCELLED
-- so refreshStatus's null-guard (§5.6) short-circuits cleanly instead.
UPDATE dbo.payments SET status = 'CANCELLED' WHERE order_code IS NULL AND status = 'PENDING';
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_payments_status')
    ALTER TABLE dbo.payments DROP CONSTRAINT CK_payments_status;
GO
-- Review fix (api-contract HIGH): 'FAILED' removed — no verified payOS
-- response ever returns it and no code path in this design would ever write
-- it; keeping it would be a dead, unreachable state with no UI branch.
ALTER TABLE dbo.payments ADD CONSTRAINT CK_payments_status
    CHECK (status IN ('PENDING','PROCESSING','PAID','CANCELLED'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_payments_order_code' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE UNIQUE INDEX UX_payments_order_code ON dbo.payments(order_code) WHERE order_code IS NOT NULL;
GO
```
`provider` (existing `VARCHAR(20)`) is set to `"PAYOS"`; `provider_txn_ref`
(existing `VARCHAR(100)`) stores payOS's `paymentLinkId` (a UUID-like
string, fits). `status` now stores payOS's own vocabulary directly
(`PENDING`/`PROCESSING`/`PAID`/`CANCELLED`) rather than the old
`PENDING`/`SUCCESS` — this is a breaking contract change to
`BookingResponse.paymentStatus`'s possible values, called out explicitly
since the frontend (owned end-to-end in this repo) must change in lockstep.

**Review fix (data-migration MEDIUM — explicit task, not implied)**: the
JPA entity `Back-end/src/main/java/com/autowashpro/entity/Payment.java`
must be updated in the same change to add `orderCode` (`Long`),
`checkoutUrl` (`String`), `qrCode` (`String`) fields with `@Column`
mappings — it has none of these today. Called out here as its own explicit
implementation task so it isn't missed.

**Review fix (data-migration MEDIUM — documented assumption)**: `order_code`
is our own `payment_id`, assumed unique forever from payOS's perspective.
This holds as long as the `payments` table's `IDENTITY` sequence is never
reset (row deletes don't reset it; only a table drop/recreate would). Given
this hits the owner's live merchant account, this assumption is recorded
here explicitly rather than silently relied upon — no extra namespacing
code is added for it in this pass, since the actual risk (a full table
drop/recreate against a live-linked production merchant account) would
already be an unusual, deliberate operational action, not an accidental one.

### 5.4 `BookingManagementService.create()`

Replaces the ad-hoc VietQR string construction:
1. Save the `Booking` and its services (unchanged).
2. Save a `Payment` row (`provider="PAYOS"`, `amount=total`,
   `status="PENDING"`, `createdAt=now`) to obtain its auto-generated
   `payment_id` — **this becomes the payOS `orderCode`**, guaranteed unique
   by our own PK, no separate sequence needed.
3. Call `payOsClient.createPaymentLink(paymentId, total, bookingRef)`.
4. On success, update the same `Payment` row with `orderCode=paymentId`,
   `checkoutUrl`, `qrCode`, `providerTxnRef=paymentLinkId`; save.
5. The whole method stays `@Transactional` (already is) — if step 3 throws
   `ServiceUnavailableException`, the booking, its services, and the
   payment row all roll back together. The customer sees "payment gateway
   temporarily unavailable, please try again" rather than a booking that
   can never be paid.

**Review fix (security HIGH — orphan payment link)**: because `orderCode`
is decided by us *before* calling payOS (it's our own `payment_id`), a
failure in step 3 is ambiguous — payOS may have created the link
server-side even though our client never got a usable response (e.g. a
read timeout after the server-side write). Left alone, this would roll
back our local rows while an untracked, live, payable link survives on
payOS. **Mitigation added**: on any `createPaymentLink` failure, before
propagating `ServiceUnavailableException`, make one best-effort
`getPaymentLinkInfo(paymentId)` call; if it succeeds and shows a link
exists, follow with a best-effort `cancelPaymentLink(paymentId, "rolled back locally")`.
Both calls are wrapped so any of their own failures are logged and
swallowed — the original `ServiceUnavailableException` is still thrown
either way, so booking creation still fails/rolls back cleanly for the
customer. This bounds (does not eliminate) the orphan-link window to
"payOS's own two calls to itself both also failed," and is logged loudly
(`orderCode`, both attempt outcomes) if that rare case happens, so it's at
least discoverable rather than silent.

**Review fix (security HIGH — rate limiting on booking creation)**:
`BookingController.create()` (`POST /api/v1/bookings`) has no rate limit
today. Because a failed `create()` fully rolls back, the existing "one
active PENDING/CONFIRMED booking per customer" guard never engages on
retries — nothing bounds how many times a script could call this endpoint,
each attempt hitting payOS's live create-link API. **Added**: the same
`RateLimiter`/`Scope.AUTHENTICATED_PRINCIPAL` pattern already used for
availability/lookup, e.g. 10 booking-creation attempts per hour per
customer — generous for legitimate retry-after-failure use, bounded
against abuse.

The old `bankCode`/`accountNumber`/`accountName` `@Value` fields and the
VietQR URL-building code are removed (no longer used by anything).

`toResponse()` now reads `checkoutUrl`, `qrCode`, `paymentId`,
`paymentReference` (=`providerTxnRef`), `paymentStatus` (=`status`) from the
`Payment` row exactly as it does today for the old fields — same lookup
pattern (`paymentRepository.findByBookingBookingId`), just different
columns. `BookingResponse.vietQrUrl` is **removed** (replaced by
`checkoutUrl` + `qrCode`) — this is our own internal contract, not an
external stable API, so no deprecation shim is needed.

### 5.5 Booking cancellation cancels the payOS link and reconciles local status

In `BookingManagementService.transition()`, when a booking moves to
`CANCELLED` and its payment is still `PENDING`/`PROCESSING`:
1. Call `payOsClient.cancelPaymentLink(payment.getOrderCode(), "Booking cancelled")`
   wrapped in try/catch — log a warning and continue on failure, never
   block the booking cancellation itself on payOS being reachable.
2. **Review fix (security HIGH / api-contract HIGH — was ambiguous in the
   original draft)**: regardless of step 1's outcome, set
   `payment.status = "CANCELLED"` locally and save. The previous draft only
   described the best-effort payOS call and never explicitly stated the
   local status write, which left a real gap: a customer has no reason to
   call `refresh-status` on a booking they just cancelled, so without this
   explicit local write the payment could sit `PENDING` forever even
   though both the booking and (usually) payOS itself have moved on. If a
   late payment does land on a payOS link we already marked locally
   cancelled, `refreshStatus`'s next real call will surface the
   discrepancy (payOS says `PAID`, we said `CANCELLED`) as a **visible,
   logged mismatch** rather than a silent one — this is the accepted,
   documented handling for this pass (no automated fund-reconciliation
   workflow is built; see §3 non-goals and §8).

This closes a real correctness gap (a cancelled booking must not leave an
active, payable link sitting open, nor a permanently-stale local payment
status) using the already-verified cancel endpoint (§4.3).

### 5.6 `PaymentController` / `PaymentService`

`PATCH /api/v1/payments/{paymentId}/confirm` (self-confirm) is **removed**,
replaced by:

```java
@PostMapping("/{paymentId}/refresh-status")
public BookingResponse refreshStatus(@PathVariable Long paymentId, @AuthenticationPrincipal String callerId)
```

`PaymentServiceImpl.refreshStatus(paymentId, callerCustomerId)`:
1. Load the payment, verify `payment.getBooking().getCustomer().getCustomerId()`
   equals the caller (same ownership check as today's `confirmPayment`,
   including the guest-booking null-safe fail-closed behavior).
2. **Review fix (data-migration CRITICAL — null-guard)**: if
   `payment.getOrderCode() == null` (a pre-migration legacy row that the
   §5.3 migration didn't already mark `CANCELLED`, or any future
   defensive case), throw `BadRequestException` ("This payment has no
   linked payment gateway record.") — never call `payOsClient` with a
   null/unboxed value.
3. Call `payOsClient.getPaymentLinkInfo(payment.getOrderCode())`.
4. Update `payment.status` from the **real** payOS response only (never
   from any client-supplied field — the endpoint takes no request body at
   all). **Review fix (api-contract HIGH)**: also persist `amountPaid` and
   `cancellationReason` from the same response — reusing the payments
   table's existing, currently-unused `ipn_payload NVARCHAR(MAX)` column to
   store the full raw JSON response body from this call (support/debugging
   traceability, no new column needed). Save, return
   `bookingManagementService.toResponse(booking)`.

Rate-limited via the **existing** `RateLimiter` component/
`Scope.AUTHENTICATED_PRINCIPAL` (same pattern `BookingController` already
uses for availability/lookup), e.g. 30 requests/min per customer — generous
for a 5s auto-poll plus manual clicks, but bounded so a customer's frontend
can't hammer payOS's live API unbounded.

## 6. Frontend design

- `lib/api/bookings.ts`: `Booking`/`BookingApiResponse` drop `vietQrUrl`,
  add `checkoutUrl: string | null`, `qrCode: string | null`. Keep
  `paymentId`/`paymentReference`/`paymentStatus` (now payOS's 4-value
  vocabulary: `PENDING`/`PROCESSING`/`PAID`/`CANCELLED` — no `FAILED`, per
  §5.3's revised constraint, so the frontend has no dead state to render).
- `lib/api/payments.ts`: `useConfirmPayment` → `useRefreshPaymentStatus`,
  calling `POST /payments/{id}/refresh-status`.
- New dependency `qrcode.react` (small, pure client-side QR rendering,
  matches the owner-approved decision to render the QR from payOS's raw
  string on the frontend rather than adding another external image-service
  dependency on the backend). **Review fix (api-contract MEDIUM)**:
  rendered with an explicit size (≥220px) and error-correction level `"M"`
  or `"Q"` — payOS's EMVCo QR payload runs 150–300+ characters, and the
  library's bare defaults can render an unscannably dense/small code at
  that payload length.
- `BookingWizardPage.tsx` success screen:
  - Primary visual: `<QRCodeSVG value={booking.qrCode} size={240} level="M" />`
    when `qrCode` is a non-empty string.
  - **Fallback / secondary, always shown when `checkoutUrl` looks like a
    real payOS checkout link**: an "Open payment page" button
    (`window.open(booking.checkoutUrl, '_blank', 'noopener,noreferrer')`),
    shown even if the QR renders fine — per the original ask, this is the
    more reliable path since it doesn't depend on the customer's device
    successfully scanning a QR. Validation is `https://` **and** hostname
    ending in `payos.vn` (review fix, api-contract LOW — tightened from a
    bare "any https URL" check, matching the actually-observed
    `https://pay.payos.vn/web/...` format). If `qrCode` is missing/empty or
    `checkoutUrl` fails validation, the corresponding element is skipped
    entirely rather than rendered broken — never a fabricated QR or fake
    link.
  - Amount, and PayOS's own transformed description are both shown (the
    latter labeled clearly as "may differ slightly on your bank
    statement," per the §4.1 finding — no false claim that it exactly
    matches the booking reference).
  - Status badge maps `PENDING`/`PROCESSING` → neutral/warning tone,
    `PAID` → success, `CANCELLED` → danger. (No `FAILED` branch needed —
    see above.)
  - "Check payment status" button (manual `useRefreshPaymentStatus` call)
    + auto-poll every 5s via `refetchInterval` while status is
    `PENDING`/`PROCESSING`, stopping once `PAID`/`CANCELLED` or after a
    capped number of attempts (avoid indefinite background polling if the
    customer leaves the tab open).
  - The previous pass's "this is a demo, self-confirmed" notice is
    **removed** (this is now real money, not a demo — that notice would be
    actively misleading) and replaced with a short, accurate statement that
    payment is processed by payOS against a real bank account — exact copy
    finalized with i18n keys during implementation.
  - Double-submit guard (from the previous pass) kept on the "Check
    payment status" action for consistency, even though refresh-status is
    idempotent by nature — prevents redundant calls to payOS's live API
    from a rapid double-click.
  - Loading/error states: booking-creation failure (already handled,
    unchanged, now also covering the new booking-creation rate limit as a
    friendly "too many attempts, try again shortly" message), `refresh-status`
    network/503 error (friendly retry message, distinct from "still
    pending" which isn't an error), and an invalid/missing `checkoutUrl`
    (button not rendered, with a short inline note, never a dead link).
  - Accessibility: the button is a real `<button>` (not a bare clickable
    `<div>`), keyboard-focusable, with visible text (no icon-only control),
    meets standard tap-target sizing already used elsewhere in this
    component.

## 7. Testing plan

- `PayOsClient`'s HMAC signing: unit test against a **fixture** key/input
  (not the real production checksum key) with a manually pre-computed
  expected digest. Because HMAC-SHA256 output is fully sensitive to input
  order/content, a single correct fixture is sufficient to catch any
  field-order or field-set regression — not just "some signature is
  produced."
- `PayOsClient` HTTP behavior: tested via Spring's `MockRestServiceServer`
  (already available through `spring-boot-starter-test`), verifying request
  headers/body shape and response-to-DTO mapping — no live network calls in
  automated tests.
- **Review fix (test-coverage HIGH)**: a dedicated test for the
  `BigDecimal` → `long` amount conversion using `longValueExact()` with a
  deliberately non-integer-scale input (e.g. a `totalPrice` of
  `100000.50`), asserting it throws rather than silently truncates.
- `BookingManagementServiceTest`: extend the existing `create()` tests with
  a mocked `PayOsClient` — assert the `Payment` row gets `orderCode` =
  `paymentId`, `checkoutUrl`/`qrCode` from the mocked response, and that a
  `ServiceUnavailableException` from the client rolls back the whole
  transaction (no `Booking` row ends up persisted). **Review fix
  (test-coverage CRITICAL)**: additional cases for (a) the compensating
  check-and-cancel attempt on `createPaymentLink` failure (§5.4), and (b)
  `transition()` to `CANCELLED` with a mocked `PayOsClient` that throws on
  `cancelPaymentLink` — asserting the booking still transitions to
  `CANCELLED` and the local `payment.status` is still set to `CANCELLED`
  despite the payOS call failing.
- `PaymentServiceImplTest`: rewritten for `refreshStatus` — ownership,
  guest-booking fail-closed, null-`orderCode` guard (§5.6 step 2), and
  status/amountPaid/cancellationReason-mapping-from-mocked-client cases.
- **Review fix (test-coverage HIGH)**: an explicit rate-limit test for the
  new booking-creation limit and the `refresh-status` limit, following the
  existing `BookingControllerRateLimitTest` precedent in this repo (rather
  than assuming coverage is "inherited" with no test asserting it).
- `GlobalExceptionHandlerTest`: no new case needed (`ServiceUnavailableException`
  → 503, `BadRequestException` → 400 already covered).
- **Review fix (test-coverage MEDIUM — required manual gate, not just
  typecheck/build)**: per this repo's own prior-phase convention (live
  Chrome verification before calling UI work done), a required manual
  walkthrough of all four frontend states before considering this pass
  complete: (1) normal QR + checkout button render, (2) missing/empty
  `qrCode` (QR block skipped, button still shown), (3) auto-poll
  transitioning a status badge after a manual `refreshStatus` change in the
  DB, (4) double-submit guard (rapid double-click on "Check payment
  status" fires exactly one network call).
- **Review fix (test-coverage LOW — go-live checklist item, not an
  automated test)**: one final real-money end-to-end manual transaction
  (create a real booking → actually pay the small resulting amount via the
  real QR/checkout link → call refresh-status → observe `PAID`) is a
  required gate before treating this integration as production-ready,
  separate from and in addition to all automated/mocked tests above.

## 8. Rollout / risk notes

- **This uses the owner's live PayOS merchant account.** Confirmed and
  explicitly accepted by the owner. Any payment link created by this code
  from this point on is real and payable.
- No PayOS secret is ever placed in frontend code, logs, README, or
  committed source — only read server-side from environment variables via
  `PayOsProperties`.
- Existing `.env`/`.env.example` already have the three `PAYOS_*` keys
  (previously vestigial/unused) — no new secret needs to be added, only
  wired into `application.properties`.
- **Accepted residual risk (from review)**: in the rare case where our
  `createPaymentLink` call fails AND the compensating check-and-cancel
  attempt (§5.4) also fails, an untracked live payOS link could survive
  with no local record. This is logged loudly when it happens but not
  automatically reconciled — full reconciliation (e.g. a scheduled sweep
  against payOS's link-listing capability) is out of scope for this pass
  (§3). Given this hits a live merchant account, the owner should
  periodically glance at the payOS dashboard for unexpected open links,
  especially soon after this ships.
- **Accepted residual risk (from review)**: a payment that completes on
  payOS *after* its booking has already been locally marked `CANCELLED`
  (§5.5) is not automatically refunded or flagged beyond the next
  `refresh-status` call surfacing the mismatch in logs. No automated
  refund workflow exists or is planned in this pass.
