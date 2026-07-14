# Technical Specification: [FR-001] Customer Registration & Firebase OTP Verification

This document specifies the technical design, requirements, and BDD verification scenarios for implementing customer registration secured with Firebase Phone Authentication OTP verification.

* **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
* **Milestone**: Release 1.0
* **Priority**: `priority:high`
* **Estimate**: 3 days
* **Functional Area**: `area:foundation`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)

* **Create**: Register a new Customer profile in the database upon successful Firebase ID Token verification and password check.
* **Read**: Check if a phone number already exists in the database before sending OTP to prevent duplicate registrations.
* **Update / Delete**: None (handled under user profile edit workflows).

### 1.2. Data Dictionary / Fields

| Field Name | Type | Mandatory | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Customer's full name. Max length 100 characters. |
| `phone` | String | Yes | Phone number in normalized E.164 format. Unique. |
| `password` | String | Yes | Password. Minimum 6 characters. Stored as BCrypt hash. |
| `email` | String | No | Optional email address. Must pass standard email format. |
| `firebaseToken` | String | Yes | Firebase ID Token verified on the backend. |

### 1.3. Business Rules & Constraints

* **Phone Normalization (BR-015)**: The client must strip all non-digit characters and transform local Vietnamese prefixes (e.g. `0901234567`) to E.164 format (e.g., `+84901234567`) before dispatching to Firebase.
* **Firebase Token Verification**: The backend must decode and verify the Firebase ID Token using the Firebase Admin SDK. The phone number verified in the token must match the registration phone number.
* **SMS Rate-Limiting**: Managed natively by Firebase Phone Authentication policies.

### 1.4. Role-Based Access Control (RBAC)

* **Authorized Roles**: Anonymous Guest Users can access all endpoints under this specification.
* **Security Restrictions**: Register endpoints must require a valid, backend-verified Firebase ID Token (`firebaseToken`) to prevent registration via API spoofing.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept

* **Layout**: Render inside the Login/Signup card of [AuthPage.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/auth/AuthPage.tsx). Selecting "Create an account" toggles the form fields.
* **Wireframe**:

    ```text
    +------------------------------------------------+
    |                 Create Account                 |
    +------------------------------------------------+
    | Full Name: [ John Doe                        ] |
    | Phone Number: [ 0901234567     ] [ Send OTP ]  |
    | OTP Code: [ 6-digit Code     ] [ Verify ]    |
    | Password: [ ••••••••••                       ] |
    | Confirm Password: [ ••••••••••               ] |
    | Email (Optional): [ john@example.com         ] |
    +------------------------------------------------+
    |             [ Sign Up & Start ]                |
    +------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls

* **Invisible Recaptcha**: Render `recaptcha-container` invisibly to protect against SMS spam.
* **Countdown Timer**: A 60-second reactive countdown timer displayed next to the "Send OTP" button. The button must show "Resend OTP in XXs" and remain disabled until the timer expires.
* **OTP Verification Input**: A 6-character text input field that remains disabled until the OTP is successfully sent.
* **Submit Button**: The main "Sign Up & Start" button remains disabled until the OTP is successfully confirmed via Firebase and the password matches its confirmation.

### 2.3. Client-Side Validation

* **Phone Regex**: Verify Vietnamese phone formats: `^(0|\+84)(3|5|7|8|9)[0-9]{8}$`.
* **Password Matching**: Check that `password === confirmPassword` in real-time. Highlight fields in red if they differ.

### 2.4. UX States

* **Sending State**: Display a loading spinner inside the "Send OTP" button during the dispatch API call.
* **Error State**: Render a red error banner: "Incorrect OTP code. Please try again" if verification fails.
* **Success State**: Render a green checkmark next to the phone input and show a success Toast upon account registration.

---

## 3. Back-end Specifications (BE)

### 3.1. Database Schema Design

```sql
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tier VARCHAR(20) DEFAULT 'Member',
    accumulated_points INT DEFAULT 0,
    total_spend BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2. RESTful API Contract

#### Submit Registration

* **Method & Path**: `POST /api/v1/auth/register`
* **Request Payload**:

    ```json
    {
      "name": "John Doe",
      "phone": "+84901234567",
      "password": "password_val",
      "email": "john@example.com",
      "firebaseToken": "eyJhbGciOiJSUzI1NiIs..."
    }
    ```

* **Response Payload (201 Created)**:

    ```json
    {
      "success": true,
      "customerId": "c71a3962-cf3f-4279-994b-e85d45d3c8c7"
    }
    ```

### 3.3. Exception Handling & HTTP Status Codes

* `400 Bad Request` (Validation Failures / Invalid Firebase ID Token):

    ```json
    {
      "success": false,
      "error": "Mã xác thực Firebase đã hết hạn hoặc không hợp lệ."
    }
    ```

* `409 Conflict` (Phone already registered):

    ```json
    {
      "success": false,
      "error": "Phone number already registered."
    }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Send OTP to Normalized Number (Happy Path)

* **Given** the user enters a valid Vietnamese phone number `0901234567` in the signup form.
* **When** the user clicks "Send OTP".
* **Then** the client must convert the number to `+84901234567` and invoke the Firebase Client SDK to send the SMS OTP.
* **And** the "Send OTP" button must disable, displaying a 60s countdown timer.

### AC-2: Successful Registration Submission (Happy Path)

* **Given** the user inputs the correct OTP code and clicks "Verify".
* **When** the Firebase Client SDK confirms the code and returns a valid Firebase ID Token.
* **Then** the client submits the registration payload along with the `firebaseToken` to `POST /api/v1/auth/register`.
* **And** the backend verifies the token, matches the phone number, and creates the customer profile in the database.

### AC-3: Failed OTP Code Verification (Edge Case)

* **Given** the user enters a wrong 6-digit code.
* **When** they click "Verify".
* **Then** the Firebase SDK returns verification failure, and the frontend renders an error tag: "Incorrect OTP code. Please try again."
* **And** the "Sign Up & Start" button remains disabled.

### AC-4: Duplicate Phone Number Registration (Edge Case)

* **Given** the phone number `+84901234567` is already registered in the system.
* **When** the user clicks "Send OTP".
* **Then** the API returns `409 Conflict` and the frontend displays: "Phone number already registered."

---

## 5. Task Assignments & Detailed Breakdowns

### 👥 Task Assignments & Pair Programming Roles

* **Front-end Developers**: **Nguyen & Phong**
* **Back-end Developers**: **Phat & Binh & Anh**

### 📝 Detailed Sub-task Breakdowns

* **Front-end Development (Nguyen & Phong)**:
  * `[ ]` Design signup form (name, phone, email) and OTP input UI: **Nguyen** (Lead) & **Phong** (Support/Review)
  * `[ ]` Integrate Firebase Client SDK and RecaptchaVerifier for OTP send/verify: **Phong** (Lead) & **Nguyen** (Support/Review)
* **Back-end Development (Phat & Binh & Anh)**:
  * `[ ]` Database Schema & Entity mapping (table `customers`): **Phat** (Lead), **Binh** (Review) & **Anh** (Support)
  * `[ ]` Integrate Firebase Admin SDK and write token verification logic in `AuthServiceImpl.java`: **Phat** (Lead), **Binh** (Review) & **Anh** (Support)
  * `[ ]` Setup REST Controller `/api/v1/auth/register` with `firebaseToken` check: **Binh** (Lead), **Phat** (Review) & **Anh** (Support)
