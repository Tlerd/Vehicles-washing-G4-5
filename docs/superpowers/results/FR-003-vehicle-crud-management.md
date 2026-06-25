# Technical Specification: [FR-003] Vehicle CRUD Management

This document specifies the technical design, requirements, and BDD verification scenarios for customer vehicle profile management (CRUD).

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:medium`
* **Estimate**: 3 days
* **Functional Area**: `area:foundation`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create**: Add a vehicle associated with the logged-in customer.
* **Read**: Retrieve list of vehicles for a specific customer.
* **Update**: Modify vehicle brand, size, notes, or default status.
* **Delete**: Remove a vehicle profile.

### 1.2. Data Dictionary / Fields

| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Yes | Primary Key. |
| `customerId` | String (UUID) | Yes | Foreign Key referencing `customers.id`. |
| `licensePlate` | String | Yes | License plate. (e.g. `51G-123.45`). |
| `brand` | String | Yes | Brand/Make (e.g. `Toyota`, `Mazda`). |
| `size` | Enum | Yes | `hatchback`, `sedan`, `suv`, `pickup`. |
| `notes` | String | No | Optional free-text notes. Max 250 characters. |
| `isDefault` | Boolean | Yes | Flag indicating default vehicle for bookings. |

### 1.3. Business Rules & Constraints

* **Default Exclusivity (BR-003)**: A customer can only have one default vehicle. Setting a vehicle to default must set `isDefault = false` for all other vehicles belonging to that customer.
* **Plate Non-Uniqueness**: License plates are not globally unique (multiple customer accounts can register the same vehicle, e.g. family cars).
* **Format Check**: Plate must match standard Vietnamese license formats (regex-verified).

### 1.4. Role-Based Access Control (RBAC)

* **Authorized Roles**: Customers can CRUD their own vehicles. Administrators can read all vehicles.
* **Security Restrictions**: Customer updates or deletes on vehicles must verify that `vehicle.customerId === currentUserId` to prevent cross-account tampering.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Render inside the "Vehicles & Info" tab of [CustomerDashboard.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/dashboard/CustomerDashboard.tsx).
* **Wireframe**:

    ```text
    +-------------------------------------------------------------+
    | Vehicles List                                [ + Add Car ]  |
    +-------------------------------------------------------------+
    | [ Toyota Camry ]        [ Mazda 3 ]                         |
    | 51G-123.45 [Default]    51A-999.99                          |
    | Size: Sedan             Size: Sedan                         |
    | [ Edit ] [ Delete ]     [ Edit ] [ Delete ] [ Set Default ] |
    +-------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Grid layout**: Displays vehicles as glassmorphic cards.
* **Vehicle Modal Form**: Inputs for License Plate, Brand text, Size selection dropdown, Notes text area, and isDefault checkbox.
* **Confirm Dialog**: Prompt on clicking "Delete" button.

### 2.3. Client-Side Validation

* **License Plate Format**: Regex checks format: `^[0-9]{2}[A-Z]-[0-9]{4,5}$` (e.g. `51G-12345` or `51G-123.45`).

### 2.4. UX States

* **Loading State**: Display skeleton cards while data is being fetched.
* **Feedback States**: Success Toasts on create/update/delete.

---

## 3. Back-end Specifications (BE)

### 3.1. Database Schema Design

```sql
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    notes VARCHAR(250),
    is_default BOOLEAN NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### 3.2. RESTful API Contract

#### Fetch Customer Vehicles

* **Method & Path**: `GET /api/vehicles?customerId={id}`
* **Auth**: Bearer User JWT
* **Response Payload (200 OK)**:

    ```json
    [
      {
        "id": "v71a3962-cf3f-4279-994b-e85d45d3c8c8",
        "customerId": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
        "licensePlate": "51G-123.45",
        "brand": "Toyota Camry",
        "size": "sedan",
        "notes": "My default car",
        "isDefault": true
      }
    ]
    ```

#### Create New Vehicle

* **Method & Path**: `POST /api/vehicles`
* **Request Payload**:

    ```json
    {
      "customerId": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
      "licensePlate": "51A-999.99",
      "brand": "Mazda 3",
      "size": "sedan",
      "notes": "",
      "isDefault": false
    }
    ```

* **Response Payload (201 Created)**:

    ```json
    {
      "success": true,
      "id": "v71a3962-cf3f-4279-994b-e85d45d3c8c9"
    }
    ```

### 3.3. Exception Handling & HTTP Status Codes

* `400 Bad Request` (Invalid payload / license plate formatting mismatch):

    ```json
    {
      "success": false,
      "error": "Invalid license plate format."
    }
    ```

* `403 Forbidden` (Tampering other user's records):

    ```json
    {
      "success": false,
      "error": "Unauthorized vehicle access."
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Add a Vehicle successfully (Happy Path)

* **Given** a logged-in Customer enters a valid plate `51A-999.99` and brand `Mazda 3`.
* **When** they click "Save" in the modal.
* **Then** the client POSTs the details to `/api/vehicles`.
* **And** the vehicle is saved and appended to the dashboard grid list.

### AC-2: Set New Vehicle as Default (Happy Path)

* **Given** the Customer has two vehicles (A is default, B is not default).
* **When** the Customer clicks "Set Default" on vehicle B.
* **Then** the system updates vehicle B's status to `isDefault = true`.
* **And** automatically resets vehicle A's status to `isDefault = false` in the database.

### AC-3: Edit Other User's Vehicle (Edge Case)

* **Given** an authenticated user attempts to send a `PUT /api/vehicles/v71a3962-cf3f-4279-994b-e85d45d3c8c8` belonging to another customer ID.
* **When** the server processes the request.
* **Then** it must verify the token claims, reject the update with `403 Forbidden`, and log an access violation audit warning.

### AC-4: Attempt to delete the only vehicle (Edge Case)

* **Given** the customer has only one vehicle in their list.
* **When** they click "Delete".
* **Then** the system prompts a warning: "You must maintain at least one default vehicle profile for booking," and blocks deletion.

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **An & Nguyen**
* **Back-end Developers**: **Phat & Binh & Anh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (An & Nguyen)**:
  * `[ ]` Design vehicle list tab (license plate, vehicle model, size) and Add/Edit/Delete buttons: **An** (Lead) & **Nguyen** (Support/Review)
  * `[ ]` Build CRUD modal for vehicle operations, integrate LPR license plate scanning simulation: **Nguyen** (Lead) & **An** (Support/Review)
* **Back-end Development (Phat & Binh & Anh)**:
  * `[ ]` Design `Vehicle` Entity with 1-N relationship to `Customer`: **Phat** (Lead), **Binh** (Review) & **Anh** (Support)
  * `[ ]` Write Service business logic for vehicle CRUD, check for duplicate license plates: **Binh** (Lead), **Phat** (Review) & **Anh** (Support)
  * `[ ]` API Controller `/api/v1/vehicles` handling requests: **Phat** (Lead), **Binh** (Review) & **Anh** (Support)
