# Design Specification: AutoWash Pro Smart Booking & Loyalty System

This document specifies the user interface design, state management, and interaction flows for the customer portal, multi-step booking wizard, loyalty engine, washing counter operation, and administration dashboard of the AutoWash Pro system.

---

## 1. Context & Goals

*   **Context**: The application represents a premium, tech-forward car wash booking and loyalty system. The user interface is clean, premium (glassmorphism/dark mode), and standardized in English, with Vietnam-specific business flows (VietQR, manual operations).
*   **Scope Restrictions**: The system is designed exclusively for cars. **Motorbikes are completely excluded from the scope.**
*   **Objectives**:
    *   Design the Customer Authentication gateway (Login, Sign-Up, Guest entry).
    *   Design the 5-step Booking Wizard based on VinaWash services data, car size multipliers, and 30-minute time slot constraints.
    *   Design the Loyalty Engine for points accumulation, tier progression (Rolling 12-Month), and Reward Catalog Vouchers.
    *   Design the Customer Dashboard (Info, Vehicle CRUD, Booking history, Points history, Reward redemption).
    *   Design the Washing Counter role for managing appointment lifecycle (Approve, Check-in, Checkout & Credit points).
    *   Design the Admin Dashboard role for AI-driven marketing campaigns, Customer Management (CRUD/Search/Filter/Sort), Booking Management (Infinite Scroll/Filter/Sort), Promotions, Income Statistics (by Day/Month/Year), and Audit logs.

---

## 2. Technical Design Decisions & Core Engines

### 2.1. Selected Architecture: Role-based Views
The application provides 3 main portals selectable at the top navigation bar for demonstration:
1.  **Khách hàng (Customer)**: Contains Auth Page and Booking Wizard/Dashboard.
2.  **Quầy Rửa xe (LPR) (Washing Counter)**: Operational queue for vehicle check-in/checkout.
3.  **Quản trị Admin (Admin Portal)**: System management, Customer registry, Promotions, Statistics, and Audit Logs.

### 2.2. State Management Single Source of Truth
`BookingContext` maintains:
*   `currentStep`: `1 | 2 | 3 | 4 | 5 | 6` (Car Size, Branch, Date & Time, Services, Contact, Confirmation).
*   `vehicleSize`: `'small' | 'medium' | 'large'`.
*   `branchId`: `string | null` (selected branch).
*   `selectedDate`: `string | null` (format `YYYY-MM-DD`).
*   `selectedTime`: `string | null` (format `HH:mm`, 30-minute intervals).
*   `selectedServices`: `string[]` (array of service item IDs).
*   `customerInfo`: `{ name, phone, email, licensePlate, vehicleModel, createAccount, password }`.

### 2.3. Loyalty Engine & Points Calculation
*   **Base Earning Rate**: 1,000 VND paid = 1 base point.
*   **Real-time Points Accumulation Formula**:
    $$P = \left(\frac{V}{1,000}\right) \times K_h \times K_{km}$$
    *   $P$: Points earned (rounded down to nearest integer).
    *   $V$: Actual cash amount paid (VND) after applying discount vouchers.
    *   $K_{km}$: Promotion multiplier from active system campaign (default $= 1.0$).
    *   $K_h$: Customer tier multiplier:
        *   **Member**: $1.0$ (1,000 VND = 1.0 point)
        *   **Silver**: $1.1$ (1,000 VND = 1.1 points)
        *   **Gold**: $1.2$ (1,000 VND = 1.2 points)
        *   **Platinum**: $1.3$ (1,000 VND = 1.3 points)

### 2.4. Tier Progression & Expiration
*   **Evaluation Metric**: The tier status is evaluated based on the number of washes (visits) OR the total spent in the **rolling 12 months** (Rolling 12-Month metrics).
*   **Tier Thresholds**:
    *   **Member**: Default for new sign-ups ($0$ washes, $0$ VND spend).
    *   **Silver**: $\ge 5$ washes OR $\ge 2,000,000$ VND spent in the last 12 months.
    *   **Gold**: $\ge 15$ washes OR $\ge 6,000,000$ VND spent in the last 12 months.
    *   **Platinum**: $\ge 30$ washes OR $\ge 15,000,000$ VND spent in the last 12 months.
*   **Upgrade**: Evaluated instantly upon transaction completion.
*   **Downgrade (Monthly Review)**: Executed automatically on the 1st of every month. Transactions/washes older than 12 months expire, and if the rolling metrics drop below the tier threshold, the customer is downgraded.
*   **Point Expiration**: Points earned from any transaction expire 12 months after the transaction date.

