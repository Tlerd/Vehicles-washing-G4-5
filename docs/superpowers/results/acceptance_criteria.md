# Acceptance Criteria Document: AutoWash Pro

This document defines the detailed Acceptance Criteria (AC) for the core functional workflows of the AutoWash Pro system.

---

## 1. Authentication & OTP Verification

### AC-101: Firebase OTP Verification during Registration

* **Scenario 1: OTP Sent successfully**
  * **Given** the user enters a valid Vietnamese phone number (e.g. `0901234567`) in the registration form.
  * **When** the user clicks "Send OTP".
  * **Then** the front-end must format the number to E.164 (`+84901234567`), disable the "Send OTP" button, and start a 60-second countdown timer.
  * **And** it must invoke the Firebase Client SDK to dispatch the SMS OTP successfully.
* **Scenario 2: Successful verification**
  * **Given** the OTP countdown is active.
  * **When** the user enters the correct 6-digit code and clicks "Verify".
  * **Then** the Firebase SDK must confirm the code and return a valid ID token.
  * **And** the client must enable the "Sign Up & Start" submission button.
* **Scenario 3: Failed verification**
  * **Given** the user enters an incorrect 6-digit code.
  * **When** the user clicks "Verify".
  * **Then** the Firebase SDK returns verification failure, the system displays a red error message: "Incorrect OTP code. Please try again," and the sign-up submission button remains disabled.

---

## 2. Booking Wizard

### AC-201: Dynamic Vehicle-Size Pricing

* **Scenario: Service price recalculation**
  * **Given** the user selects "SUV / CUV" in Step 1 (Car Size Selection) which has a `1.2` multiplier.
  * **When** the user navigates to Step 4 (Services Catalog).
  * **Then** the prices displayed for all services must be shown as adjusted (e.g. basic wash base price 180k must display as `216,000 VND`).
  * **And** the Cart summary total must sum the adjusted prices.

### AC-202: Multi-booking Restriction

* **Scenario: User attempts to book with active appointment**
  * **Given** the user is logged in and has an active booking with status `PENDING` or `CONFIRMED`.
  * **When** the user navigates to the booking page.
  * **Then** the system must display a warning card: "You already have an active booking. Multi-booking is restricted," and prevent the user from starting Step 1 of the wizard.

### AC-203: Booking Confirmation & Payment Screen

* **Scenario: Reference code and VietQR generation**
  * **Given** the user is at Step 6 (Confirmation) and reviews their details.
  * **When** the screen is loaded, the Booking ID and VietQR image must be hidden.
  * **And** the user clicks the orange "Confirm & Submit Booking" button.
  * **Then** the system must create a booking record, set its status to `PENDING`, generate a unique Booking ID (e.g. `AWP-381927`), and render the bank transfer details screen with a VietQR image including the amount and booking reference.

---

## 3. Loyalty Points & Tiers

### AC-301: Real-time Points Credit on Checkout

* **Scenario: Point calculation upon checkout**
  * **Given** a Customer with "Silver" tier ($K_h = 1.1$) completes a wash with an actual paid amount of `300,000` VND.
  * **When** the Washing Counter staff clicks "Checkout & Tích điểm".
  * **Then** the system must credit exactly `330` points to the customer's account:
        $$P = \lfloor 300 \times 1.1 \times 1.0 \rfloor = 330$$
  * **And** a transaction log must be added to the customer's audit profile.

### AC-302: Rolling 12-Month Tier Evaluation

* **Scenario 1: Instant upgrade**
  * **Given** a Member has 4 washes in the last 11 months.
  * **When** a 5th wash is checked out and completed.
  * **Then** the system must instantly upgrade the customer to the "Silver" tier.
* **Scenario 2: Monthly downgrade**
  * **Given** it is the 1st of the month.
  * **When** the system runs the monthly review.
  * **Then** it must filter out washes older than 12 months. If the customer's washes in the remaining window drop below 5, they must be downgraded to "Member".

---

## 4. Voucher Lifecycle

### AC-401: Voucher locking and refunding

* **Scenario 1: Booking confirmation locks voucher**
  * **Given** the customer applies an active 50k voucher to their booking.
  * **When** they submit the booking.
  * **Then** the voucher status in the customer's catalog must change to `LOCKED`.
* **Scenario 2: Washing Counter Checkout uses voucher**
  * **Given** the booking is checked in and completed.
  * **When** checkout is processed.
  * **Then** the voucher status must change to `USED`.
* **Scenario 3: Rejecting booking returns voucher**
  * **Given** the booking is in `PENDING` status.
  * **When** the Washing Counter or Admin rejects/cancels the booking.
  * **Then** the locked voucher must be returned to the customer's catalog with `ACTIVE` status.

---

## 5. Admin Portal

### AC-501: Customer Management CRUD & Sorting

* **Scenario: Sorting customer list**
  * **Given** the Admin is on the Customer Management tab.
  * **When** they select "Total Spent" in the sort dropdown.
  * **Then** the customer grid must sort in descending order based on the total cash spent in the system.
* **Scenario: Viewing customer detail modal**
  * **Given** the customer list is loaded.
  * **When** the Admin clicks "View" on a customer row.
  * **Then** a modal must open displaying the profile form, registered vehicles, complete booking history, and point audit logs.

### AC-502: Booking Management Infinite Scroll

* **Scenario: Infinite scroll trigger**
  * **Given** the Admin has 50 bookings in the system and is on the Booking Management tab.
  * **When** the tab loads, only the first 10 bookings must be rendered.
  * **And** the Admin scrolls to the bottom of the grid container.
  * **Then** the next 10 bookings must be appended dynamically to the feed without reloading the page.
