# AutoWash Pro Loyalty Engine & Admin Portals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining frontend portals and wizard upgrades for AutoWash Pro, including the 6-step Booking Wizard, Customer Dashboard with Vehicle CRUD, Washing Counter (LPR) portal, and the Admin Dashboard with search/filter/sort, infinite scroll, and income statistics.

**Architecture:** A multi-role single-page application with a top role-based selector ('customer' | 'washing_counter' | 'admin') rendering different dashboards. Central state is managed in an expanded React context (`BookingContext`) to simulate mock database records (bookings, customers, vehicles, promotions, vouchers, transaction logs).

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React (icons).

## Global Constraints
- **Language**: Single-language English UI.
- **Theme**: Dark/Light mode supported. Primary dark background is `#031427`.
- **Styling**: Modern minimal glassmorphism. Brand primary accent color is `#3b82f6` (blue) and `#f97316` (orange).
- **Stitch Rule**: Design mockups must be approved via Stitch before writing frontend code.
- **File limits**: Keep React component files under 300 lines.
- **Decoupling Rule**: Implement all features using local mock state inside `BookingContext.tsx` first. Do not make direct connection attempts to spring-boot backend until mock testing is validated.

---

## User Review Required

> [!IMPORTANT]
> The entire application will run completely offline on mock data embedded directly inside the extended `BookingContext.tsx` to verify full front-end capability independently before BE integration.

## Open Questions

> [!NOTE]
> No active blocker questions. We are proceeding with mock data inside `BookingContext.tsx` to enable offline verification as instructed.

---

## Proposed Changes

### Context Layer

#### [MODIFY] [BookingContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/BookingContext.tsx)
Expand context to manage global mock DB state:
- Customers registry (`Customer[]`)
- Vehicle list (`Vehicle[]`)
- Bookings records (`Booking[]`)
- Transaction audit logs (`TransactionLog[]`)
- Promotion list (`Promotion[]`)
- Functions to mutate this state: register customer, add/edit/delete vehicles, check-in booking, checkout booking, redeem voucher.

---

### UI Components & Navigation

#### [MODIFY] [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx)
Add top navigation role switcher to toggle between roles:
- `'customer'` (Customer Wizard or Dashboard based on session)
- `'washing_counter'` (Washing queue management portal)
- `'admin'` (System administration panel)

#### [MODIFY] [BookingPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/BookingPage.tsx)
Reorder booking wizard step rendering to accommodate Step 1 `StepCarSize.tsx`. Shift all subsequent steps down.

#### [MODIFY] [BookingHeader.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/BookingHeader.tsx)
Update the header step indicator to display 6 steps: `Size Xe` -> `Branch` -> `Date & Time` -> `Services` -> `Information` -> `Confirmation`. Ensure headers are clickable for backward navigation.

#### [NEW] [StepCarSize.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepCarSize.tsx)
Implement Step 1: Select car size group using 4 cards corresponding to Hatchback, Sedan, SUV, and Pickup. Set the selected size in context and advance to Step 2.

#### [MODIFY] [StepServices.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepServices.tsx)
Update combos selection interface to open in a modal/popup description window. Adjust prices using multipliers.

#### [MODIFY] [StepSchedule.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepSchedule.tsx)
Integrate checkbox for "Receive SMS/Email reminder 1 day before appointment".

#### [MODIFY] [StepPayment.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepPayment.tsx)
- Initial view: Show summary of previous choices (Branch, Date/Time, Contact, Services) with "Sửa" (Edit) buttons.
- Hide Booking ID and VietQR initially. Show "Confirm & Submit Booking" button.
- Click "Confirm": Verify customer has no other active booking, generate booking code, create record, lock voucher, and show Success view with VietQR.
- Cancellation is locked post-submission.

---

### Dashboard Portals

