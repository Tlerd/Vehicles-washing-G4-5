# Technical Specification: [FR-004] 6-Step Booking Wizard Navigation

This document specifies the technical design, requirements, and BDD verification scenarios for implementing the customer-facing 6-Step Booking Wizard.

*   **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
*   **Milestone**: Release 1.0
*   **Priority**: `priority:high`
*   **Estimate**: 5 days
*   **Functional Area**: `area:foundation`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)
*   **Create / Update / Delete**: None (All data is held in-memory inside the client-side `BookingContext` until final checkout submission).
*   **Read**: 
    *   Query active branch locations.
    *   Query available 30-minute schedule slots based on active appointments.
    *   Query available care services catalog.

### 1.2. Data Dictionary / Fields (Wizard In-Memory State)
| Attribute | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `currentStep` | Integer | Yes | Value `1` to `6` mapping the active wizard view. |
| `vehicleSize` | Enum | Yes | `hatchback`, `sedan`, `suv`, `pickup`. |
| `branchId` | String | Yes | District 1 or District 7 branch identifier. |
| `selectedDate` | String | Yes | ISO string format `YYYY-MM-DD`. |
| `selectedTime` | String | Yes | 30-minute interval string format `HH:mm`. |
| `selectedServices` | Array (String) | Yes | List of service identifiers selected by the user. |
| `customerInfo` | Object | Yes | `{ name, phone, email, licensePlate, vehicleModel, password }`. |

### 1.3. Business Rules & Constraints
*   **Car Size Multiplier (BR-001)**: The vehicle size sets the price multiplier: Hatchback (x0.9), Sedan (x1.0), SUV (x1.2), Pickup (x1.4).
*   **Dynamic Booking Window (BR-004)**: The calendar slider must filter selectable dates based on the customer's tier:
    *   Member: `7` days window.
    *   Silver: `10` days window.
    *   Gold: `12` days window.
    *   Platinum: `14` days window.
*   **Time Interval Slicing**: Booking slots are restricted strictly to 30-minute intervals from `08:00` to `20:00`.
*   **Kem/Yellow Color Constraint**: Detailed descriptions of services must be displayed inside a popup card utilizing the brand Kem/Yellow background (`#fffbeb`).

### 1.4. Role-Based Access Control (RBAC)
*   **Authorized Roles**: Anonymous Guest Users and logged-in Customers can execute this flow.
*   **Security Restrictions**: High-privilege admin or staff accounts are restricted from placing customer bookings.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept
*   **Layout**: Configured inside [BookingPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/booking/BookingPage.tsx). Includes progress header [BookingHeader.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/booking/components/BookingHeader.tsx) and conditional step views.
*   **Wireframe (Step 4 - Services)**:
    ```text
    +------------------------------------------------------------+
    | [Header: Size Xe -> Branch -> Schedule -> Services -> Info]|
    +------------------------------------------------------------+
    | Services Catalog                      | Cart Summary       |
    | [v] Combo VW Basic Wash - 180k        | Size: Sedan (x1.0) |
    |     [ Detail Description Box #fffbeb] | VW Basic:  180,000 |
    | [ ] Combo VW Detail Wash - 280k       | Rửa Gầm:    50,000 |
    | [v] Rửa Gầm - 50k                     |                    |
    |                                       | Total: 230,000 VND |
    |                                       | [ Continue ]       |
    +------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls
*   **Stepper Indicator**: Renders active, completed, and inactive steps. Completed steps can be clicked to jump backward.
*   **Date Slider**: Horizontal carousel displaying days, week names, and availability badges.
*   **Time Grid**: Button matrix for 30-minute slots. fully booked slots are styled with lower opacity (`opacity-50`) and set to `disabled`.
*   **Cart Sidebar**: Sticky panel summarizing size multiplier, duration, list of selected items, and total price.

### 2.3. Client-Side Validation
*   **Navigation guards**: "Continue" buttons must remain disabled until required selections for the current step are in place.

### 2.4. UX States
*   **Transition animation**: Slide/fade transitions when navigating between steps to ensure visual quality.

---

## 3. Back-end Specifications (BE)

### 3.1. RESTful API Contract

#### Fetch Slot Availability
*   **Method & Path**: `GET /api/bookings/available-slots?branchId={id}&date={date}`
*   **Response Payload (200 OK)**:
    ```json
    {
      "date": "2026-06-26",
      "branchId": "b1",
      "slots": [
        { "time": "08:00", "available": true },
        { "time": "08:30", "available": true },
        { "time": "10:00", "available": false },
        { "time": "10:30", "available": false }
      ]
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Car Size Price Multiplication (Happy Path)
*   **Given** the user selects "SUV / CUV" (x1.2 multiplier) in Step 1.
*   **When** they navigate to the Services step and select "VW Basic Wash" (base price 180k).
*   **Then** the price in the accordion list must show `216,000 VND`.
*   **And** the Cart sidebar summary must calculate the total price as `216,000 VND`.

### AC-2: Calendar Range Slicing by Tier (Happy Path)
*   **Given** a logged-in user belongs to the "Platinum" membership tier.
*   **When** they open the wizard at Step 3 (Schedule).
*   **Then** the horizontal date slider must display `14` active calendar dates.
*   **And** if they were a standard Guest user, it would only display `7` calendar dates.

### AC-3: Slot Collision Block (Edge Case)
*   **Given** the slot `10:00 AM` on Chi nhánh Q1 is fully booked.
*   **When** the user loads Step 3 (Schedule).
*   **Then** the `10:00` button in the time grid must display with an inactive background and be set as `disabled`.

### AC-4: Backward State Editing (Edge Case)
*   **Given** the user is on Step 5 (Contact Info).
*   **When** they click "Services" in the stepper header.
*   **Then** the wizard must return to Step 4, keeping all previously selected services checked.
