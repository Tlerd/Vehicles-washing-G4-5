# Project Tasks Backlog: AutoWash Pro

This document contains a structured list of development tasks for implementing the AutoWash Pro system, broken down by component and execution steps.

---

## Task 1: Scaffolding and Configurations
*   **[ ] Task 1.1: Package and Config Setup**  
    Initialize `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, and `postcss.config.js` in the `Front-end` folder. Set up default paths, build scripts, and ports.
*   **[ ] Task 1.2: Index HTML & Base Structure**  
    Create `index.html` referencing the primary entry point `src/main.tsx`. Pre-fetch Inter fonts from Google Fonts.

---

## Task 2: Core Styling and Theme Context
*   **[ ] Task 2.1: Global CSS Setup**  
    Create `src/index.css` importing Tailwind directives. Declare standard CSS glassmorphism classes (`.glass-card`, `.glass-input`) and primary brand buttons (`.btn-primary`, `.btn-secondary`).
*   **[ ] Task 2.2: Theme Context Provider**  
    Implement `ThemeContext.tsx` to handle dark/light mode toggles. Set the default state based on `localStorage` or browser preferences, synchronize it by appending the class `dark` to the HTML document root, and save state on toggle.

---

## Task 3: Twilio OTP Service Scaffolding
*   **[ ] Task 3.1: OTP Proxy Server**  
    Build a local Node.js Express server in `Back-end/otp-service/` with endpoints `/api/otp/send` and `/api/otp/verify`. Use Twilio Verify API client.
*   **[ ] Task 3.2: OTP Front-end Client**  
    Create API service methods in `src/services/otpService.ts` to call send and verify endpoints. Add helper function `formatToE164` to normalize Vietnamese phone number entries.

---

## Task 4: Extended State Layer (Mock DB)
*   **[ ] Task 4.1: Extended BookingContext**  
    Modify `src/context/BookingContext.tsx` to declare mock arrays for:
    *   `customers` (baseline registered users).
    *   `vehicles` (vehicle CRUD registry).
    *   `bookings` (wash appointments).
    *   `transactionLogs` (points ledger).
    *   `promotions` (active multiplier campaigns).
*   **[ ] Task 4.2: Mock Database Mutations**  
    Write state mutation methods inside `BookingContext`:
    *   `registerCustomer(name, phone, password, ...)`.
    *   `addVehicle(licensePlate, brand, size, notes, default)`.
    *   `checkInBooking(bookingId)`.
    *   `checkoutBooking(bookingId, actualPaid)`.
    *   `redeemVoucher(customerId, pointsCost, voucherType)`.
    *   `createCampaign(goal, tier, multiplier)`.

---

## Task 5: 6-Step Booking Wizard Implementation
*   **[ ] Task 5.1: Booking Header and Navigation**  
    Implement `BookingHeader.tsx` displaying the stepper indicator (`Size Xe` ➔ `Branch` ➔ `Date & Time` ➔ `Services` ➔ `Information` ➔ `Confirmation`). Make headers clickable to support back navigation. Add car size dropdown selector.
*   **[ ] Task 5.2: Step 1 (StepCarSize)**  
    Create size selection step with cards for Hatchback, Sedan, SUV, and Pickup. Set selection to state and auto-advance.
*   **[ ] Task 5.3: Step 2 (StepBranch)**  
    Create branch card selector (District 1 / District 7).
*   **[ ] Task 5.4: Step 3 (StepSchedule)**  
    Build date calendar slider (showing 7-14 slots depending on user tier) and 30-minute interval grid. Incorporate "Receive SMS reminder 1 day before" checkbox.
*   **[ ] Task 5.5: Step 4 (StepServices)**  
    Build services catalog with collapsable accordions. Add detailed description modal overlays for each service and a sticky checkout cart summary. Apply car size multipliers to prices.
*   **[ ] Task 5.6: Step 5 (StepContact)**  
    Implement contact form validating Name, SĐT, Biển số xe, and password fields (visible if "Create Account" checkbox is checked).
*   **[ ] Task 5.7: Step 6 (StepPayment)**  
    Implement booking verification and review:
    *   Show summary details cards with individual "Sửa" edit buttons.
    *   Generate a unique booking code, lock the voucher, and create a `PENDING` booking record only after the user clicks "Confirm & Submit Booking".
    *   Display bank transfer details page with generated VietQR image showing reference and amount.

---

## Task 6: Customer Dashboard
*   **[ ] Task 6.1: Dashboard Tab Navigation**  
    Create `CustomerDashboard.tsx` with sidebar layout matching the six tabs: Overview, Booking, Vehicles, Booking History, Loyalty & Points, Redeem Rewards, System Promotions.
*   **[ ] Task 6.2: Vehicles CRUD Panel**  
    Build grid listing vehicles and create form modal to Add/Edit/Delete vehicle records.
*   **[ ] Task 6.3: Loyalty Points Visualizer**  
    Design a graphical tier status bar showing current points, rolling 12-month washes, and progress to the next level. Show transaction tables and points expiring next month.
*   **[ ] Task 6.4: Rewards & Vouchers**  
    Build catalog listing 50k, free basic, and free detail wash vouchers with points price tag. Validate point balances before enabling "Redeem" button. Show new user first wash policy details.

---

## Task 7: Washing Counter Operational Portal
*   **[ ] Task 7.1: Operational Queue List**  
    Create `WashingCounterPage.tsx` loading all active booking records. Filter out completed/cancelled logs by default.
*   **[ ] Task 7.2: Action Workflows**  
    *   Implement "Approve" and "Reject" buttons for `PENDING` items.
    *   Implement orange "Check-in" button for `CONFIRMED` items, setting status to `CHECKED_IN`.
    *   Implement green "Checkout & Tích điểm" button for `CHECKED_IN` items, showing paid amount inputs, applying loyalty point crediting, locking vouchers, and validating tier transitions.

---

## Task 8: Admin Portal
*   **[ ] Task 8.1: Customer Directory**  
    Create customer registry list in `AdminPage.tsx`. Integrate search bar (name, phone, plate), filter dropdown (tier), and column headers for sorting (spent, points, date).
*   **[ ] Task 8.2: Customer Details Modal**  
    Clicking a customer row opens a modal showing profile update inputs, vehicle lists, and transaction logs.
*   **[ ] Task 8.3: Bookings Log with Infinite Scroll**  
    Build booking management feed in `AdminPage.tsx`. Use an intersection observer or container scroll listener to lazy-load subsequent pages of booking records (10 at a time).
*   **[ ] Task 8.4: Revenue Stats & Logs**  
    Render revenue total cards with buttons to aggregate statistics by Day, Month, and Year. Render points audit logs. Implement AI Campaign Form to create point promotions.
