# Technical Specification: [FR-006] Loyalty Point Accumulation

This document specifies the technical design, requirements, and BDD verification scenarios for implementing the loyalty points calculation and accumulation engine.

*   **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
*   **Milestone**: Release 1.0
*   **Priority**: `priority:high`
*   **Estimate**: 2 days
*   **Functional Area**: `area:reporting`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)
*   **Create**: Append a points ledger entry in the `transaction_logs` table recording the transaction points.
*   **Read**: Retrieve customer current points balance from the database.
*   **Update**: Update the customer entity points balance and cumulative spent total.
*   **Delete**: None.

### 1.2. Data Dictionary / Fields
| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Yes | Primary Key. |
| `customerId` | String (UUID) | Yes | Foreign Key referencing `customers.id`. |
| `bookingId` | String (UUID) | Yes | Foreign Key referencing `bookings.id`. |
| `points` | Integer | Yes | The amount of points credited (must be positive). |
| `type` | Enum | Yes | `EARN`, `REDEEM`, `EXPIRE`. |
| `createdAt` | Timestamp | Yes | Date and time the transaction log was recorded. |

### 1.3. Business Rules & Constraints
*   **Earning Rate (BR-002)**: Base rate is 1,000 VND = 1.0 point.
*   **Point Calculation Formula (BR-003)**:
    $$P = \left\lfloor \frac{V}{1,000} \times K_h \times K_{km} \right\rfloor$$
    *   $V$: Actual cash paid (VND) after discount vouchers.
    *   $K_h$: Customer tier multiplier (Member: 1.0, Silver: 1.1, Gold: 1.2, Platinum: 1.3).
    *   $K_{km}$: Active promotional multiplier (default = 1.0).
*   **Point Rounding**: Calculated points must be rounded down to the nearest integer.

### 1.4. Role-Based Access Control (RBAC)
*   **Authorized Roles**: System execution (internally triggered when Staff completes a checkout).

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept
*   **Layout**: Displays inside the Customer Portal dashboard under the "Loyalty & Points" tab.
*   **Wireframe (Points Ledger List)**:
    ```text
    +-------------------------------------------------------------+
    | Points History                                              |
    +-------------------------------------------------------------+
    | Date        Activity                  Points    Status      |
    | 2026-06-26  Wash Completed (AWP-102)  +330      Credited    |
    | 2026-06-25  Voucher Redeemed (50k)    -500      Redeemed    |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls
*   **Data Table**: Renders points ledger containing date, type (Earn/Redeem), booking reference, and points change.

---

## 3. Back-end Specifications (BE)

### 3.1. Database Schema Design
```sql
CREATE TABLE transaction_logs (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL,
    points INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

### 3.2. RESTful API Contract
*   *Note*: No public public API is exposed for point credits. This logic executes implicitly in the database when the checkout endpoint `POST /api/bookings/{id}/checkout` is processed.

---

## 4. Acceptance Criteria (AC)

### AC-1: Points Credit with Tier Multiplier (Happy Path)
*   **Given** a Customer has "Silver" tier status ($K_h = 1.1$).
*   **And** no active point-multiplier campaigns exist ($K_{km} = 1.0$).
*   **When** the customer completes a wash and pays exactly `300,000` VND.
*   **Then** the system calculates points as $\lfloor 300 \times 1.1 \times 1.0 \rfloor = 330$ points.
*   **And** adds a `transaction_logs` record with `points = 330` and `type = 'EARN'`.

### AC-2: Points Credit with Active AI Campaign Multiplier (Happy Path)
*   **Given** the customer has "Member" tier status ($K_h = 1.0$).
*   **And** an active system campaign provides `1.5`x point multiplier ($K_{km} = 1.5$).
*   **When** they complete a wash and pay `200,000` VND.
*   **Then** the system calculates points as $\lfloor 200 \times 1.0 \times 1.5 \rfloor = 300$ points.
*   **And** increases the customer's balance by 300 points.

### AC-3: Floor Rounding Verification (Edge Case)
*   **Given** a Member ($K_h = 1.0$, $K_{km} = 1.0$) completes a wash and pays `185,900` VND.
*   **When** the checkout is processed.
*   **Then** the points credited must be exactly `185` (rounding down `185.9` to `185`).

### AC-4: Zero Cash Bill Checkout (Edge Case)
*   **Given** the customer applied a "Free Detail Wash" voucher, making the cash bill total `0` VND.
*   **When** checkout completes.
*   **Then** the system credits exactly `0` points and does not create an `EARN` points log.
