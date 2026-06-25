# Technical Specification: [FR-002] Customer Login & Authentication

This document specifies the technical design, requirements, and BDD verification scenarios for implementing customer login and JWT-based session creation.

*   **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
*   **Milestone**: Release 1.0
*   **Priority**: `priority:high`
*   **Estimate**: 2 days
*   **Functional Area**: `area:foundation`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)
*   **Create**: Generate a valid JSON Web Token (JWT) session upon credentials verification.
*   **Read**: Look up the customer record matching the provided phone number.
*   **Update / Delete**: None.

### 1.2. Data Dictionary / Fields
| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `phone` | String | Yes | Customer's phone number. Standardized to E.164. |
| `password` | String | Yes | Plaintext login password. Checked against stored BCrypt hash. |

### 1.3. Business Rules & Constraints
*   **Security Standard**: Plaintext passwords must never be stored, logged, or transmitted in unencrypted formats.
*   **Verification algorithm**: BCrypt must be used for password validation.
*   **Session Lifetime**: JWT session tokens expire in exactly 24 hours.

### 1.4. Role-Based Access Control (RBAC)
*   **Authorized Roles**: Anonymous Guest Users can access the login endpoint.
*   **Security Restrictions**: High-privilege tokens (e.g. Admin, Washing Counter) must not be generated via the Customer portal login endpoint.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept
*   **Layout**: Render inside the split screen portal on the left card in [AuthPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/auth/AuthPage.tsx).
*   **Wireframe**:
    ```text
    +------------------------------------------------+
    |                     Log In                     |
    +------------------------------------------------+
    | Phone Number: [ 0901234567                   ] |
    | Password:     [ ••••••••••                   ] |
    +------------------------------------------------+
    |                  [ Sign In ]                   |
    +------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls
*   **Input fields**: Standard text input for Phone Number, and password-masked field for Password.
*   **Submit control**: Nút "Sign In" with active status.

### 2.3. Client-Side Validation
*   **Field Presence**: Validate that fields are not empty before firing request.

### 2.4. UX States
*   **Loading State**: Disable form inputs and the "Sign In" button, displaying a spinner when dispatching requests.
*   **Error State**: Render a red banner below inputs: "Incorrect phone number or password."

---

## 3. Back-end Specifications (BE)

### 3.1. RESTful API Contract

#### Authenticate & Login Customer
*   **Method & Path**: `POST /api/auth/login`
*   **Auth**: None (Permit All)
*   **Request Payload**:
    ```json
    {
      "phone": "+84901234567",
      "password": "customer_password_val"
    }
    ```
*   **Response Payload (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "customer": {
        "id": "c71a3962-cf3f-4279-994b-e85d45d3c8c7",
        "name": "John Doe",
        "phone": "+84901234567",
        "tier": "Member",
        "accumulatedPoints": 150,
        "totalSpend": 1200000
      }
    }
    ```

### 3.2. Exception Handling & HTTP Status Codes
*   `401 Unauthorized` (Bad credentials):
    ```json
    {
      "success": false,
      "error": "Incorrect phone number or password."
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Successful Login & Profile Loading (Happy Path)
*   **Given** a customer has a registered account with phone number `0901234567`.
*   **When** they enter correct details and click "Sign In".
*   **Then** the client converts SĐT to `+84901234567` and posts to `/api/auth/login`.
*   **And** the server returns a 200 response with JWT, loading the Customer profile dashboard.

### AC-2: Invalid Password Entry (Edge Case)
*   **Given** the user enters the correct phone number but an incorrect password.
*   **When** they click "Sign In".
*   **Then** the server returns `401 Unauthorized` and the frontend displays: "Incorrect phone number or password."
*   **And** the session is not created.

### AC-3: Unregistered Phone Number Login (Edge Case)
*   **Given** the phone number `0999999999` is not registered in the system.
*   **When** a user attempts to log in with it.
*   **Then** the server returns `401 Unauthorized` and the frontend displays the standard "Incorrect phone number or password" message (preventing user enumeration).
