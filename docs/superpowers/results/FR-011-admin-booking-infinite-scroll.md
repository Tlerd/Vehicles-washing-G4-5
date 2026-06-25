# Technical Specification: [FR-011] Admin Booking Management with Infinite Scroll

This document specifies the technical design, requirements, and BDD verification scenarios for implementing the Admin Booking Log featuring lazy loading via infinite scrolling.

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:low`
* **Estimate**: 3 days
* **Functional Area**: `area:exceptions`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create / Update / Delete**: None (Admin booking modifications are handled under operational quầy queues).
* **Read**: Retrieve lists of bookings page-by-page.

### 1.2. Business Rules & Constraints

* **Default Slicing**:
  * **Date**: Default view displays bookings matching the current system date (`today`).
  * **Page Size**: Renders a maximum of 10 bookings per API request.
* **Infinite Scroll Trigger**: The frontend must listen to container scroll boundaries. When scroll height reaches within 100px of the bottom, a request for page `n + 1` must be triggered.
* **State Accumulation**: Subsequent pages of bookings must append to the existing list instead of replacing it.

### 1.3. Role-Based Access Control (RBAC)

* **Authorized Roles**: Administrators.
* **Security Restrictions**: Returns `403 Forbidden` if the calling JWT lacks Admin role claims.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Renders inside [AdminPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/admin/AdminPage.tsx) under the "Booking Management" tab.
* **Wireframe (Infinite Scroll Grid)**:

    ```text
    +-------------------------------------------------------------+
    | [ Filter Status: All ] [ Sort: Time ] [ Date: 2026-06-26 ]  |
    +-------------------------------------------------------------+
    | Ref         Customer   Service       Time      Status       |
    | AWP-101     John Doe   Basic Wash    08:00     CONFIRMED    |
    | ... (10 items)                                              |
    |                                                             |
    |                  [ Loading next bookings... ]               |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Scroll Container**: Scrollable element viewport wrapping the booking table.
* **Loader Component**: Renders a loading spinner skeleton at the bottom of the grid when page fetches are active.

---

## 3. Back-end Specifications (BE)

### 3.1. RESTful API Contract

#### Fetch Bookings with Pagination

* **Method & Path**: `GET /api/admin/bookings`
* **Auth**: Bearer Admin JWT
* **Query Parameters**:
  * `page` (integer, mandatory, starts at `0`)
  * `size` (integer, mandatory, default `10`)
  * `status` (string, optional)
  * `date` (string, optional)
  * `sortBy` (`bookingTime` | `totalPrice`, optional)
  * `sortOrder` (`asc` | `desc`, optional)
* **Response Payload (200 OK)**:

    ```json
    {
      "content": [
        {
          "id": "b71a3962-cf3f-4279-994b-e85d45d3c8d0",
          "bookingRef": "AWP-381927",
          "customerName": "John Doe",
          "vehicleModel": "Toyota Camry",
          "bookingDate": "2026-06-26",
          "bookingTime": "10:00",
          "totalPrice": 230000,
          "status": "CONFIRMED"
        }
      ],
      "pageable": {
        "pageNumber": 0,
        "pageSize": 10
      },
      "last": false,
      "totalPages": 5
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Default Current Date Filtering (Happy Path)

* **Given** the system contains bookings for yesterday, today, and tomorrow.
* **When** the Admin loads the Booking Management tab.
* **Then** the client must send a request to `/api/admin/bookings?date=today`.
* **And** only bookings scheduled for today are rendered.

### AC-2: Scroll to Bottom Appends Bookings (Happy Path)

* **Given** the table is loaded with page 0 (containing 10 items).
* **When** the Admin scrolls down to the bottom boundary of the table container.
* **Then** the client makes a request to `/api/admin/bookings?page=1&size=10`.
* **And** the returned 10 items are appended to the end of the booking grid list.

### AC-3: Status Filter Preserves Scroll (Edge Case)

* **Given** the Admin has scrolled through 3 pages of bookings.
* **When** they select the "PENDING" filter tag.
* **Then** the client must reset `page = 0`, clear the accumulated list, fetch the first page of PENDING bookings, and reset the scroll position to top.

### AC-4: End of Log Notice (Edge Case)

* **Given** the API response contains `"last": true` (no more records exist).
* **When** the user scrolls to the bottom of the table.
* **Then** the scroll event must not fire any API requests.
* **And** the UI must display: "End of bookings history."

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **Phong & An**
* **Back-end Developers**: **Phat & Binh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (Phong & An)**:
  * `[ ]` Design booking list and integrate infinite scroll pagination technique (load additional 10 items): **Phong** (Lead) & **An** (Support/Review)
* **Back-end Development (Phat & Binh)**:
  * `[ ]` API pagination supporting Infinite Scroll to fetch booking list by date: **Phat** (Lead) & **Binh** (Support/Review)
