# User Stories: AutoWash Pro

This document defines the requirements for AutoWash Pro in the standard User Story format.

---

## 1. Customer User Stories

*   **US-101: Account Registration with OTP**  
    As a **Customer**, I want to **register my profile and verify my phone number via Firebase SMS OTP**, so that **I can secure my account and prevent duplicate profile registration**.
*   **US-102: Account Login**  
    As a **Customer**, I want to **log in using my phone number and password**, so that **I can access my personal dashboard, vehicle profiles, and point balances**.
*   **US-103: Multi-Vehicle CRUD Management**  
    As a **Customer**, I want to **add, read, update, and delete vehicle profiles in my dashboard**, so that **I can quickly choose my default or desired vehicle during booking**.
*   **US-104: View Point Balance & Tier Progress**  
    As a **Customer**, I want to **view my point balance and my membership tier progress bar**, so that **I know my current loyalty status and how close I am to the next tier**.
*   **US-105: Point Ledger Logs & Expirations**  
    As a **Customer**, I want to **view my point logs and check which points expire next month**, so that **I can use my rewards before they expire**.
*   **US-106: Rewards Catalog Redemption**  
    As a **Customer**, I want to **redeem my loyalty points for cash discounts or free washes**, so that **I can receive promotional discount benefits**.
*   **US-107: View Active Promotions**  
    As a **Customer**, I want to **view active point-multiplier campaigns in my portal**, so that **I can schedule washes to maximize my earned points**.

---

## 2. Guest User Stories

*   **US-201: Quick Booking Checkout**  
    As a **Guest**, I want to **complete a booking using only my name, phone number, and license plate**, so that **I can schedule an appointment quickly without full registration**.

---

## 3. Booking Wizard User Stories

*   **US-301: Car Size Selection**  
    As a **Booking User**, I want to **select my vehicle size group (Hatchback, Sedan, SUV, Pickup) at the first step**, so that **subsequent steps display correct, size-adjusted pricing**.
*   **US-302: Branch Selection**  
    As a **Booking User**, I want to **choose the wash branch location and view operating hours**, so that **I can book at the branch closest to me**.
*   **US-303: Appointment Slot Grid**  
    As a **Booking User**, I want to **select a date and a 30-minute time slot with live availability indicators**, so that **I can book a slot without schedule conflicts**.
*   **US-304: Service Selection Accordions**  
    As a **Booking User**, I want to **browse services in categorized sections and read detail popups**, so that **I can choose the correct package for my car's current state**.
*   **US-305: Booking Summary & Direct Editing**  
    As a **Booking User**, I want to **review a summary of my booking choices and click edit buttons on each section**, so that **I can correct individual choices without restarting the wizard**.
*   **US-306: VietQR Bank Transfer Payment**  
    As a **Booking User**, I want to **submit my booking to lock vouchers and view bank transfer details with a generated VietQR code**, so that **I can pay exactly the total price with the reference code**.

---

## 4. Wash Counter Staff User Stories

*   **US-401: Approve or Reject Bookings**  
    As a **Staff Member**, I want to **review pending bookings in the queue and mark them as approved or rejected**, so that **I can manage the workshop schedule**.
*   **US-402: Check-in Booking**  
    As a **Staff Member**, I want to **mark arriving vehicles as Checked-In**, so that **the wash bay crew is notified to start washing**.
*   **US-403: Checkout & Credit Points**  
    As a **Staff Member**, I want to **checkout completed bookings and verify transfer payments**, so that **the customer's loyalty points are automatically calculated and credited**.

---

## 5. Administrator User Stories

*   **US-501: Customer Management**  
    As an **Administrator**, I want to **search, filter, and sort the registered customers registry and view detailed modals**, so that **I can manage profiles, vehicles, and audit histories**.
*   **US-502: Infinite Scroll Booking Management**  
    As an **Administrator**, I want to **browse all system bookings using a lazy-loaded feed with infinite scrolling**, so that **I can inspect schedules efficiently without UI lag**.
*   **US-503: Revenue & Income Analytics**  
    As an **Administrator**, I want to **view revenue reports grouped by Day, Month, and Year**, so that **I can analyze business growth over time**.
*   **US-504: Transaction Audit Logs**  
    As an **Administrator**, I want to **view a transaction log of all loyalty points movements**, so that **I can audit point balances and investigate customer discrepancies**.
*   **US-505: AI Campaign Creator**  
    As an **Administrator**, I want to **enter a campaign goal to auto-generate and publish point-multiplier promotions**, so that **I can execute marketing campaigns to drive vehicle traffic**.
