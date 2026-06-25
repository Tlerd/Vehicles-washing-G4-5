# Technical Specification: [FR-010] Admin Customer Directory

This document specifies the technical design, requirements, and BDD verification scenarios for implementing the Administrator Customer Directory, grid queries, filters, and profile details modal views.

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:medium`
* **Estimate**: 4 days
* **Functional Area**: `area:exceptions`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create / Delete**: None (All customer creations are handled by signup/guest workflows).
* **Read**:
  * Search and filter the list of customers.
  * Load detailed customer profile logs (vehicles list, booking history, points logs).
* **Update**: Edit customer profile fields (Name, Phone, Email) via the detail modal.

### 1.2. Business Rules & Constraints

* **Directory Query Slicing**:
  * **Search**: Match query strings against Customer Name, Phone Number, or Vehicle License Plates.
  * **Filters**: Sift results based on active loyalty tiers: `Member`, `Silver`, `Gold`, `Platinum`.
  * **Sorting**: Sort results by: `Registration Date` (newest first), `Total Spend` (highest first), or `Points Balance` (highest first).
* **License Plate Format Check**: Updated phone/email entries must follow standard format validation checks.

### 1.3. Role-Based Access Control (RBAC)

* **Authorized Roles**: Administrators.
* **Security Restrictions**: Non-admin users are strictly blocked. API calls must reject with `403 Forbidden` if JWT token does not hold the `ROLE_ADMIN` claim.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Configured inside [AdminPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/admin/AdminPage.tsx) under the "Customer Management" tab.
* **Wireframe (Customer Directory Table)**:

    ```text
    +-------------------------------------------------------------+
    | [ Search name/phone/plate ] [ Filter: Silver ] [ Sort: Spent]|
    +-------------------------------------------------------------+
    | Name       Phone         Tier    Spend       Points  Action |
    | John Doe   +84901234567  Silver  2,400,000   330     [View] |
    | Jane Smith +84918765432  Gold    6,800,000   1,200   [View] |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Grid list table**: Standard paginated grid.
* **Details Modal**: Overlay card rendering profile inputs, vehicle CRUD components, booking history list, and points transaction logs.

---

## 3. Back-end Specifications (BE)

### 3.1. RESTful API Contract

#### Fetch Customers List

* **Method & Path**: `GET /api/admin/customers`
* **Auth**: Bearer Admin JWT
* **Query Parameters**:
  * `search` (string, optional)
  * `tier` (string, optional)
  * `sortBy` (`createdAt` | `totalSpend` | `points`, optional)
  * `sortOrder` (`asc` | `desc`, optional)
* **Response Payload (200 OK)**:

    ```json
    [
      {
        "id": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
        "name": "John Doe",
        "phone": "+84901234567",
        "email": "john@example.com",
        "tier": "Silver",
        "accumulatedPoints": 330,
        "totalSpend": 2400000,
        "createdAt": "2026-06-24T10:00:00Z"
      }
    ]
    ```

#### Update Customer Profile

* **Method & Path**: `PUT /api/admin/customers/{id}`
* **Request Payload**:

    ```json
    {
      "name": "Johnathan Doe",
      "email": "john.doe@example.com",
      "phone": "+84901234567"
    }
    ```

* **Response Payload (200 OK)**:

    ```json
    {
      "success": true
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Search Customer by License Plate (Happy Path)

* **Given** Customer A has registered a vehicle with license plate `51G-123.45`.
* **When** the Admin enters `51G` in the search bar.
* **Then** Customer A's record must be returned in the grid results.

### AC-2: Sort Customer List by Total Spend (Happy Path)

* **Given** Customer A has total spent `2,000,000` VND and Customer B has total spent `6,000,000` VND.
* **When** the Admin selects sorting by "Total Spend" in descending order.
* **Then** Customer B must be listed before Customer A in the directory.

### AC-3: Customer Profile Email Format Validation (Edge Case)

* **Given** the Admin is modifying Customer A's profile in the detail modal.
* **When** they enter an invalid email `john-example.com` and click "Save".
* **Then** the frontend blocks the submission, displaying: "Please enter a valid email address."

### AC-4: Non-Admin Access Rejection (Edge Case)

* **Given** a Customer attempts to directly invoke `GET /api/admin/customers` using their Customer JWT token.
* **When** the server validates the request header.
* **Then** it must return `403 Forbidden` and prevent data exposure.

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **Nguyen & Phong**
* **Back-end Developers**: **Phat & Binh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (Nguyen & Phong)**:
  * `[ ]` Build customer list table (Registry) with search & filter by tier functionality: **Nguyen** (Lead) & **Phong** (Support/Review)
  * `[ ]` Detail modal displaying complete customer profile, vehicle list, booking history, and points activity: **Nguyen** (Lead) & **Phong** (Support/Review)
* **Back-end Development (Phat & Binh)**:
  * `[ ]` API for pagination, customer search by name, phone, license plate: **Binh** (Lead) & **Phat** (Support/Review)
  * `[ ]` API to query points history and accumulated points for each customer: **Binh** (Lead) & **Phat** (Support/Review)
