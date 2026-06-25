# Technical Specification: [FR-012] Admin Income Statistics & Logs

This document specifies the technical design, requirements, and BDD verification scenarios for implementing Administrator Income Statistics and loyalty transaction audit logs.

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:medium`
* **Estimate**: 4 days
* **Functional Area**: `area:exceptions`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create / Update / Delete**: None.
* **Read**:
  * Query aggregated booking cash receipts grouped by time dimensions.
  * Query database transaction logs for points auditing.

### 1.2. Business Rules & Constraints

* **Revenue Status Constraint (BR-012)**: Only bookings with status `COMPLETED` can be included in the revenue aggregations. Pending, confirmed, checked-in, or cancelled bookings are excluded.
* **Aggregation Groups**:
  * **Day**: Sum revenue by day of the current month.
  * **Month**: Sum revenue by month of the current year.
  * **Year**: Sum revenue by year.
* **Audit logs**: Lists customer ID, booking ID, points change, change type (`EARN`, `REDEEM`, `EXPIRE`), and timestamp.

### 1.3. Role-Based Access Control (RBAC)

* **Authorized Roles**: Administrators.
* **Security Restrictions**: High security risk. Endpoint must require Admin authorization JWT.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Renders inside [AdminPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/admin/AdminPage.tsx) under the "Statistics & Logs" tab.
* **Wireframe (Revenue Charts & Tables)**:

    ```text
    +-------------------------------------------------------------+
    | Revenue Overview             [ Day ]  [ *Month* ]  [ Year ] |
    +-------------------------------------------------------------+
    | Total Revenue: 184,200,000 VND                              |
    |                                                             |
    | [ Bar chart showing revenue of Jan, Feb, Mar... ]           |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Group toggle buttons**: Renders Day, Month, Year selectors. Clicking updates chart queries.
* **Audit Table**: Grid showing points ledger updates.

---

## 3. Back-end Specifications (BE)

### 3.1. RESTful API Contract

#### Fetch Revenue Aggregates

* **Method & Path**: `GET /api/admin/stats/income`
* **Auth**: Bearer Admin JWT
* **Query Parameters**:
  * `group` (`day` | `month` | `year`, mandatory)
* **Response Payload (200 OK)**:

    ```json
    [
      { "label": "January", "total": 45000000 },
      { "label": "February", "total": 62000000 }
    ]
    ```

#### Fetch Point Audit Logs

* **Method & Path**: `GET /api/admin/audit/points`
* **Response Payload (200 OK)**:

    ```json
    [
      {
        "id": "t71a3962-cf3f-4279-994b-e85d45d3c8a9",
        "customerName": "John Doe",
        "points": 330,
        "type": "EARN",
        "createdAt": "2026-06-26T10:30:00Z"
      }
    ]
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Aggregate Income by Month (Happy Path)

* **Given** there are completed bookings in Jan, Feb, and March.
* **When** the Admin requests `GET /api/admin/stats/income?group=month`.
* **Then** the server aggregates totals of completed bookings for each month.
* **And** returns a JSON array of monthly revenue labels and numbers.

### AC-2: Points Audit Log Query (Happy Path)

* **Given** point movements exist for users (Earns and Redeems).
* **When** the Admin opens the Audit Logs sub-tab.
* **Then** the client requests `/api/admin/audit/points` and renders the list showing Name, points shift, type, and dates.

### AC-3: Exclude Non-Completed Revenue (Edge Case)

* **Given** a booking of `500,000` VND is in `CHECKED_IN` status.
* **When** the Admin views the Day revenue aggregate.
* **Then** the `500,000` VND must not be included in the revenue sum.

### AC-4: Empty Results Verification (Edge Case)

* **Given** there are no completed bookings for the requested year.
* **When** the Admin requests the Year stats.
* **Then** the backend returns an empty JSON list `[]` without erroring.
* **And** the frontend displays: "No revenue records found."

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **An & Nguyen**
* **Back-end Developers**: **Phat & Binh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (An & Nguyen)**:
  * `[ ]` Design revenue display blocks (support filter buttons to aggregate by Day, Month, Year): **An** (Lead) & **Nguyen** (Support/Review)
  * `[ ]` Table to display audit logs list (Points Transaction History): **An** (Lead) & **Nguyen** (Support/Review)
* **Back-end Development (Phat & Binh)**:
  * `[ ]` API to aggregate branch revenue data by time intervals: **Binh** (Lead) & **Phat** (Support/Review)
  * `[ ]` Entity & Service to store point change history information (Points Audit Logs): **Binh** (Lead) & **Phat** (Support/Review)
