# Firebase OTP Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Twilio SMS OTP with Firebase Phone Authentication for customer registration (FR-001) in the AutoWash Pro system.

**Architecture:** Use Firebase Client SDK on the Front-end for OTP generation, SMS dispatch, and verification, returning a Firebase ID Token. On the Back-end, initialize Firebase Admin SDK to decode and verify the ID Token, ensuring the phone number is verified before completing registration.

**Tech Stack:** Java 17, Spring Boot 3.x, Firebase Admin SDK, React 18, TypeScript, Firebase Client SDK.

## Global Constraints
- Remove all Twilio SDK and configurations.
- Maintain fallback mock capabilities on Front-end for offline testing.
- Follow existing packaging conventions for Spring Boot layered architecture.

---

### Task 1: Back-end Dependency and Configuration Setup
**Files:**
- Modify: `Back-end/pom.xml`
- Modify: `Back-end/src/main/resources/application.properties`
- Create: `Back-end/src/main/resources/firebase-service-account.json`
- Create: `Back-end/src/main/java/com/autowashpro/config/FirebaseConfig.java`

- [ ] **Step 1: Modify dependencies in pom.xml**
  Remove Twilio and add `firebase-admin` dependency.
- [ ] **Step 2: Update application.properties**
  Remove Twilio config keys and add `firebase.config.path`.
- [ ] **Step 3: Add placeholder firebase-service-account.json**
  Create a placeholder credentials file so compiling does not fail.
- [ ] **Step 4: Create FirebaseConfig.java configuration class**
  Write Java code to initialize `FirebaseApp` using Spring's `@PostConstruct`.
- [ ] **Step 5: Verify build**
  Run: `mvn clean compile` (or `./mvnw clean compile`) in `Back-end`
  Expected: BUILD SUCCESS.

### Task 2: Backend Controller and Service Refactoring
**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/dto/request/RegisterRequest.java`
- Modify: `Back-end/src/main/java/com/autowashpro/controller/AuthController.java`
- Modify: `Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java`
- Delete: `Back-end/src/main/java/com/autowashpro/entity/OtpToken.java`
- Delete: `Back-end/src/main/java/com/autowashpro/repository/OtpTokenRepository.java`
- Delete: `Back-end/src/main/java/com/autowashpro/service/OtpService.java`
- Delete: `Back-end/src/main/java/com/autowashpro/service/impl/OtpServiceImpl.java`
- Delete: `Back-end/src/main/java/com/autowashpro/dto/request/SendOtpRequest.java`
- Delete: `Back-end/src/main/java/com/autowashpro/dto/request/VerifyOtpRequest.java`
- Delete: `Back-end/src/main/java/com/autowashpro/dto/response/SendOtpResponse.java`
- Delete: `Back-end/src/main/java/com/autowashpro/dto/response/VerifyOtpResponse.java`

- [ ] **Step 1: Modify RegisterRequest.java**
  Add the `firebaseToken` field to the request DTO.
- [ ] **Step 2: Remove Otp endpoints in AuthController.java**
  Remove the `/send-otp` and `/verify-otp` mappings.
- [ ] **Step 3: Update AuthServiceImpl.java**
  Implement Firebase Token verification in `register` and verify that the token's phone matches the requested phone.
- [ ] **Step 4: Delete obsolete classes and files**
  Delete all Twilio-related Otp entity, repository, service interfaces, DTOs, and implementations.
- [ ] **Step 5: Verify Backend Compilation**
  Run: `mvn clean compile` in `Back-end`
  Expected: BUILD SUCCESS.

### Task 3: Front-end Dependency & Firebase Client Setup
**Files:**
- Modify: `Front-end/package.json`
- Create: `Front-end/src/config/firebase-config.ts`

- [ ] **Step 1: Install Firebase package**
  Run: `npm install firebase` in `Front-end`
- [ ] **Step 2: Create firebase-config.ts**
  Write client-side config code with fallback to allow mock/offline testing if environment variables are not set.

### Task 4: Front-end Form & State Integration
**Files:**
- Modify: `Front-end/src/features/customer/hooks/use-auth.ts`
- Modify: `Front-end/src/features/customer/components/RegisterForm.tsx`
- Modify: `Front-end/src/features/customer/components/VerifyOtpForm.tsx`
- Modify: `Front-end/src/features/customer/pages/LoginPage.tsx`

- [ ] **Step 1: Update use-auth.ts hooks**
  Adapt hooks to support Firebase Phone Auth with confirmationResult and returning Firebase Token.
- [ ] **Step 2: Update LoginPage.tsx**
  Add state for `confirmationResult` and pass it down.
- [ ] **Step 3: Update RegisterForm.tsx**
  Implement `RecaptchaVerifier` and trigger `signInWithPhoneNumber`. Add an invisible container `<div id="recaptcha-container"></div>`.
- [ ] **Step 4: Update VerifyOtpForm.tsx**
  Update inputs to confirm code via Firebase and display the phone number instead of email.
- [ ] **Step 5: Run client and test compilation**
  Run: `npm run build` in `Front-end`
  Expected: Verification successful, build completed.
