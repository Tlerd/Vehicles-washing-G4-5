# Design — Customer Front-End Rebuild on the Landing Stack

> Date: 2026-07-21 · Approved direction by: Đức Anh (owner)
> Supersedes stack choices in PLAN-V2 §3.1 where they conflict. Business rules
> (D-01…D-26) still govern behavior.

## 1. Goal & scope

Rebuild the customer-facing Front-end from scratch, using the landing page in
`Front-end/autowash-pro (1)` as the design source and the new standard stack.
Decision D-24 ("làm lại FE từ đầu") already approved the rewrite; the legacy FE
is recoverable from git (BASELINE.md → commit `1c2d744`).

Owner amendments to the original proposal:

- **Payment gateway = payOS** (VietQR PRO), replacing every VNPAY reference. See
  §6 and decision **D-27** in `docs/plans/00-QUYET-DINH-REFACTOR.md`.
- **FR-013 is IN, minus the AI**: build the campaign / point-multiplier promotion
  builder as plain admin CRUD (no AI generation).
- If the database needs changes for the above, update the schema/migrations.
- Ask the owner whenever information is missing mid-build.

Out of scope for the customer rebuild: admin & counter portals (separate track),
AI generation of any kind.

## 2. Standard stack

| Concern | Choice |
| :-- | :-- |
| Build | Vite 6 + React 19 + TypeScript |
| Style | Tailwind CSS 4 (`@theme`) via `@tailwindcss/vite` |
| Server state | TanStack Query |
| Client state (wizard) | Zustand |
| Form + validation | react-hook-form + zod |
| Date/time (GMT+7) | date-fns + date-fns-tz |
| Icons | lucide-react |
| Router | react-router-dom v7 |
| Animation | `motion` (v12, imported from `motion/react`) |
| Auth | Firebase Phone OTP + Google (Phase 2) |

The landing page ships `framer-motion` imports while depending on `motion`; the
port fixes these to `motion/react`.

## 3. Color tokens — 3 layers inside Tailwind 4

PLAN-V2 §2 assumed Tailwind 3 + CSS variables. On Tailwind 4 we keep the same
3-layer discipline but express Layer 2 through `@theme`:

- **Layer 1 — palette** (`src/styles/palette.css`): raw `--p-brand-*`,
  `--p-neutral-*`, status colors, taken from the landing page's Sky-Blue palette.
  The ONLY file to edit when the palette changes.
- **Layer 2 — semantic** (`@theme` in `src/styles/theme.css`): `--color-primary`,
  `--color-surface`, `--color-text-primary`, `--color-border`, slot-state colors,
  each mapped from Layer 1. Never referenced with a raw hex.
- **Layer 3 — density** (`src/styles/density.css`): `data-density="comfortable"`
  for customer, `data-density="compact"` for admin/counter (D-24).

Rule carried into review: components use only semantic `--color-*` / Tailwind
theme classes — no hex, no `--p-*`.

## 4. Folder structure (per PLAN-V2 §3.2, rebuilt in `Front-end/src`)

```
src/
├── app/            router.tsx · providers.tsx · layouts/(Public·Customer·Admin·Counter)
├── styles/         palette.css · theme.css · density.css
├── components/ui/  Button Card Modal Sheet Chip Badge Input Select Skeleton
│                   EmptyState Stepper PriceTag Countdown Toast
├── components/domain/ ServiceIconGrid ServicePickerSheet WeekGrid SlotCell
│                   CartBar BookingCard VehicleCard TierProgress
├── features/       auth · booking · customer · (admin promo = FR-013 non-AI)
├── lib/            api/ · firebase.ts · money.ts · slot.ts · datetime.ts · mock/
└── types/          DTO-aligned types
```

## 5. Data strategy

Phase 1–2 run on **local mock services** (in-memory, seeded from
`landingData.ts` + `docs/design/02-CATALOG-DICH-VU.md`) wrapped in TanStack Query
hooks. Swapping to the real API later is a one-file change per domain
(`lib/api/*`). Matches PLAN-V2 §3.3 (Đợt 1 & 2 need no backend). Guests may book
but earn no points / no vouchers / no feedback (D-09).

## 6. Payment — payOS (replaces VNPAY)

- Backend (Java/Spring) calls the payOS REST API; checksum is HMAC-SHA256 over
  the sorted request/webhook payload.
- Config is **environment only**: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`,
  `PAYOS_CHECKSUM_KEY`. Never committed. The credentials shown in the owner's
  screenshot must be rotated (exposed).
- Flow: create payment link (deposit by tier, D-26) → redirect to payOS →
  webhook confirms → booking auto-confirms only when funds received (D-19).
- DB change vs PLAN-V2 §4: replace VNPAY IPN handling with a `payments` table
  keyed by payOS `orderCode` + webhook idempotency; `bookings.deposit_amount` /
  `paid_amount` unchanged. Detail deferred to Phase 3 with a migration.

## 7. Firebase Phone OTP (Phase 2, researched)

Enable Phone provider in Firebase console (authorized domains incl. localhost) →
invisible `RecaptchaVerifier` → `signInWithPhoneNumber(auth, e164, verifier)` →
`confirmationResult.confirm(code)`. Test numbers configured in console for dev.
E.164 normalization shared across the 3 call sites (fixes bug #4). Google
Sign-In as the alternate provider with account linking (D-20).

## 8. Phased delivery

- **Phase 1 (this session, must run):** stack + tokens + router + 4 layouts + UI
  kit + landing page as public home + 6-step booking wizard (D-08 order:
  Branch → Service → DateTime → Vehicle → Review → Confirm) with `ServiceIconGrid`
  (D-05) and `WeekGrid` 15-min slots (D-15), guest booking (D-09), mock data.
  **Done = `npm --prefix Front-end run build` exits 0 and dev renders landing → wizard.**
- **Phase 2:** auth (OTP/Google), dashboard, garage (vehicles CRUD), points,
  vouchers, history, check-in / complete (D-01), feedback (#13).
- **Phase 3:** real API + payOS deposit + soft-hold polling; FR-013 admin promo
  CRUD (non-AI); DB migrations.

## 9. Definition of done (per PLAN-V2 §8, per PR)

Runs with no console errors · 4 states (loading/empty/error/success) · component
≤ 300 lines · no `any` · no hex in components · tested at 375px and 1440px ·
touch targets ≥ 44px.