#### [NEW] [CustomerDashboard.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/dashboard/CustomerDashboard.tsx)
Create a 5-tab Customer Portal:
1. **Vehicles & Info**: Update profile info. Manage multiple vehicles (CRUD): license plate, brand, size, notes, default toggle.
2. **Booking History**: View list of customer bookings. No cancel buttons (cancellation not allowed).
3. **Loyalty & Points**: Visualizes current points balance, active tier progress bar, points expiring next month, and point transaction logs.
4. **Redeem Rewards**: Catalog to exchange points for vouchers (50k, Free Basic Wash, Free Detail Wash). Show New User voucher policy.
5. **System Promotions**: View active system campaigns.

#### [MODIFY] [AuthPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/auth/AuthPage.tsx)
Extend signup flow with Name, Password, Confirm Password, Phone (with mock OTP verification field), and Email (optional).

#### [NEW] [WashingCounterPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/washing-counter/WashingCounterPage.tsx)
Create Washing Counter Portal queue list:
- If `PENDING`: Render "Approve Appointment" and "Reject" buttons.
- If `CONFIRMED`: Render orange **"Check-in"** button.
- If `CHECKED_IN`: Display final price, tier multiplier, and estimated points. Render green **"Checkout & Tích điểm"** button. Clicking completes booking, credits points, uses voucher, and triggers tier evaluation.

#### [NEW] [AdminPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/admin/AdminPage.tsx)
Create Admin Dashboard portal with 3 tabs:
1. **Customer Management**: Grid listing registered users. Search (name, phone, license plate), filter (tiers), and sort (date, total spend, points). Clicking "View" opens details modal with update forms.
2. **Booking Management**: Infinite scroll grid. Default shows current date. Filter by status, sort by time/price.
3. **Statistics & Logs**: Income stats (daily, monthly, yearly aggregates) and transaction audit logs. Includes AI Promotion Campaign Creator form.

---

## Verification Plan

### Automated Tests
- Verify successful production build:
  `cd Front-end; npm run build`

### Manual Verification
- Launch the development server:
  `cd Front-end; npm run dev`
- Log in or run through guest check-out wizard, testing each step.
- Verify role switcher to verify Booking Queue (Washing Counter) and Customer Registry / Statistics (Admin Page) operate on shared state correctly.

---

### Task 1: Role-Based Routing & Context Extension

**Files:**
- Modify: [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx)
- Modify: [context/BookingContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/BookingContext.tsx)

**Interfaces:**
- Consumes: Existing base templates.
- Produces: Expanded Context holding mock database states (customers, vehicles, bookings, vouchers, promotions, logs) and role-switching navigation in `App.tsx`.

- [ ] **Step 1: Expand `BookingContext.tsx` properties**
  Modify [BookingContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/BookingContext.tsx) to store full state lists representing our database tables and add functions to mutate them (register customer, add vehicle, check-in, checkout, redeem voucher, create campaign).
  ```typescript
  export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    tier: 'Member' | 'Silver' | 'Gold' | 'Platinum';
    accumulatedPoints: number;
    totalSpend: number;
    createdAt: string;
  }
  export interface Vehicle {
    id: string;
    customerId: string;
    licensePlate: string;
    brand: string;
    size: 'hatchback' | 'sedan' | 'suv' | 'pickup';
    notes?: string;
    isDefault: boolean;
  }
  export interface Booking {
    id: string;
    bookingRef?: string;
    customerId: string;
    vehicleId: string;
    branchId: 'D1' | 'D7';
    bookingDate: string;
    bookingTime: string;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
    pointsEarned: number;
    appliedVoucherId?: string;
    createdAt: string;
    reminderOptIn?: boolean;
  }
  ```

- [ ] **Step 2: Implement top navigation role-switching in `App.tsx`**
  Modify [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx) to render a header with tabs: "Customer Portal" | "Washing Counter" | "Admin Panel", and conditionally render the respective portals based on the active role.

- [ ] **Step 3: Verify build compiles**
  Run: `npm run build` (Run manually in terminal or verify types compile).

- [ ] **Step 4: Commit**
  ```bash
  git add Front-end/src/App.tsx Front-end/src/context/BookingContext.tsx
  git commit -m "feat: scaffolding role routing and extended database state context"
  ```

