# Technical Specification: [FR-005] Booking Checkout & VietQR Payment

This document specifies the technical design, requirements, and BDD verification scenarios for booking submissions, multi-booking restriction verification, and VietQR manual payment code generation.

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:high`
* **Estimate**: 3 days
* **Functional Area**: `area:foundation`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create**: Create a booking record in `PENDING` status.
* **Read**: Query existing bookings for the customer ID to verify active bookings before submission.
* **Update**: Lock the applied voucher (status ➔ `LOCKED`).
* **Delete**: None (Bookings cannot be deleted or cancelled by customers).

### 1.2. Data Dictionary / Fields

| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Yes | Primary Key. |
| `bookingRef` | String | Yes | Unique reference code (e.g. `AWP-381927`). |
| `customerId` | String (UUID) | Yes | Foreign Key referencing `customers.id`. |
| `vehicleId` | String (UUID) | Yes | Foreign Key referencing `vehicles.id`. |
| `branchId` | Enum | Yes | `D1`, `D7`. |
| `bookingDate` | String | Yes | ISO Date `YYYY-MM-DD`. |
| `bookingTime` | String | Yes | Time `HH:mm`. |
| `totalPrice` | Integer | Yes | Total paid amount (VND) after size adjustments and vouchers. |
| `status` | Enum | Yes | `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`. |
| `appliedVoucherId`| String (UUID) | No | Foreign Key referencing `vouchers.id`. |

### 1.3. Business Rules & Constraints

* **Multi-booking Restriction (BR-012)**: A customer can only have one active booking (status `PENDING` or `CONFIRMED`) at a time. Attempts to place a new booking must be blocked by both client-side UI and backend APIs.
* **Cancellation Policy (BR-013)**: Once submitted, the booking is locked. Customers cannot cancel their bookings.
* **Voucher Locking (BR-011)**: If a voucher is applied, its status must transition to `LOCKED` upon booking creation.
* **Manual Payments (BR-014)**: 100% manual bank transfer. VietQR parameters:
  * Bank: VCB
  * Account: VINAWASH CO. LTD (`1234567890`)
  * Description: Booking Reference Code (e.g., `AWP-381927`).

### 1.4. Role-Based Access Control (RBAC)

* **Authorized Roles**: Customers and Guests can create bookings. Staff and Admin can view bookings.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Render inside Step 6 (Payment & Confirmation) of [StepPayment.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/booking/components/StepPayment.tsx).
* **Wireframe (Payment Screen)**:

    ```text
    +-------------------------------------------------------------+
    |                     Confirm & Pay                           |
    +-------------------------------------------------------------+
    | [ VietQR Code ]          Transfer Details:                  |
    | [             ]          Bank: Vietcombank                  |
    | [  QR Image   ]          A/C: VINAWASH CO. LTD              |
    | [             ]          Number: 1234567890                 |
    |                          Amount: 230,000 VND                |
    |                          Description: AWP-381927            |
    +-------------------------------------------------------------+
    |                     [ Back to Home ]                        |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Confirm Button**: Orange button "Confirm & Submit Booking" which submits the booking payload.
* **VietQR Card**: A dedicated panel that is displayed only after successful API creation.

### 2.3. Client-Side Validation

* **Double-Booking Check**: Queries historical bookings in memory. If active booking exists, disables the submission button and shows a warning card.

### 2.4. UX States

* **Loading State**: Spinner during API request.
* **Success View**: Renders the payment instructions card and generated reference ID.

---

## 3. Back-end Specifications (BE)

### 3.1. Database Schema Design

```sql
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(10) NOT NULL,
    booking_date VARCHAR(10) NOT NULL,
    booking_time VARCHAR(5) NOT NULL,
    total_price INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    applied_voucher_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
```

### 3.2. RESTful API Contract

#### Submit Booking

* **Method & Path**: `POST /api/bookings`
* **Auth**: Bearer User JWT or Guest validation
* **Request Payload**:

    ```json
    {
      "customerId": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
      "vehicleId": "v71a3962-cf3f-4279-994b-e85d45d3c8c8",
      "branchId": "D1",
      "bookingDate": "2026-06-26",
      "bookingTime": "10:00",
      "totalPrice": 230000,
      "appliedVoucherId": "vc71a3962-cf3f-4279-994b-e85d45d3c8c8"
    }
    ```

* **Response Payload (201 Created)**:

    ```json
    {
      "success": true,
      "bookingRef": "AWP-381927",
      "id": "b71a3962-cf3f-4279-994b-e85d45d3c8d0"
    }
    ```

### 3.3. Exception Handling & HTTP Status Codes

* `400 Bad Request` (Time slot occupied or validation failed).
* `409 Conflict` (Customer has another active booking in DB):

    ```json
    {
      "success": false,
      "error": "You already have an active booking."
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Successful Booking Submission & Voucher Locking (Happy Path)

* **Given** the customer has no active bookings and applies a valid voucher `vc-100`.
* **When** they click "Confirm & Submit Booking".
* **Then** the server creates a booking record in `PENDING` status.
* **And** updates the voucher `vc-100` status to `LOCKED` in the database.
* **And** the client displays the manual bank transfer payment details with the generated booking ref.

### AC-2: Double-Booking Attempt Rejection (Edge Case)

* **Given** the customer already has a booking with status `CONFIRMED`.
* **When** they attempt to POST a new booking request to `/api/bookings`.
* **Then** the backend rejects the request with `409 Conflict` and returns: "You already have an active booking."

### AC-3: Customer-Side Cancellation Absence (Edge Case)

* **Given** the booking has been successfully created.
* **When** the customer views their Booking History tab in the dashboard.
* **Then** the grid card must display the status as `PENDING` or `CONFIRMED` but must not render any "Cancel" button.

### AC-4: Expired Voucher Submission (Edge Case)

* **Given** the customer selected a voucher which became expired or used before final confirmation click.
* **When** the user clicks "Confirm & Submit Booking".
* **Then** the backend rejects the request with `400 Bad Request` showing "Invalid or expired voucher," prompting the client to update prices.

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **Phong & An**
* **Back-end Developers**: **Phat & Binh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (Phong & An)**:
  * `[ ]` Step 6 (Payment) UI: Display comprehensive information, Edit button to go back, and QR Code block: **Phong** (Lead) & **An** (Support/Review)
  * `[ ]` Build quick copy button for bank transfer information (Amount, Transfer description): **An** (Lead) & **Phong** (Support/Review)
* **Back-end Development (Phat & Binh)**:
  * `[ ]` Service to automatically generate dynamic VietQR image link containing booking identifier and amount: **Phat** (Lead) & **Binh** (Support/Review)
  * `[ ]` API Controller to update booking status to `CONFIRMED` when staff approves: **Phat** (Lead) & **Binh** (Support/Review)
