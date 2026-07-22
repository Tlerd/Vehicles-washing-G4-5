# AI Log — 2026-07-21 — Landing Page UI, Hero Booking Flow & Identity Gateway

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Scope:** Public Landing Page UI design, Hero section interactive widget, Identity Choice modal gateway, Branch showcase, and responsive navigation header.

---

## 1. Task & Objective

Design and implement the public-facing **Landing Page** for **AutoWash Pro**:
- Create an eye-catching, high-conversion landing page layout that immediately introduces the platform's core services.
- Implement an **Identity Choice Modal** on the "Book Now" CTA, allowing users to choose between:
  1. **Sign In** (for returning customers)
  2. **Register** (for new customers)
  3. **Continue as Guest** (quick booking without account creation)
- Display interactive branch cards with real-time availability badges and operational status.
- Showcase service packages (Combos & Single care items) with transparent "starting from Sedan pricing" tags.
- Provide a seamless responsive navigation header with dark/light mode toggle and bilingual support (Vi/En).

---

## 2. Component Structure & Architecture

### 2.1. Landing Page Sections
- **`Navbar` / Header:**
  - Sticky glassmorphic header (`backdrop-blur-md`).
  - Integrated `ThemeToggle` (Light/Dark mode) & `LanguageToggle` (Vi/En).
  - Person icon CTA opening Guest Overview / User Profile.
- **`HeroSection`:**
  - Dynamic headline, subtext, and quick action buttons.
  - Interactive "Book Now" CTA triggering the `IdentityChoiceModal`.
- **`BranchOverview`:**
  - Grid of active washing centers with addresses, contact hotlines, and operating hours.
  - Interactive branch selection routing directly to Step 1 of the Booking Wizard (`/booking?branchId=...`).
- **`ServicesPreview`:**
  - Visual cards showcasing popular wash combos (e.g. "Rửa xe bọt tuyết + Phủ Nano", "Dọn nội thất chuyên sâu").
- **`FeaturesSection`:**
  - Highlights: 15-minute slot precision, transparent pricing, automated SMS OTP, loyalty points accumulation.
- **`Footer`:**
  - Comprehensive footer with branch directory, terms of service, customer support hotline, and copyright.

### 2.2. Identity Choice Gateway (`IdentityChoiceModal`)
- Modal sheet presented when clicking "Book Now" from the Hero section:
  - **Option 1 (Đăng nhập):** Redirects to `/login?mode=signin`.
  - **Option 2 (Đăng ký):** Redirects to `/login?mode=register`.
  - **Option 3 (Đặt lịch không cần tài khoản):** Directs straight to `/guest/booking`.

---

## 3. Human Validation & Real Verification Evidence

- **Browser Verification:** Tested Landing Page rendering on local Vite dev server (`http://localhost:5173`).
- **Identity Choice Flow:** Verified all three CTA paths live in Google Chrome:
  - Clicking "Sign In" opens login modal.
  - Clicking "Register" opens registration form with Firebase OTP trigger.
  - Clicking "Guest Booking" bypasses auth and enters 6-step wizard as guest.
- **Responsive Layout Check:** Checked desktop (1440px), tablet (768px), and mobile (375px) breakpoints. Mobile menu drawer toggles cleanly without layout shifts.
- **Build Checks:**
  - `npx tsc --noEmit` exited 0 (clean type check).
  - `npm run build` emitted clean production bundle (`dist/`).

---

## 4. Key UI & Design Polish

- **Glassmorphic Styling:** Applied subtle background blurs (`backdrop-blur-lg`), semi-transparent surface cards, and sky-blue glowing borders.
- **Micro-Animations:** Added subtle hover scale transforms on CTA buttons and card elements using CSS transitions.
- **Accessibility & Performance:** Native image lazy-loading, semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<footer>`), and clean aria labels.