---

### Task 2: 6-Step Booking Wizard: Car Size Selection & Navigation

**Files:**
- Create: [StepCarSize.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepCarSize.tsx)
- Modify: [BookingPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/BookingPage.tsx)
- Modify: [BookingHeader.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/BookingHeader.tsx)

**Interfaces:**
- Consumes: Expanded `BookingContext` variables.
- Produces: 6-step progress stepper and functional Step 1 `Car Size Selection`.

- [ ] **Step 1: Implement `StepCarSize.tsx`**
  Create [StepCarSize.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepCarSize.tsx) displaying 4 glassmorphic cards (Hatchback, Sedan, SUV, Pickup) side-by-side. Selecting a card sets the size state in `BookingContext` and moves to step 2.

- [ ] **Step 2: Update `BookingHeader.tsx` to show 6 steps**
  Modify [BookingHeader.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/BookingHeader.tsx) to list 6 steps: `Size Xe` -> `Branch` -> `Date & Time` -> `Services` -> `Information` -> `Confirmation`. Ensure headers are clickable for backward navigation.

- [ ] **Step 3: Update `BookingPage.tsx` step routes**
  Modify [BookingPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/BookingPage.tsx) to integrate `StepCarSize` as step 1, shift branch to step 2, schedule to 3, services to 4, contact to 5, and payment/confirmation to 6.

- [ ] **Step 4: Commit**
  ```bash
  git add Front-end/src/pages/booking/
  git commit -m "feat: implement Step 1 Car Size selection and adjust Booking Wizard to 6 steps"
  ```

---

### Task 3: Booking Step Updates: Combos Popup, Notifications, & Confirmation

**Files:**
- Modify: [StepServices.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepServices.tsx)
- Modify: [StepSchedule.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepSchedule.tsx)
- Modify: [StepPayment.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepPayment.tsx)

**Interfaces:**
- Consumes: Selections from Step 1-5.
- Produces: Updated service selector pop-up, reminder schedule checkboxes, and summary edit/submit step.

- [ ] **Step 1: Update services selection UI in `StepServices.tsx`**
  Modify [StepServices.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepServices.tsx) to open combos and individual packages inside a modal/pop-up window. Show active promotions on the sidebar.

- [ ] **Step 2: Integrate reminder preferences in `StepSchedule.tsx`**
  Modify [StepSchedule.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepSchedule.tsx) to include a checkbox: "Receive SMS/Email reminder 1 day before appointment". Save value to context.

- [ ] **Step 3: Update `StepPayment.tsx` to handle Summary & Edit flow (Step 6)**
  Modify [StepPayment.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepPayment.tsx):
  - Initial view: Render summary cards of Branch, Date/Time, Customer Info, and Services with a "Sửa" (Edit) button on each. Clicking "Sửa" navigates back to the corresponding step.
  - The Booking ID and VietQR are hidden. Show "Confirm & Submit Booking" orange button.
  - Click "Confirm": Generate booking code, lock vouchers, add booking record, disable cancellation, and display Success screen with VietQR details.
  - Prevent booking if the customer already has a `PENDING` or `CONFIRMED` booking in their history.

- [ ] **Step 4: Commit**
  ```bash
  git add Front-end/src/pages/booking/components/
  git commit -m "feat: implement Step 6 booking confirmation edits, post-click code generation, and restriction checks"
  ```

---

### Task 4: Customer Dashboard & Auth Customization

**Files:**
- Create: [CustomerDashboard.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/dashboard/CustomerDashboard.tsx)
- Modify: [pages/auth/AuthPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/auth/AuthPage.tsx)

**Interfaces:**
- Consumes: Customer data from Auth.
- Produces: 5-tab Customer Portal dashboard, registration with OTP, and Vehicle CRUD.

- [ ] **Step 1: Add OTP field to `AuthPage.tsx` registration**
  Modify [AuthPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/auth/AuthPage.tsx) to require Name, Password, Confirm Password, Phone (with mock OTP verification field), and Email (optional).

