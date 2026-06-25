# Technical Specification: [FR-008] Rewards Redemption & Voucher Management

This document specifies the technical design, requirements, and BDD verification scenarios for implementing the customer rewards catalog, voucher lifecycle, and new user welcome voucher promotions.

*   **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
*   **Milestone**: Release 1.0
*   **Priority**: `priority:medium`
*   **Estimate**: 3 days
*   **Functional Area**: `area:reporting`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)
*   **Create**: Generate a voucher entity in the customer's catalog upon redemption or welcome campaign trigger.
*   **Read**: Retrieve available and historical vouchers associated with a customer.
*   **Update**: 
    *   Lock voucher when applied to a booking (`ACTIVE` ➔ `LOCKED`).
    *   Consume voucher upon booking checkout (`LOCKED` ➔ `USED`).
    *   Unlock voucher if the booking is cancelled/rejected (`LOCKED` ➔ `ACTIVE`).
*   **Delete**: None.

### 1.2. Data Dictionary / Fields
| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Yes | Primary Key. |
| `customerId` | String (UUID) | Yes | Foreign Key referencing `customers.id`. |
| `type` | Enum | Yes | `DISCOUNT_50K`, `FREE_BASIC_WASH`, `FREE_DETAIL_WASH`. |
| `status` | Enum | Yes | `ACTIVE`, `LOCKED`, `USED`. |
| `code` | String | Yes | Unique alphanumeric code (e.g. `VCH-19273`). |
| `createdAt` | Timestamp | Yes | Date and time the voucher was generated. |

### 1.3. Business Rules & Constraints
*   **Redemption Costs (BR-009)**:
    *   `DISCOUNT_50K`: Costs `500` points.
    *   `FREE_BASIC_WASH`: Costs `1,800` points.
    *   `FREE_DETAIL_WASH`: Costs `2,800` points.
*   **New User Welcome Promotion (BR-010)**: Upon checking out the customer's first completed wash, the backend checks:
    *   If total bill paid > `300,000` VND ➔ automatically credit one `DISCOUNT_50K` voucher to their account.
    *   If total bill paid > `500,000` VND ➔ automatically credit one `DISCOUNT_100K` voucher.
*   **Redeem Check**: Customer points balance must be $\ge$ the point cost.

### 1.4. Role-Based Access Control (RBAC)
*   **Authorized Roles**: Customers can redeem vouchers. Staff/System can mutate voucher states.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept
*   **Layout**: Configured under "Redeem Rewards" tab in [CustomerDashboard.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/dashboard/CustomerDashboard.tsx).
*   **Wireframe (Voucher Catalog Card)**:
    ```text
    +---------------------------------------------------+
    | 50,000 VND Discount Voucher                       |
    | Costs: 500 Points                                 |
    | [ Redeem Voucher ]                                |
    +---------------------------------------------------+
    | (Disabled if user has < 500 points. Shows warning)|
    +---------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls
*   **Grid layout**: Renders catalog items with point prices.
*   **Voucher selector dropdown**: Integrated into Step 4 (Services) of the booking wizard.

---

## 3. Back-end Specifications (BE)

### 3.1. Database Schema Design
```sql
CREATE TABLE vouchers (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### 3.2. RESTful API Contract

#### Redeem Points for Voucher
*   **Method & Path**: `POST /api/rewards/redeem`
*   **Request Payload**:
    ```json
    {
      "customerId": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
      "voucherType": "DISCOUNT_50K"
    }
    ```
*   **Response Payload (201 Created)**:
    ```json
    {
      "success": true,
      "voucherCode": "VCH-50K-83210"
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Points Deduction & Voucher Creation (Happy Path)
*   **Given** a Customer has `600` points.
*   **When** they click "Redeem" for a 50k Discount Voucher (cost 500 points).
*   **Then** the backend deducts 500 points, leaving the balance at 100 points.
*   **And** creates a new voucher with status `ACTIVE`.

### AC-2: New User Welcome Gift Trigger (Happy Path)
*   **Given** a new customer registers and places their first booking.
*   **When** the Washing Counter checkout completes the booking with a bill of `350,000` VND.
*   **Then** the system automatically generates a `DISCOUNT_50K` voucher and credits it to the customer's database profile.

### AC-3: Insufficient Points Block (Edge Case)
*   **Given** the customer has `400` points.
*   **When** they attempt to POST a redemption request for a 500-point voucher.
*   **Then** the backend rejects the request with `400 Bad Request` and returns: "Insufficient points balance."
*   **And** the frontend CTA button is disabled.

### AC-4: Revert Voucher on Booking Rejection (Edge Case)
*   **Given** a customer has a voucher locked (`LOCKED`) on a pending booking.
*   **When** the Washing Counter staff rejects the booking.
*   **Then** the system updates the booking status to `CANCELLED`.
*   **And** updates the voucher status back to `ACTIVE`.
