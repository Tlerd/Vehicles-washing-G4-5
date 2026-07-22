# AI log — 2026-07-21 — Front-end rebuild, Phase 1 (landing + booking wizard)

## Task
Rebuild the customer Front-end from the landing page in
`Front-end/autowash-pro (1)`, on a standardized modern stack, and get a runnable
vertical slice (public landing + 6-step booking wizard). Owner amendments:
payOS instead of VNPAY, keep FR-013 minus AI, research Firebase OTP, adjust DB
if needed, ask when information is missing. FR-013 itself not built this phase.

## Human validation
Owner (Đức Anh) approved the direction and the two blocking decisions via
in-chat questions: scope = full customer rebuild; stack = adopt the landing
stack (React 19 + Tailwind 4 + Vite 6). Design recorded at
`docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md`.

## What was done
- Adopted the landing app as the new `Front-end/` base; replaced React 18 /
  Tailwind 3 / react-router 7 stack with React 19 + Tailwind 4 (`@theme`) +
  Vite 6 + TanStack Query + Zustand + react-hook-form/zod + date-fns +
  react-router 7 + motion. Old `src` recoverable from git (BASELINE.md).
- 3-layer color tokens inside Tailwind 4: `src/styles/palette.css` (Layer 1,
  Sky-Blue from the landing page), `theme.css` (Layer 2 `@theme` semantic),
  `density.css` (Layer 3, D-24). Components reference semantic tokens only.
- Restructured to `app/ styles/ components/ui components/domain features/ lib/
  types/` per PLAN-V2 §3.2. Fixed the landing page's broken `framer-motion`
  imports to `motion/react`.
- Landing page as public home route; Navbar / Hero booking widget CTAs now route
  to `/booking`.
- Booking wizard (D-08 order: Chi nhánh → Dịch vụ → Ngày giờ → Chọn xe → Xem lại
  → Xác nhận): Zustand store, ServiceIconGrid (D-05, combo vs single),
  ServicePickerSheet modal, WeekGrid 15-min slots (D-15), size-aware pricing
  recomputed at review (D-08/BR-001), deposit tiers (D-26), guest booking (D-09),
  inline "chọn thêm dịch vụ" reminder (D-16). Served by local mock data
  (`src/lib/mock`) wrapped in TanStack Query — no backend dependency.
- Recorded decisions D-27 (payOS replaces VNPAY, env-only secrets) and D-28
  (FR-013 minus AI) in `docs/plans/00-QUYET-DINH-REFACTOR.md`.

## Evidence (this session)
- `npm install --legacy-peer-deps` → added 106 packages, 0 vulnerabilities.
- `npx tsc --noEmit` → exit 0 (no type errors).
- `npm run build` (vite v6.4.3) → exit 0, 2569 modules, `dist/` emitted
  (JS 747 kB / gzip 237 kB; chunk-size warning only, non-blocking).
- `npm run dev` served HTTP 200; browser (Claude-in-Chrome) rendered `/`
  (landing) and `/booking` (wizard steps 1–3: branch list, icon grid + picker
  sheet, week grid) with **no console errors**. Screenshots captured.

## Accepted
All of the above (verified building + rendering).

## Rejected / deferred
- payOS real integration + `payments` table migration → Phase 3 (backend).
- Firebase OTP / Google auth, customer dashboard, garage, points, vouchers,
  history, feedback (#13) → Phase 2.
- FR-013 admin promotion CRUD (non-AI) → Phase 3.
- Did NOT delete the source `Front-end/autowash-pro (1)/` folder (owner-provided;
  now integrated, safe to remove when the owner confirms).
- No git commit made (not requested).

## Security note
The payOS credentials in the owner's screenshot (Client ID / API Key / Checksum
Key) are exposed and must be rotated. They will be environment-only
(`PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`), never committed.

## Related files
`Front-end/**` (new src, package.json, vite/tsconfig, index.html),
`docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md`,
`docs/plans/00-QUYET-DINH-REFACTOR.md`.
