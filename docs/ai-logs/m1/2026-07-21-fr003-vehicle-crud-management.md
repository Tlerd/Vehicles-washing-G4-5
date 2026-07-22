# AI Log — [FR-003] Vehicle CRUD Management

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Requirement ID:** FR-003
- **Status:** Completed & Verified
- **Scope:** Customer garage vehicle CRUD (Create, Read, Update, Delete), vehicle size category classification, and authorization guards.

---

## 1. Task Description

Implement and verify vehicle management capabilities for **FR-003**:
- Allow authenticated customers to manage their personal garage vehicles (Create, List, Update, Delete).
- Support vehicle size classification: `hatchback`, `sedan`, `suv`, `pickup` to feed into booking price calculation.
- Support default vehicle selection for fast booking workflow.
- Enforce strict ownership authorization: users can only access and modify vehicles they own.

---

## 2. Implementation & Technical Details

### Frontend Components & Workflow
- **Garage Management Page:** Developed `GaragePage.tsx` interface featuring vehicle card list, default badge indicator, add/edit modal, and delete confirmation dialog.
- **Brand & Model Selectors:** Integrated `VehicleBrandDropdown` component for standardized brand selection (Toyota, Honda, Mazda, Mercedes, etc.).
- **Vehicle Size Selection:** Mapped vehicle models to standard size categories (`hatchback`, `sedan`, `suv`, `pickup`).

### Backend Integration & Security
- **API Endpoints:**
  - `GET /api/v1/vehicles` — list current user's vehicles
  - `POST /api/v1/vehicles` — create new vehicle
  - `PUT /api/v1/vehicles/{id}` — update vehicle details
  - `DELETE /api/v1/vehicles/{id}` — delete vehicle
- **Authorization Check:** Implemented ownership validation in `VehicleServiceImpl`; attempting to modify another user's vehicle returns `403 Forbidden`.

---

## 3. Business Rules Compliance

- **BR-001:** Vehicle size mapping feeds into price multipliers (`sedan` = 1.0x, `suv` = 1.2x, `pickup` = 1.3x, `hatchback` = 0.9x).
- **BR-020:** Vehicle size updates by staff during check-in log an audit record and update the customer's saved vehicle size.

---

## 4. Verification & Testing Evidence

- **Type Check:** `npx tsc --noEmit` clean.
- **Frontend Build:** `npm run build` executed without issues.
- **Backend Tests:** `VehicleControllerTest` verified CRUD endpoints with mocked JWT principal.
- **Browser Live Verification:** Created, edited, set default, and deleted vehicles in Customer Garage console (`/app/garage`).

---

## 5. Security & Edge Cases Handled

- **IDOR Protection:** Verified that passing a foreign vehicle ID to `PUT` or `DELETE` endpoints produces `403 Forbidden`.
- **License Plate Formatting:** Sanitized license plate input to prevent special character injections.