---

## 3. UI Flow & Component Portals

### 3.1. Customer Portal (`Khách hàng`)

#### 3.1.1. Authentication & Registration Screen
*   **Log In / Sign Up Card**: Phone & Password. Highlights loyalty tier perks (extended booking window: Member 7, Silver 10, Gold 12, Platinum 14 days).
*   **Sign Up Form Fields**: 
    *   Full Name (Họ tên)
    *   Password (Mật khẩu)
    *   Password Confirmation (Nhập lại mật khẩu)
    *   Phone Number (Số điện thoại - verified via OTP)
    *   Email/Gmail (Optional)
    *   Vehicle Information (Optional - can be added later during registration or from dashboard): License Plate (Manual input or image upload) and Vehicle Size (Small, Medium, Large).
*   **Customer Directory UI**: The portal includes a view displaying the list of registered customers, showing their Name and associated Vehicle(s).
*   **Quick Booking (Guest Checkout)**: Uses Phone + License Plate. Auto-creates a guest account.

#### 3.1.2. 6-Step Booking Wizard
1.  **Car Size Selection**: Prompts the user to select their car size group (Small, Medium, Large) right at the beginning of the flow. Selecting this size adjusts pricing for all services in subsequent steps.
2.  **Select Branch**: Choose branch (District 1 / District 7) with availability badges.
3.  **Date & Time**: Slider showing dates (7 to 14 days based on tier) and 30-minute interval grid.
    *   *Reminders*: Automatically sends a reminder notification to the member 1 day before the scheduled time. Also sends a confirmation notification upon booking.
4.  **Services**: Choose combo packages or individual services displayed as a pop-up window. Base prices are automatically adjusted by the car size selected in Step 1 (Small x0.9, Medium x1.0, Large x1.2/x1.4). Includes detailed service descriptions on a Kem/Yellow background (`#fffbeb`).
    *   *Promotions*: Displays available system promotions on the customer UI, enabling users to view and select promotion campaigns.
5.  **Contact Info**: Customer details (Name, Phone, Email, License Plate, Vehicle Make), option to create a password to save history.
6.  **Confirmation & Payment (Summary & Edit)**:
    *   **Review & Edit**: Displays a detailed summary of all selections from previous steps. Each section has an **"Edit" (Sửa)** button, allowing users to return immediately to that step to modify their selection.
    *   **Navigation**: Header step indicators and "Back" buttons must be fully clickable and functional, allowing users to navigate back and forth without losing state.
    *   **Booking Code & VietQR**: The unique booking reference code and VietQR are **not** created on initial view. They are only generated after the user reviews the details and clicks the orange **"Confirm & Submit Booking"** button. This submits the booking, locks the voucher (if applied), and shows the final Payment Success screen with the generated Booking Reference and QR code.
    *   **Payment Policy**: Requires **100% manual bank transfer** (partial deposits are removed).
    *   **Cancellation Policy**: Once confirmed and submitted (entering `PENDING` state), the booking is locked and **cannot be canceled by the customer**. The customer portal does not provide a cancel button.
    *   **Multi-booking Restriction**: A customer can only have one active booking (status `PENDING` or `CONFIRMED`) at a time. They cannot place a new booking until their current active booking is either completed (`COMPLETED`) or rejected/cancelled by the admin or washing counter.

#### 3.1.3. Customer Dashboard (5 Tabs)
1.  **Vehicles & Info**: Update profile info. Manage multiple vehicles (CRUD):
    *   `License Plate` (e.g. `51G-123.45` - not globally unique).
    *   `Brand` (e.g. Toyota).
    *   `Size` (Hatchback | Sedan | SUV | Pickup).
    *   `Notes / Description` (Free-text notes).
    *   `Is Default` (Boolean).
2.  **Booking History**: View list of bookings and their status: `PENDING`, `CONFIRMED`, `CHECKED-IN`, `COMPLETED`, `CANCELLED`.
3.  **Loyalty & Points**: Visualizes current points balance, active tier progress bar, points expiring next month, and point transaction logs.
4.  **Redeem Rewards**: Catalog to exchange points for vouchers:
    *   **50,000 VND Discount Voucher**: Costs 500 points.
    *   **Free Basic Wash Voucher**: Costs 1,800 points.
    *   **Free Detail Wash Voucher**: Costs 2,800 points.
    *   **New User Policy (Advanced - Optional)**: If a new user places their first wash with a bill over 300k VND, they receive a free 50k Voucher. If the bill exceeds 500k VND, they receive a free 100k Voucher.
    *   *Lifecycle*: Voucher locks when applied to booking. Marked "Used" on checkout. Refunded to "Active" if booking is cancelled before check-in.
