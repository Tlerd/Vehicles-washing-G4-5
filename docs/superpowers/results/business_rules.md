# Business Rules Document: AutoWash Pro

This document specifies the business rules, formulas, and constraints that govern the core logic of the AutoWash Pro booking and loyalty engine.

---

## 1. Car Size & Pricing Rules

* **BR-001: Car Size Pricing Multipliers**  
    All base wash and care service prices must be adjusted dynamically based on the selected vehicle size:
  * **Hatchback**: `0.9` multiplier (10% discount on base price).
  * **Sedan**: `1.0` multiplier (standard base price).
  * **SUV / CUV**: `1.2` multiplier (20% increase on base price).
  * **Pickup / Luxury**: `1.4` multiplier (40% increase on base price).

---

## 2. Loyalty & Point Credit Rules

* **BR-002: Base Point Earning Rate**  
    The standard earning rate is 1 base point for every 1,000 VND spent:
    $$\text{Base Points} = \frac{\text{Cash Paid}}{1,000}$$

* **BR-003: Points Credit Calculation Formula**  
    The final points credited to a customer upon wash completion ($P$) is calculated as follows:
    $$P = \left\lfloor \frac{V}{1,000} \times K_h \times K_{km} \right\rfloor$$
  * $P$: Points earned (rounded down to the nearest integer).
  * $V$: Actual cash amount paid (VND) after applying discount vouchers.
  * $K_h$: Customer tier multiplier.
  * $K_{km}$: Active campaign promotion multiplier (default $= 1.0$).

* **BR-004: Customer Tier Multipliers ($K_h$)**  
    Each loyalty tier receives a specific multiplier on earned points:
  * **Member**: `1.0` multiplier.
  * **Silver**: `1.1` multiplier.
  * **Gold**: `1.2` multiplier.
  * **Platinum**: `1.3` multiplier.

---

## 3. Tier Progression & Expiration Rules

* **BR-005: Rolling 12-Month Tier Thresholds**  
    Customer tier status is evaluated dynamically based on the number of completed washes OR the total cash spent in the **rolling 12 months**:
  * **Member**: Default starting level ($0$ washes, $0$ VND spend).
  * **Silver**: $\ge 5$ washes OR $\ge 2,000,000$ VND spent in the last 12 months.
  * **Gold**: $\ge 15$ washes OR $\ge 6,000,000$ VND spent in the last 12 months.
  * **Platinum**: $\ge 30$ washes OR $\ge 15,000,000$ VND spent in the last 12 months.

* **BR-006: Real-time Tier Upgrades**  
    Tier upgrade evaluations must occur instantly upon transaction checkout. If the new transaction pushes the rolling 12-month metrics past the next threshold, the customer is immediately upgraded.

* **BR-007: Monthly Tier Downgrade Review**  
    Downgrade evaluations are run automatically on the **1st of every month**. Transactions/washes older than 12 months are removed from the rolling calculation. If the customer's rolling metrics drop below their current tier threshold, they are downgraded.

* **BR-008: Points Expiration**  
    Points earned from any transaction expire exactly 12 months (365 days) after the transaction date.

---

## 4. Voucher & Reward Catalog Rules

* **BR-009: Reward Catalog Exchange Rates**  
    Customers can exchange points for vouchers in the catalog:
  * **50,000 VND Discount Voucher**: Costs `500` points.
  * **Free Basic Wash Voucher**: Costs `1,800` points.
  * **Free Detail Wash Voucher**: Costs `2,800` points.

* **BR-010: New User Welcome Policy**  
    If a newly registered customer places their first wash:
  * If the actual bill exceeds `300,000` VND, they receive a free **50,000 VND Discount Voucher**.
  * If the actual bill exceeds `500,000` VND, they receive a free **100,000 VND Discount Voucher**.

* **BR-011: Voucher Booking Lifecycle**  
  * Applying a voucher to a booking locks the voucher (status: `LOCKED`).
  * When the booking is completed (Checkout), the voucher is marked as `USED`.
  * If the booking is cancelled or rejected *before* check-in, the voucher must be unlocked and returned to `ACTIVE`.

---

## 5. Booking Restrictions & Payments

* **BR-012: Multi-booking Restriction**  
    A customer is restricted to **only one active booking** (status `PENDING` or `CONFIRMED`) at any given time. A new booking cannot be submitted until the active one is either completed, cancelled, or rejected.

* **BR-013: Booking Cancellation Policy**  
    Customers cannot cancel their booking once it has been submitted (enters `PENDING` or `CONFIRMED` state). Cancellation or rejection must be performed manually by the Wash Counter staff or System Admin.

* **BR-014: Payment Policy**  
    The system requires **100% manual bank transfer** (no partial deposits or automated gateway charges). Booking verification is completed after the quầy check-in staff verifies the manual transaction bank slip matches the QR reference.

* **BR-015: Phone Number E.164 Normalization**  
    All phone numbers entered by users must be normalized to E.164 format (e.g. `+84...`) before calling OTP services:
  * Leading `0` must be stripped and replaced with `+84`.
  * All non-numeric characters must be stripped.
