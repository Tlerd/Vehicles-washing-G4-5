# AI log — Payment/QR flow completion (admin UI excluded by instruction)

Date: 2026-07-22
Milestone: m1
Scope: this turn only completes the payment and VietQR flow already begun in
the previous session's demo-flow pass. Per explicit instruction, the admin
interface was NOT started, edited, or scaffolded in this turn.

## Inspection performed before editing

Read the existing payment surface end-to-end before changing anything, to
avoid creating a duplicate API:
- `Back-end/src/main/java/com/autowashpro/controller/PaymentController.java`
  — already exposes `PATCH /api/v1/payments/{paymentId}/confirm`.
- `Back-end/src/main/java/com/autowashpro/service/impl/PaymentServiceImpl.java`
  — already implements ownership checks (JWT-derived caller vs.
  `payment.getBooking().getCustomer()`) and a row-locked re-read
  (`findByBookingIdForUpdate`) before flipping `PENDING` → `SUCCESS`.
- `Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java`
  `toResponse()` — already builds the VietQR URL from `bankCode`/
  `accountNumber`/`accountName` config plus the booking's exact
  `totalPrice` and `bookingRef` as the transfer content (`addInfo`).
- `Front-end/src/features/booking/BookingWizardPage.tsx`,
  `Front-end/src/lib/api/payments.ts` — already wired the QR image, a
  status badge, and an "I've paid" button to the real confirm endpoint.

Conclusion: the core payment API and its authorization model were already
correct and complete from the prior pass. No new backend endpoint was
needed. This turn's work was closing real gaps in what the frontend *showed*
and *guarded*, plus adding missing verification/tests and explicit demo-flow
disclosure.

## Gaps found and fixed

1. **Mislabeled "transfer content."** The success screen displayed the
   internal `paymentReference` (a `PAY-XXXXXXXX` id used only for the
   confirm API call) under the label "Mã thanh toán," which a user could
   mistake for what they need to type into their banking app. The VietQR's
   actual `addInfo` field — the real bank transfer content — encodes the
   **booking reference** (`AWP-XXXXXXXX`), not the payment reference. Fixed
   by showing both, correctly labeled: "Nội dung chuyển khoản" ("Transfer
   content") = `booking.bookingRef` (matches the QR), and "Mã thanh toán nội
   bộ" ("Internal payment reference") = `booking.paymentReference`, shown
   separately as internal/secondary information.
   `Front-end/src/features/booking/BookingWizardPage.tsx`.
2. **No payable amount shown.** The requirement explicitly asks for the
   amount to be visible alongside the QR/status; the success screen
   previously showed neither. Added `formatVND(booking.totalPrice)` next to
   the QR/status card.
3. **No explicit demo-flow disclosure in the UI.** The Swagger tag already
   said "demo-ready," but nothing told the customer, on-screen, that this is
   self-confirmation with no bank webhook. Added a visible notice line under
   the payment card (i18n key `wizard.success.payment.demoNotice`, vi/en),
   and mirrored the statement into `PaymentController`'s `@Operation`
   description and a new Javadoc block on `PaymentService`.
4. **No frontend double-submit guard.** The backend's row lock already made
   a double confirm safe (second call gets a `BadRequestException`), but the
   frontend had no client-side guard beyond React Query's `isPending` flag,
   which updates asynchronously and does not close the window between two
   rapid clicks. Added a `useRef` flag (`hasSubmittedConfirm`) set
   synchronously before `mutate()` and cleared in `onSettled`, so a second
   click before re-render is a no-op rather than a second network call.
5. **No test verifying actual QR contents.** Nothing previously asserted
   that the generated VietQR URL contains the correct bank code, account
   number, account name, the *exact* VND amount (not a decimal-suffixed
   value), and the booking reference as transfer content — only that a URL
   existed. Extended
   `BookingManagementServiceTest.create_persistsPendingPaymentAndResponseSurfacesPaymentFields`
   with explicit content assertions (`.contains("VCB-1234567890-compact2.png")`,
   `.contains("amount=100000")`, `.contains("addInfo=" + bookingRef)`,
   `.contains("accountName=VINAWASH")`, `.doesNotContain("100000.00")`).
6. **New payment/status strings were hardcoded Vietnamese**, inconsistent
   with the rest of this component (which already uses `useTranslation`
   with real i18n keys in `booking.json`). Moved them into
   `Front-end/src/i18n/locales/{vi,en}/booking.json` under
   `wizard.success.payment.*` and `wizard.success.statusPanel.*`.

## What was confirmed already correct (not changed)

- **Authorization**: `confirmPayment` derives ownership purely from the
  JWT-authenticated principal and the payment's linked booking's customer —
  never from any client-supplied field. The request body carries no status.
  A payment on a guest booking (`customer == null`) fails closed (403), not
  with a null-pointer.
- **Never trusting frontend-sent status**: the PATCH endpoint takes no body
  at all beyond the path `paymentId` — there is no field the frontend could
  even attempt to set to force a status.
- **Secrets**: grepped every touched file for password/secret/API-key/token
  patterns — no matches. No credentials were added to source, README, or
  logs in this pass.

## Validation evidence

- `mvn -f Back-end/pom.xml -q test -Dtest=PaymentServiceImplTest,
  CustomerServiceImplTest,BookingManagementServiceTest` — exit 0.
- `& Back-end/run-tests.ps1` (full suite, live local SQL Server
  `autowash_pro_test`) — **246 run, 1 failure, 8 errors**, identical in
  location and count to the previous pass: all nine are in
  `AvailabilityRepositoryIntegrationTest` and
  `BookingConcurrencyPrimitivesIntegrationTest`, both already
  modified/uncommitted in the working tree before this session and before
  the previous session — confirmed unrelated to payment/QR work via
  `git status` (neither file nor anything they depend on was touched here).
- `npm --prefix Front-end run typecheck` — exit 0, no errors.
- `npm --prefix Front-end run build` — exit 0, clean production build.

## Remaining limitations (explicitly out of scope, not defects)

- This is still a **self-confirmation demo flow** — no real bank/VNPAY
  webhook, IPN handler, or reconciliation job exists. `Payment.ipnPayload`
  remains unused. Stated explicitly in both the UI and the API docs per
  instruction #5.
- The known N+1 payment lookup inside `toResponse()`'s hot path (flagged in
  the prior pass's review) was not addressed — out of scope for this
  payment/QR-only pass.
- **Admin interface was not started, edited, or scaffolded in this turn**,
  per explicit instruction. Awaiting confirmation before beginning that
  work.

## Files changed

Backend: `service/PaymentService.java` (doc only),
`controller/PaymentController.java` (doc/OpenAPI description only),
`test/java/.../BookingManagementServiceTest.java` (added QR-content
assertions).

Frontend: `features/booking/BookingWizardPage.tsx` (payment card rework:
amount, corrected transfer-content labeling, demo notice, double-submit
guard, i18n), `i18n/locales/vi/booking.json`, `i18n/locales/en/booking.json`
(new `payment`/`statusPanel` keys under `wizard.success`).

## APIs used (no new endpoints added)

- `PATCH /api/v1/payments/{paymentId}/confirm` (pre-existing, from the prior
  session) — customer self-confirms their own pending payment.
- `GET /api/v1/bookings/customer/{customerId}` (pre-existing) — used by the
  success screen's "refresh status" panel to reflect real booking status
  changes (e.g. a staff confirmation) without a page reload.