5.  **System Promotions**: View active system campaigns.

---

### 3.2. Washing Counter Portal (`Quầy Rửa xe (LPR)`)
An operational board displaying real-time booking queue. Responsible for:
*   **Approve Appointments**: Change status from `PENDING` to `CONFIRMED` or reject.
*   **Check-in Booking**: Action button to directly check in a vehicle with a `CONFIRMED` booking, updating status to `CHECKED-IN`.
*   **Details Display**: Displays booking details, car size, final cash price, applied vouchers, and points to be earned.
*   **Checkout & Credit Points**: Update status from `CHECKED-IN` to `COMPLETED` upon cash payment. Triggers points credit ($P$), sets voucher to `Used`, and upgrades member tier if threshold is reached.

---

### 3.3. Admin Portal (`Quản trị Admin`)
System configuration dashboard containing:

#### 3.3.1. Customer Management
*   **Registered Customers List**: A grid view listing all registered users in the database.
*   **Search & Filter**: Search by customer name, phone number, or license plate. Filter by member tiers (Member, Silver, Gold, Platinum).
*   **Sorting**: Sort customers by registration date, total spent, or current point balance.
*   **"View" Details Modal**: Click "View" on any customer to see a detailed panel showing:
    *   Detailed profile information (name, phone, email).
    *   Associated vehicle list.
    *   Full booking and wash history.
    *   Points audit history.
*   **Update Information**: Ability to edit/update customer profile details (name, email, phone) directly from the details view.

#### 3.3.2. Booking Management
*   **Infinite Scroll Interface**: Display list of bookings dynamically loaded via JavaScript as the user scrolls down, mimicking social media feeds for smooth performance with large datasets.
*   **Default View**: Shows bookings for the current date by default.
*   **Search & Filter**: Filter by booking status (`PENDING`, `CONFIRMED`, `CHECKED-IN`, `COMPLETED`, `CANCELLED`).
*   **Sorting**: Sort bookings by scheduled time, price, or vehicle size.

#### 3.3.3. Statistics & Logs
*   **Income Statistics Panel**: Shows revenue metrics. Default view shows statistics for the current time. Offers aggregated filtering and grouping by:
    *   `Day` (Daily income breakdown)
    *   `Month` (Monthly income chart/table)
    *   `Year` (Annual revenue reports)
*   **Transaction Log (Audit Log)**: Displays points transaction records (earned, spent, expired, tier upgrades). Default view shows transactions for the current date. Supports filtering by customer or transaction type.

#### 3.3.4. Marketing & Configurations
*   **AI Promotion Campaign Creator**: Input field "Mục tiêu chiến dịch" (Campaign Goal) + dropdown "Nhắm tới Hạng" (Target Tier) to auto-generate marketing campaigns.
*   **Promotion CRUD**: Create/update campaigns with custom Point Multipliers ($K_{km}$) and Target Tiers (e.g. "x1.5 points for Silver+").

---

## 5. Verification & Testing Plan

### Automated Verification
*   Unit tests for the Points Earning formula ($P = (V/1000) * K_h * K_{km}$).
*   Integration tests for the rolling 12-month tier progression logic (upgrades on earn, downgrades on month roll).
*   State validation for voucher locking and refund lifecycle.
*   Sorting utility function correctness (date, numeric value, string sorting).

### Manual Verification
1.  Navigate between Customer, Washing Counter, and Admin roles.
2.  Add a vehicle in Customer Dashboard, verify it is available in Booking Wizard, and updates pricing correctly.
3.  Earn points and redeem a voucher, apply it in Step 5, and verify price reduction.
4.  Cancel the booking and verify the voucher is returned to "Active".
5.  Perform the entire operational cycle in the Washing Counter (Pending ➔ Confirmed ➔ Checked-In ➔ Completed) and check the Admin Audit Log for correct points credit.
6.  Go to Admin Dashboard -> Customers, search, filter, and sort the list, click "View" and edit details.
7.  Go to Admin Dashboard -> Bookings, scroll down to trigger infinite scroll, filter by status.
8.  Go to Admin Dashboard -> Statistics, switch filters between Day, Month, Year, and verify income calculations.
