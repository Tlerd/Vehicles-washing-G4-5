# Change Log - Auth API Integration
Đặng Minh Bình An
Date: 2026-06-27

## Summary

Removed demo/mock account authentication data from the frontend and updated the auth flow to use backend API endpoints.

## Changed Files

- `src/services/customer/auth.service.ts`
  - Removed dependency on `mockStore` for login/register.
  - Removed local demo login credentials.
  - Removed guest login creation.
  - Removed mock OTP behavior and hardcoded OTP validation.
  - Added API calls for:
    - `POST /auth/login`
    - `POST /auth/register`
    - `POST /auth/send-otp`
    - `POST /auth/verify-otp`
  - Added flexible response handling for token fields such as `token`, `accessToken`, or `jwt`.

- `src/context/AuthContext.tsx`
  - Converted `login` and `register` to async functions.
  - Removed fake `mock_jwt_token` generation.
  - Removed `loginAsGuest`.
  - Removed `isGuest` from auth state.
  - Stores backend token in `localStorage` when returned by the API.

- `src/features/customer/pages/LoginPage.tsx`
  - Removed prefilled demo phone number and password.
  - Removed "Continue as Guest" button.
  - Removed demo credential hint text.
  - Added login loading text while the API request is pending.

- `src/features/customer/hooks/use-auth.ts`
  - Updated OTP and registration hooks to await real API-backed service calls.
  - Removed artificial delay behavior.
  - Removed hardcoded mock OTP flow.

- `src/routes/ProtectedRoute.tsx`
  - Removed guest-auth route bypass.
  - Removed default role fallback.
  - Routes now require authenticated users with valid allowed roles.

- `src/features/customer/components/RegisterForm.tsx`
  - Replaced demo phone placeholder with a generic phone placeholder.

- `scripts/fr-admin-role-access-test.mjs`
  - Updated assertions so tests no longer require local demo admin credentials.

## Verification

- Searched for old demo auth strings and removed matches from `src` and `scripts`.
- Ran:

```bash
npm.cmd run build
```

Result: build completed successfully.

Note: Vite printed deprecation warnings related to the React plugin/rolldown options, but there were no build errors.

## API Base URL

The frontend still uses `src/config/axios.ts`.

Default API URL:

```text
http://localhost:8080/api
```

Override with:

```text
VITE_API_URL
```
