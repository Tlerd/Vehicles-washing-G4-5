# AI log — 2026-07-21 — [FR-002] Customer Login & Authentication Implementation

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Requirement ID:** FR-002
- **Status:** Completed & Verified
- **Scope:** Customer authentication via phone & password, backend JWT issuance, role-based navigation, and session persistence.

---

## 1. Task

Implement and verify the **FR-002 Customer Login** functionality in both Frontend and Backend:
- Rebuild login page to use real backend authentication (`POST /api/v1/auth/login`) with Phone + Password.
- Handle JWT access token issuance, header bearer injection (`Authorization: Bearer <token>`), and localStorage persistence.
- Implement role-based navigation (`roleNavigation.ts`) to route users according to server-returned roles:
  - `CUSTOMER` → `/app` (Customer Console)
  - `STAFF` → `/staff` (Staff Counter Dashboard)
  - `ADMIN` → `/admin` (Admin Management Portal)
- Enforce layout role guards preventing unauthorized cross-role view rendering.

---

## 2. Technical Details & Architecture

### Backend API & Security
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:** `{ "phone": "+84...", "password": "..." }`
- **Response:** Returns JWT access token, token type, expiry duration, user details (`id`, `fullName`, `phone`, `role`).
- **Security & Filters:** Verified via `JwtAuthenticationFilter` and `SecurityConfig.java`. Password verification via `BCryptPasswordEncoder`.

### Frontend Components & Auth State
- **Auth Context & Client:** `lib/api/client.ts` for automated Bearer header injection; `AuthContext` updated for JWT session management.
- **Login Component:** `LoginPage` rebuilt with phone & password input, client-side validation (Zod schema), error feedback, and loading state.
- **Role Navigation:** `roleNavigation.ts` handles seamless client-side routing based on decoded JWT claims and server response.

---

## 3. Human Validation & Real Evidence

- **Backend Authentication Verification:** Tested `POST /api/v1/auth/login` against live local backend (`http://localhost:8080`).
- **Role Routing Test:** Confirmed credentials for all three roles:
  - Customer login redirects cleanly to `/app` (Dashboard / Garage).
  - Staff login redirects to `/staff`.
  - Admin login redirects to `/admin`.
- **Build & Verification:**
  - `npx tsc --noEmit` exited 0 (clean typescript check).
  - `npm run build` completed successfully without bundle errors.
  - Browser E2E smoke test confirmed persistent login across page refreshes.

---

## 4. Key Decisions & Resolved Issues

- **Fixed Password Login Gap:** Resolved "missing password field" bug by aligning FE login page with backend's native phone+password JWT contract.
- **Role Authorization Guard:** Added route-level protection (`CustomerLayout`, `AdminGuard`, `StaffGuard`) to prevent unauthenticated or unauthorized role access.

---

## 5. Security & Edge Cases Handled

- **Invalid Credentials:** Returns `401 Unauthorized` with friendly error notification ("Số điện thoại hoặc mật khẩu không chính xác").
- **Token Storage & Clean Logout:** Secure JWT token lifecycle with explicit `logout()` clearing localStorage state and active HTTP client headers.
