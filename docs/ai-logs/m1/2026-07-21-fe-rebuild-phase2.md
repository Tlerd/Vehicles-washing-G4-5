# AI log — 2026-07-21 — Front-end rebuild, Phase 2 (auth, customer console, theme, i18n)

## Task
Continue the FE rebuild into Phase 2: Firebase auth (OTP + Google), customer
console (dashboard, garage, points, vouchers, history, check-in/complete +
feedback), a dark/light theme toggle, a Vietnamese/English language toggle,
automatic local DB provisioning so the backend runs, and a clean, verified FE
build so future sessions don't need to re-audit it from scratch. Ultracode was
enabled mid-session; the user explicitly asked for sub-agent use, so the bulk
of the parallelizable build (i18n sweep + 6 feature pages) ran through a
Workflow, with foundation/shared-file work and final integration done directly.

## Human validation
Owner (Đức Anh) provided: the local SQL Server `sa` password (verbal, in chat —
used only to write a gitignored `Back-end/.env`, never echoed back); a Firebase
service-account JSON file path (`C:\Users\nguye\Downloads\washpro-116cd-...json`,
moved into the gitignored `Back-end/src/main/resources/firebase-service-account.json`,
left in place in Downloads per owner's explicit instruction); and the Firebase
Web SDK config pasted directly in chat (`Front-end/.env`). Owner confirmed
"resume" after a workflow mid-run session-limit interruption; workflow resumed
from cache once the limit reset (verified via system clock, not assumed).

## What was done
- **DB**: applied both idempotent migrations (`FR001_FR013_upgrade_migration.sql`,
  `FR004_booking_duration_migration.sql`) to the existing local `autowash_pro`
  SQL Server DB via `sqlcmd` (Windows Auth). Verified `customers.role`,
  `bookings.end_time`/`duration_minutes` now present.
- **Backend run automation**: `Back-end/run-local.ps1` loads `Back-end/.env`,
  auto-generates `JWT_SECRET` on first run if absent, requires `DB_PASSWORD` to
  be set, then runs `mvn spring-boot:run`. Verified live: backend started in
  4.5s, Hikari pool connected, **Firebase Admin SDK initialized successfully**,
  Tomcat on :8080.
- **Theme (dark/light)**: 3-layer token architecture already in place from
  Phase 1 made this a Layer-1-only change — `palette.css` gained a
  `:root[data-theme="dark"]` override block; zero changes needed to `theme.css`
  (Layer 2) or any component. `app/theme.ts` (Zustand store, localStorage-backed)
  + `ThemeToggle` component; `index.html` applies the theme synchronously
  pre-paint (no flash).
- **i18n (vi/en)**: `i18next` + `react-i18next`, 10 namespaces (`common`,
  `landing`, `booking`, `auth`, `dashboard`, `garage`, `points`, `vouchers`,
  `history`, `feedback`), Vietnamese as primary/fallback language.
  `LanguageToggle` component, persisted choice.
- **Firebase auth**: `lib/firebase.ts` (Phone OTP via invisible
  `RecaptchaVerifier` + `signInWithPhoneNumber`, Google via `signInWithPopup`),
  `AuthContext` (`onAuthStateChanged`), `LoginPage`, shared E.164 phone util
  (`lib/phone.ts`, bug #4 — single source of truth, also now used by the
  booking wizard's own phone validation instead of a duplicate regex).
- **CustomerLayout + router**: authed shell with nav + theme/lang toggles,
  redirects to `/login` preserving intended path; router now serves `/login`
  and `/app`, `/app/garage`, `/app/points`, `/app/vouchers`, `/app/history`,
  `/app/bookings/:id` under `CustomerLayout`.
- **Workflow (background, resumed once after a session-limit interruption)**:
  i18n-swept all Phase 1 landing + booking-wizard components (also fixed
  several `bg-white`/`text-red-500` dark-mode-unsafe classes and one leftover
  `console.log` found along the way); built 6 Phase 2 pages (Dashboard, Garage,
  Points, Vouchers, History, BookingDetail) against a documented mock-data
  contract (`lib/mock/customer.ts`, `customerApi.ts`) I authored first so the
  parallel agents shared one schema. 18 agents total, 0 build errors, 26 review
  findings (code + security review per feature, security review specifically
  for garage/points/vouchers/booking-detail per AGENTS.md's loyalty-points/
  booking-state-change sensitivity rule).
- **Findings triaged and fixed directly** (not delegated back to agents):
  - HIGH — Dashboard picked the first CONFIRMED/CHECKED_IN booking in array
    order, not the chronologically earliest; now sorts by dayKey+time.
  - HIGH — Voucher redeem "Confirm" button had no double-submit guard (a fast
    double-click could fire the points-deducting mutation twice); added a
    synchronous ref lock.
  - MEDIUM — Garage delete used one shared `deletingId` string across all rows,
    so confirming delete on row A while row B's delete was in flight could
    re-enable A's button and double-fire; now derives per-row state from
    `mutation.isPending && mutation.variables === id`.
  - HIGH (security, partially addressed) — `useCheckIn`/`useCompleteBooking`
    had no Idempotency-Key concept, per BR-028 (docs/srs/06-BUSINESS-RULES-V2.md)
    and UI-UX-SPEC §6.4 — verified both citations are real before acting.
    Added `lib/idempotency.ts` (`crypto.randomUUID()`) and threaded a stable
    per-booking key through both mutation hooks and `BookingDetailPage`'s
    calls, ready for Phase 3 to attach as the real `Idempotency-Key` header.
    Server-side 24h dedup storage is explicitly Phase 3 (no backend endpoint
    exists yet) — not attempted here, documented instead of overclaimed.
  - MEDIUM (security, deferred) — booking ownership (IDOR) isn't checked
    before check-in/complete. Correctly flagged as a backend authorization
    concern, not fixable in the FE mock layer without security theater — left
    as an explicit Phase 3 backend requirement.
  - MEDIUM — `ErrorState`/hardcoded Vietnamese "Đã xảy ra lỗi"/"Thử lại" now
    goes through `common` i18n namespace (was breaking the vi/en toggle for
    every error state across the app).
  - MEDIUM — `HistoryPage` double-applied padding on top of `CustomerLayout`'s
    own `<main>` padding.
  - MEDIUM — Booking-detail feedback star rating used `aria-pressed` on every
    star up to the selected value (misrepresenting a 1-5 single-value rating
    as multiple simultaneously "pressed" toggles); switched to
    `role="radiogroup"` / `role="radio"` / `aria-checked`.
  - LOW×3 (DRY) — `BookingStatus → Badge tone` was duplicated verbatim in
    Dashboard/History/BookingDetail; extracted to `lib/bookingStatusTone.ts`,
    also exported `Tone` from `Badge.tsx` instead of re-declaring it 3 times.
  - LOW×2 — unlocalized weekday abbreviations (always English `EEE` even in
    vi mode); `lib/datetime.ts` gained `formatBookingDayKey(dayKey, lang)`
    with `date-fns/locale` (`vi`/`enUS`), used by History and BookingDetail.
  - MEDIUM — Vouchers page dropped its header entirely during loading/error/
    empty states, unlike every sibling page; restructured to keep the header
    static and only swap the body.
  - LOW — Garage add/edit/delete mutations had no error feedback; added
    inline error text + two new i18n keys per language.
  - Found and fixed myself during manual browser verification (not from the
    workflow review): switching Login page tabs (Phone/Google) didn't clear
    a leftover validation error from the other tab.
- Skipped as genuinely low-value polish (logged, not silently dropped):
  `VouchersPage`'s points pill hand-rolling `Badge`'s styling instead of
  reusing the component.

## Evidence
- `sqlcmd` migration runs: 0 rows affected on already-applied guards, columns
  verified present.
- `mvn spring-boot:run` via `run-local.ps1`: live log shows `Started
  BackendApplication in 4.556 seconds`, `Firebase Admin SDK initialized
  successfully`, Tomcat on port 8080, Hikari pool connected to `autowash_pro`.
- `npx tsc --noEmit` (Front-end/): clean, 0 errors, run twice (after Workflow
  merge and again after the manual review-fix pass).
- `npm run build` (vite 6.4.3): clean, exit 0, 3166 modules, both before and
  after the fix pass.
- Browser (Claude-in-Chrome), dev server on :5174: landing page renders in
  **dark mode by default** (localStorage/OS-preference detection working),
  light-mode toggle instant; `/app` correctly redirects unauthenticated users
  to `/login`; `/login` renders both Phone-OTP and Google tabs; client-side
  phone validation fires correctly with **zero live Firebase network calls**
  for invalid input (deliberately avoided triggering a real OTP send / Google
  popup — no test phone number or Google account available in this
  environment); `/booking` wizard re-verified working with new header toggles,
  zero regressions. No console errors on any checked route.

## Accepted
All of the above.

## Rejected / deferred
- Full server-side Idempotency-Key dedup storage (BR-028) — no backend
  endpoint exists yet; Phase 3.
- Booking-ownership (IDOR) authorization check — backend concern, Phase 3.
- `VoucherCard`'s minor style duplication vs. reusing `Badge` — cosmetic,
  skipped.
- Did not attempt real Firebase Phone OTP or Google Sign-In end-to-end (no
  test phone number configured in the Firebase console, no throwaway Google
  account available); code path is verified up to the point of the live
  network call.
- No git commit made (not requested this session).

## Security notes
- The local `sa` password and the Firebase service-account private key both
  passed through this chat session. Both are now only in gitignored files
  (`Back-end/.env`, `Back-end/src/main/resources/firebase-service-account.json`)
  — verified via `git check-ignore`. Owner declined to delete the source
  Downloads copy of the service-account JSON; that's their call, noted here
  for visibility.
- `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY` remain blank in `Back-end/.env`
  pending rotation (per the D-27 log entry from Phase 1) — still not wired to
  any code path.

## Related files
`Front-end/src/app/**`, `Front-end/src/features/auth/**`,
`Front-end/src/features/customer/**`, `Front-end/src/lib/**`,
`Front-end/src/i18n/**`, `Front-end/src/styles/palette.css`,
`Front-end/src/components/ui/{Badge,feedback}.tsx`, `Back-end/.env`,
`Back-end/run-local.ps1`, `Back-end/src/main/resources/firebase-service-account.json`.