- [ ] **Step 2: Implement `CustomerDashboard.tsx` layout & tabs**
  Create [CustomerDashboard.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/dashboard/CustomerDashboard.tsx) with tabs: Info & Vehicles, Booking History, Loyalty & Points, Redeem Vouchers, and Promotions.
  - **Info & Vehicles**: CRUD interface to edit profile and manage vehicles (Plate manual/image, Brand, Size, Notes, Default toggle. Plate does not need to be unique).
  - **Booking History**: List bookings of the customer. Hide cancel buttons (cancellation not allowed).
  - **Loyalty**: Show points balance, tier progress bar, transaction list.
  - **Redeem Vouchers**: Catalog to exchange points (Discount 50k, Free Basic Wash, Free Detail Wash). Show New User voucher policy (Bill >300k gets 50k voucher, >500k gets 100k voucher).

- [ ] **Step 3: Commit**
  ```bash
  git add Front-end/src/pages/dashboard/ Front-end/src/pages/auth/
  git commit -m "feat: implement Customer Dashboard with 5 tabs and Vehicle CRUD"
  ```

---

### Task 5: Washing Counter Portal (Queue Management)

**Files:**
- Create: [WashingCounterPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/washing-counter/WashingCounterPage.tsx)

**Interfaces:**
- Consumes: Bookings database list from Context.
- Produces: Washing queue page with manual check-in actions.

- [ ] **Step 1: Create `WashingCounterPage.tsx`**
  Create [WashingCounterPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/washing-counter/WashingCounterPage.tsx) showing a list of bookings:
  - If status is `PENDING`: Render "Approve Appointment" and "Reject" buttons.
  - If status is `CONFIRMED`: Render a prominent orange **"Check-in"** button (for manual check-in of arriving vehicles).
  - If status is `CHECKED_IN`: Display service price, tier multiplier, and estimated points to earn. Render a green **"Checkout & Tích điểm"** button. Clicking completes booking, credits points, uses voucher, and triggers tier evaluation.

- [ ] **Step 2: Commit**
  ```bash
  git add Front-end/src/pages/washing-counter/
  git commit -m "feat: create Washing Counter portal with Check-in and Checkout queues"
  ```

---

### Task 6: Admin Dashboard (Customers, Infinite Scroll, Stats, Sort)

**Files:**
- Create: [AdminPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/admin/AdminPage.tsx)

**Interfaces:**
- Consumes: All context database lists.
- Produces: Admin Dashboard with registered customer lists, view modals, infinite scrolling booking list, statistics aggregates, and sorting filters.

- [ ] **Step 1: Implement Customer Registry**
  Inside [AdminPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/admin/AdminPage.tsx), render the customer list grid. Add sorting functions (by date, total spent, points), search bar, and tier filter.
  - Clicking "View" on a customer opens a modal showing profile details, vehicle profiles, point logs, and update profile inputs.

- [ ] **Step 2: Implement Booking List with Infinite Scroll**
  Implement the booking management grid in `AdminPage.tsx`. Integrate infinite scroll (displays first 10 items, appends next 10 items as the user scrolls down).
  - Default view displays bookings of current date.
  - Add filters by status (`PENDING`, `CONFIRMED`, `CHECKED-IN`, `COMPLETED`, `CANCELLED`) and sorting (time, price).

- [ ] **Step 3: Implement Income Statistics & logs**
  - **Income Statistics**: Render cards displaying total revenue. Default to current time. Integrate buttons to filter and aggregate calculations by `Day`, `Month`, and `Year`.
  - **Transaction Logs**: Render Audit point logs. Default view shows transactions of the current date.
  - **AI Promotion Campaign Creator**: Fields to input goal and target tier to generate promotions.

- [ ] **Step 4: Verify entire application builds and runs**
  Run: `npm run build`
  Expected: Success.

- [ ] **Step 5: Commit**
  ```bash
  git add Front-end/src/pages/admin/
  git commit -m "feat: implement Admin Portal with Customer CRUD, Booking Infinite Scroll, and Income Stats"
  ```
