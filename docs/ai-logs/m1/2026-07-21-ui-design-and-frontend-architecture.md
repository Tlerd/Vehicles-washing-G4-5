# AI Log — 2026-07-21 — UI/UX Design System & Frontend Component Architecture

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Scope:** Complete UI/UX design system overhaul, 3-layer CSS token architecture, Dark/Light mode theme engine, 6-step Booking Wizard UI, Customer Portal Console, and i18n support.

---

## 1. Task & UI/UX Vision

Design and implement a modern, high-end, responsive UI/UX for the **AutoWash Pro** vehicle washing & care web application:
- **Design Aesthetic:** Premium dark/light glassmorphic look with Sky-Blue primary accents, vibrant indicators, dynamic hover states, and smooth CSS micro-animations.
- **Design System Architecture:** Implement a clean 3-layer design token system in CSS/Tailwind 4 (`palette.css`, `theme.css`, `density.css`) ensuring component styling uses semantic tokens exclusively.
- **Core Interfaces:**
  1. **Public Landing Page & Hero Section:** Modern marketing page with branch overview, pricing showcase, and "Book Now" CTA modal.
  2. **6-Step Booking Wizard UI:** Interactive multi-step booking funnel (Branch selection → Service Grid & Modal → 15-min WeekGrid calendar → Vehicle picker → Pricing Review → Payment Checkout).
  3. **Customer Console Portal:** Unified layout hosting Dashboard, Garage Management, Loyalty Points & Tiers, Voucher Store, Booking History, and Live Booking Stepper.
  4. **Theme & i18n Controls:** Dark/Light theme toggle (flash-free pre-paint synchronous execution) and Vi/En language switcher.

---

## 2. UI Technical Details & Design System

### 2.1. 3-Layer Design Token Architecture
- **Layer 1 (`palette.css`):** Base color variables (`--color-sky-50` to `--color-sky-900`, dark mode `:root[data-theme="dark"]` overrides).
- **Layer 2 (`theme.css`):** Semantic tokens mapped to Tailwind v4 `@theme` (e.g., `--color-brand-primary`, `--color-surface-bg`, `--color-text-primary`, `--color-border-subtle`).
- **Layer 3 (`density.css`):** Spacing, border-radius, shadows, and typography density utilities (`D-24`).

### 2.2. Core UI Components & Micro-Interactions
- **`ServiceIconGrid` & `ServicePickerSheet`:** Grid layout separating COMBO package cards from SINGLE service chips, with modal detail sheets for service descriptions.
- **`WeekGrid` Slot Calendar:** Sticky-header weekly schedule grid (8 columns × 44 rows) representing 15-minute slot intervals from 07:00 to 18:00 with real-time slot availability badges.
- **`ThemeToggle` & `LanguageToggle`:** Accessible header actions with instant visual feedback and smooth CSS transitions.
- **`CustomerLayout` Sidebar & Navigation:** Responsive sidebar menu with active state highlights, role guards, and breadcrumbs.

---

## 3. Screen Inventory & UX Flows

| Screen / Component | Route | Key UI Features |
| :--- | :--- | :--- |
| **Landing Page** | `/` | Hero section, Branch locator map, Service highlights, Identity choice modal |
| **Booking Wizard** | `/booking` | 6-step progress indicator, Service modal picker, 15-min calendar grid, dynamic total calculator |
| **Login / Register** | `/login` | Dual-tab login/register modal, E.164 phone validation, OTP resend countdown timer |
| **Customer Dashboard** | `/app` | Quick action cards, upcoming booking status card, tier progress bar |
| **Garage Manager** | `/app/garage` | Vehicle cards, brand logo badges, default vehicle indicator, Add/Edit modal sheet |
| **Loyalty & Points** | `/app/points` | Points summary, tier status progress (`Silver` / `Gold` / `Platinum`), history table |
| **Vouchers & Rewards** | `/app/vouchers` | Redeemable coupon cards, voucher code copy button, expiry badges |
| **Booking History** | `/app/history` | Filterable booking cards by status (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) |

---

## 4. Verification & Responsive Evidence

- **Type Safety Check:** `npx tsc --noEmit` passed cleanly with 0 type errors across all UI components and styling scripts.
- **Vite Build Verification:** `npm run build` completed cleanly; CSS output bundled without selector syntax errors.
- **Responsive Layout Verification:** Verified UI layouts on mobile (375px), tablet (768px), and desktop (1440px) breakpoints with zero horizontal overflow or overlapping text.
- **Theme Switching:** Tested Dark and Light modes on all screens; confirmed contrast ratios satisfy WCAG AA readability standards.

---

## 5. UI Polish & Accessibility Highlights

- **Pre-paint Flash Prevention:** Theme preference is read synchronously from `localStorage` before DOM render in `index.html` to eliminate white FOUC (Flash of Unstyled Content).
- **Smooth Animations:** Integrated `motion` CSS transitions for modals, side sheets, step changes, and tab navigation.
- **Interactive Feedback:** Hover scale transforms, active ring focus borders, and aria-accessible controls across all interactive elements.
