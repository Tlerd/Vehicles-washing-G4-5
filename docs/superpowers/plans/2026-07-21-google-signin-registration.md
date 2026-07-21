# Google Sign-In Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor create an account via Google Sign-In (verifies email) as an alternative to Phone OTP (verifies phone), collecting phone + password in the same flow either way, while login stays phone+password-only for every account.

**Architecture:** Firebase Admin SDK already disambiguates providers inside a verified token (`phone_number` claim for Phone OTP, `email` claim for Google) — `AuthServiceImpl.register()` branches on that instead of a new endpoint or a client-declared provider field. A new `FirebaseTokenVerifier` seam replaces the current static `FirebaseAuth.getInstance().verifyIdToken()` call so the branching logic is unit-testable. Frontend adds a second entry point on the existing register screen that converges on the same `enter-details` step the phone path already uses.

**Tech Stack:** Spring Boot 3.5.6 / Java 17 / JUnit 5 + Mockito + AssertJ (already in `spring-boot-starter-test`) on the backend; React 19 / TypeScript / Firebase JS SDK on the frontend.

## Global Constraints

- Login stays phone+password for every account — no "Sign in with Google" path is added anywhere (per owner decision, 2026-07-21).
- Phone number and password are collected during Google sign-up itself — no nullable-phone account state, no booking-time gate (per owner decision).
- A duplicate phone or email during registration is rejected with a conflict error — no automatic account linking/merging (per owner decision).
- Frontend has no test or lint script — do not add one (AGENTS.md). Frontend verification in this plan is `tsc --noEmit`, `npm run build`, and explicit manual browser steps.
- No secrets, `.env` values, or Firebase service-account content may be committed.
- Full design: `docs/superpowers/specs/2026-07-21-google-signin-registration-design.md`.

---

## Task 1: Backend — testable `FirebaseTokenVerifier` seam + regression tests for the existing phone-OTP path

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/service/VerifiedFirebaseIdentity.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/FirebaseTokenVerifier.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/impl/FirebaseTokenVerifierImpl.java`
- Modify: `Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java`
- Test: `Back-end/src/test/java/com/autowashpro/service/impl/AuthServiceImplTest.java` (new file — first test in the repo)

**Interfaces:**
- Produces: `record VerifiedFirebaseIdentity(String phoneNumber, String email)` — `phoneNumber()`/`email()` accessors, either may be `null`.
- Produces: `interface FirebaseTokenVerifier { VerifiedFirebaseIdentity verify(String token) throws FirebaseAuthException; }`
- Produces: `AuthServiceImpl(CustomerRepository, PasswordEncoder, JwtTokenProvider, VoucherRepository, FirebaseTokenVerifier)` — 5-arg constructor (was 4-arg).
- Consumes (existing, unchanged): `RegisterRequest` getters (`getName/getPhone/getPassword/getEmail/getFirebaseToken`), `RegisterResponse(boolean, String)`, `Customer` setters, `PhoneNormalizer.toE164(String)`.

- [ ] **Step 1: Write the failing test file**

```java
package com.autowashpro.service.impl;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VoucherRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.google.firebase.auth.FirebaseAuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private VoucherRepository voucherRepository;
    @Mock private FirebaseTokenVerifier firebaseTokenVerifier;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                customerRepository, passwordEncoder, jwtTokenProvider, voucherRepository, firebaseTokenVerifier);
    }

    @Test
    void register_withVerifiedPhoneOtp_createsAccount() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-phone-token");

        when(firebaseTokenVerifier.verify("valid-phone-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(customerRepository.existsByPhone("+84901234567")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setCustomerId(1L);
            return saved;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getCustomerId()).isEqualTo("1");
    }

    @Test
    void register_withMismatchedPhone_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-phone-token");

        when(firebaseTokenVerifier.verify("valid-phone-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84909999999", null));
        when(customerRepository.existsByPhone("+84901234567")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void register_withDuplicatePhone_throwsConflict() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("any-token");

        when(customerRepository.existsByPhone("+84901234567")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `mvn -f Back-end/pom.xml test -Dtest=AuthServiceImplTest`
Expected: COMPILATION FAILURE — `cannot find symbol: class FirebaseTokenVerifier` / `class VerifiedFirebaseIdentity` (neither exists yet), and `AuthServiceImpl(...)` doesn't have a 5-arg constructor yet.

- [ ] **Step 3: Create the seam and wire it into `AuthServiceImpl`**

`Back-end/src/main/java/com/autowashpro/service/VerifiedFirebaseIdentity.java`:
```java
package com.autowashpro.service;

/** Provider-agnostic result of verifying a Firebase ID token: a Phone-OTP
 *  token populates {@code phoneNumber}; a Google Sign-In token populates
 *  {@code email} instead. Exactly one is non-null for a successfully
 *  verified token. */
public record VerifiedFirebaseIdentity(String phoneNumber, String email) {
}
```

`Back-end/src/main/java/com/autowashpro/service/FirebaseTokenVerifier.java`:
```java
package com.autowashpro.service;

import com.google.firebase.auth.FirebaseAuthException;

public interface FirebaseTokenVerifier {
    VerifiedFirebaseIdentity verify(String token) throws FirebaseAuthException;
}
```

`Back-end/src/main/java/com/autowashpro/service/impl/FirebaseTokenVerifierImpl.java`:
```java
package com.autowashpro.service.impl;

import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Component;

@Component
public class FirebaseTokenVerifierImpl implements FirebaseTokenVerifier {

    @Override
    public VerifiedFirebaseIdentity verify(String token) throws FirebaseAuthException {
        FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
        String phoneNumber = (String) decoded.getClaims().get("phone_number");
        return new VerifiedFirebaseIdentity(phoneNumber, decoded.getEmail());
    }
}
```

In `Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java`, replace the imports and constructor:

```java
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
```
(remove the now-unused `com.google.firebase.auth.FirebaseAuth` and `com.google.firebase.auth.FirebaseToken` imports; keep `FirebaseAuthException`)

```java
private final CustomerRepository customerRepository;
private final PasswordEncoder passwordEncoder;
private final JwtTokenProvider jwtTokenProvider;
private final VoucherRepository voucherRepository;
private final FirebaseTokenVerifier firebaseTokenVerifier;

public AuthServiceImpl(
        CustomerRepository customerRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        VoucherRepository voucherRepository,
        FirebaseTokenVerifier firebaseTokenVerifier) {
    this.customerRepository = customerRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenProvider = jwtTokenProvider;
    this.voucherRepository = voucherRepository;
    this.firebaseTokenVerifier = firebaseTokenVerifier;
}
```

Replace the body of `register()` (everything from `String phone = ...` through the Firebase-verification `try/catch`) with:

```java
@Override
@Transactional
public RegisterResponse register(RegisterRequest request) {
    String phone = PhoneNormalizer.toE164(request.getPhone());

    if (customerRepository.existsByPhone(phone)) {
        throw new ConflictException("Phone number already registered.");
    }

    VerifiedFirebaseIdentity identity;
    try {
        identity = firebaseTokenVerifier.verify(request.getFirebaseToken());
    } catch (FirebaseAuthException e) {
        throw new BadRequestException("Mã xác thực Firebase đã hết hạn hoặc không hợp lệ: " + e.getMessage());
    }

    if (identity.phoneNumber() != null) {
        String requestPhone = PhoneNormalizer.toE164(phone);
        String firebaseVerifiedPhone = PhoneNormalizer.toE164(identity.phoneNumber());

        if (!requestPhone.equals(firebaseVerifiedPhone)) {
            throw new BadRequestException("Số điện thoại đăng ký không trùng khớp với số điện thoại xác minh trên Firebase.");
        }
    } else {
        throw new BadRequestException("Mã xác minh của Firebase không chứa số điện thoại.");
    }

    Customer customer = new Customer();
    customer.setFullName(request.getName());
    customer.setPhone(phone);
    customer.setEmail(request.getEmail());
    customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    customer.setTier("Member");
    customer.setRole("CUSTOMER");
    customer.setAccumulatedPoints(0);
    customer.setTotalSpent(BigDecimal.ZERO);
    customer.setTotalWashes(0);
    customer.setCreatedAt(LocalDateTime.now());
    customer.setUpdatedAt(LocalDateTime.now());

    Customer savedCustomer = customerRepository.save(customer);

    Voucher welcome = new Voucher();
    welcome.setCustomer(savedCustomer);
    welcome.setVoucherCode("WELCOME-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    welcome.setVoucherType("DISCOUNT_50K");
    welcome.setDiscountAmount(new BigDecimal("50000"));
    welcome.setStatus("ACTIVE");
    welcome.setExpiredAt(LocalDate.now().plusMonths(1));
    voucherRepository.save(welcome);

    return new RegisterResponse(true, String.valueOf(savedCustomer.getCustomerId()));
}
```

This step is intentionally still phone-only (the `else` branch always throws) — Task 2 adds the Google branch. This step's only job is: introduce the seam, keep current behavior identical, make it pass the three tests above.

- [ ] **Step 4: Run the test to verify it passes**

Run: `mvn -f Back-end/pom.xml test -Dtest=AuthServiceImplTest`
Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/VerifiedFirebaseIdentity.java Back-end/src/main/java/com/autowashpro/service/FirebaseTokenVerifier.java Back-end/src/main/java/com/autowashpro/service/impl/FirebaseTokenVerifierImpl.java Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java Back-end/src/test/java/com/autowashpro/service/impl/AuthServiceImplTest.java
git commit -m "test: extract FirebaseTokenVerifier seam and add first AuthServiceImpl regression tests"
```

---

## Task 2: Backend — Google Sign-In registration branch

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/repository/CustomerRepository.java`
- Modify: `Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java`
- Test: `Back-end/src/test/java/com/autowashpro/service/impl/AuthServiceImplTest.java`

**Interfaces:**
- Consumes: `VerifiedFirebaseIdentity`, `FirebaseTokenVerifier` from Task 1.
- Produces: `CustomerRepository.existsByEmail(String email): boolean` — used by `AuthServiceImpl` and available to any future caller.

- [ ] **Step 1: Add the failing tests**

Append to `Back-end/src/test/java/com/autowashpro/service/impl/AuthServiceImplTest.java` (add `import static org.mockito.Mockito.never;` and `import static org.mockito.Mockito.verify;` to the existing import block):

```java
    @Test
    void register_withGoogleIdentity_createsAccountUsingSubmittedPhoneAndTokenEmail() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "vanb@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);
        when(customerRepository.existsByEmail("vanb@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setCustomerId(2L);
            return saved;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getCustomerId()).isEqualTo("2");
    }

    @Test
    void register_withGoogleIdentityAndMismatchedSubmittedEmail_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setEmail("someone-else@gmail.com");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "vanb@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void register_withDuplicateEmail_throwsConflict() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "taken@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);
        when(customerRepository.existsByEmail("taken@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class);

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void register_withTokenMissingPhoneAndEmail_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van C");
        request.setPhone("0901112233");
        request.setPassword("secret123");
        request.setFirebaseToken("no-identity-token");

        when(firebaseTokenVerifier.verify("no-identity-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, null));
        when(customerRepository.existsByPhone("+84901112233")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `mvn -f Back-end/pom.xml test -Dtest=AuthServiceImplTest`
Expected: `Tests run: 7, Failures: 4` (or `Errors: 4`) — the 3 tests from Task 1 still pass; the 4 new ones fail because `register()`'s `else` branch unconditionally throws `BadRequestException` for any non-phone identity, so the Google-success and duplicate-email tests get a `BadRequestException`/`NullPointerException` instead of the expected outcome (`existsByEmail` doesn't exist yet, in fact — this test file itself won't compile until Step 3 adds the repository method; if that's the case, expect COMPILATION FAILURE instead, same meaning: not yet implemented).

- [ ] **Step 3: Implement the Google branch and `existsByEmail`**

In `Back-end/src/main/java/com/autowashpro/repository/CustomerRepository.java`, add one line inside the interface:

```java
boolean existsByEmail(String email);
```

In `Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java`, replace the identity-branch block (the `if (identity.phoneNumber() != null) { ... } else { throw ... }` from Task 1) and the `customer.setEmail(...)` line with:

```java
    String email = request.getEmail();

    if (identity.phoneNumber() != null) {
        String requestPhone = PhoneNormalizer.toE164(phone);
        String firebaseVerifiedPhone = PhoneNormalizer.toE164(identity.phoneNumber());

        if (!requestPhone.equals(firebaseVerifiedPhone)) {
            throw new BadRequestException("Số điện thoại đăng ký không trùng khớp với số điện thoại xác minh trên Firebase.");
        }
    } else if (identity.email() != null) {
        if (email != null && !email.isBlank() && !email.trim().equalsIgnoreCase(identity.email())) {
            throw new BadRequestException("Email đăng ký không trùng khớp với email xác minh trên Google.");
        }
        email = identity.email();
    } else {
        throw new BadRequestException("Mã xác minh của Firebase không chứa số điện thoại hoặc email.");
    }

    if (email != null && !email.isBlank() && customerRepository.existsByEmail(email)) {
        throw new ConflictException("Email already registered.");
    }

    Customer customer = new Customer();
    customer.setFullName(request.getName());
    customer.setPhone(phone);
    customer.setEmail(email);
```

(the rest of `register()` — password hashing through the welcome-voucher save and return — is unchanged from Task 1)

- [ ] **Step 4: Run the tests to verify all pass**

Run: `mvn -f Back-end/pom.xml test -Dtest=AuthServiceImplTest`
Expected: `Tests run: 7, Failures: 0, Errors: 0`

- [ ] **Step 5: Run the full backend build**

Run: `mvn -f Back-end/pom.xml test`
Expected: `BUILD SUCCESS`, all tests green (confirms nothing else in the module broke).

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/repository/CustomerRepository.java Back-end/src/main/java/com/autowashpro/service/impl/AuthServiceImpl.java Back-end/src/test/java/com/autowashpro/service/impl/AuthServiceImplTest.java
git commit -m "feat: support Google Sign-In as a registration identity provider"
```

---

## Task 3: Frontend — wire Google Sign-In into the registration UI

**Files:**
- Modify: `Front-end/src/features/auth/pages/LoginPage.tsx`
- Modify: `Front-end/src/lib/api/auth.ts` (doc-comment only)

**Interfaces:**
- Consumes: `signInWithGoogle(): Promise<User>` from `Front-end/src/lib/firebase.ts:50` (already implemented, unwired); `User.getIdToken(): Promise<string>`, `.email`, `.displayName` (Firebase SDK, already used elsewhere in this file for the phone path's `confirmOtp` result).
- Consumes: `toE164(input: string): string | null` from `@/lib/phone` (already imported in this file).
- No new exports — this task only changes UI wiring inside the existing register flow.

- [ ] **Step 1: Add the `authMethod` state and `handleGoogleSignIn` handler**

In `Front-end/src/features/auth/pages/LoginPage.tsx`, add `signInWithGoogle` to the existing Firebase import:

```tsx
import { isFirebaseConfigured, sendOtp, confirmOtp, signInWithGoogle } from '@/lib/firebase';
```

Add new state right after the existing `step` state declaration:

```tsx
  const [step, setStep] = useState<RegisterStep>('enter-phone');
  const [authMethod, setAuthMethod] = useState<'phone' | 'google'>('phone');
```

Add a new handler after `handleConfirmOtp`:

```tsx
  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      setFirebaseToken(await user.getIdToken());
      setName(user.displayName ?? '');
      setEmail(user.email ?? '');
      setAuthMethod('google');
      setStep('enter-details');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };
```

- [ ] **Step 2: Add Google-popup error mappings**

In `friendlyError()`, add two more `if` lines alongside the existing OTP ones:

```tsx
  if (code === 'auth/invalid-phone-number') return 'Số điện thoại không hợp lệ.';
  if (code === 'auth/popup-closed-by-user') return 'Bạn đã đóng cửa sổ đăng nhập Google.';
  if (code === 'auth/cancelled-popup-request') return 'Đã hủy yêu cầu đăng nhập Google, thử lại.';
```

- [ ] **Step 3: Add the Google entry option to the `enter-phone` register step**

Replace the `{mode === 'register' && step === 'enter-phone' && ( ... )}` block with:

```tsx
        {mode === 'register' && step === 'enter-phone' && (
          <div className="space-y-4">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Field label="Số điện thoại">
                <Input
                  placeholder="0912345678"
                  inputMode="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi mã OTP
              </Button>
            </form>

            {isFirebaseConfigured && (
              <>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="h-px flex-1 bg-border" />
                  hoặc
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="w-full"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Đăng ký bằng Google
                </Button>
              </>
            )}
          </div>
        )}
```

- [ ] **Step 4: Add the phone field and read-only email to the `enter-details` step**

Replace the `{mode === 'register' && step === 'enter-details' && ( ... )}` block with:

```tsx
        {mode === 'register' && step === 'enter-details' && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            {authMethod === 'google' && (
              <Field label="Số điện thoại">
                <Input
                  placeholder="0912345678"
                  inputMode="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </Field>
            )}
            <Field label="Họ tên">
              <Input placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={authMethod === 'google' ? 'Email (đã xác minh qua Google)' : 'Email (không bắt buộc)'}>
              <Input
                type="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={authMethod === 'google'}
                className={authMethod === 'google' ? 'opacity-70' : undefined}
              />
            </Field>
            <Field label="Mật khẩu (tối thiểu 6 ký tự)">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              disabled={
                busy ||
                password.length < 6 ||
                !name.trim() ||
                (authMethod === 'google' && !toE164(regPhone))
              }
              className="w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Hoàn tất đăng ký
            </Button>
          </form>
        )}
```

`handleCompleteRegistration` itself needs no changes — it already reads `firebaseToken`, `regPhone`, `name`, `email`, `password` from state generically, and both entry paths now populate the same state before reaching `enter-details`.

- [ ] **Step 5: Update the stale doc-comment in the API client**

In `Front-end/src/lib/api/auth.ts`, replace:

```tsx
  /** Firebase ID token from a completed Phone-OTP verification; the backend
   *  checks its phone_number claim matches `phone` before creating the row. */
  firebaseToken: string;
```

with:

```tsx
  /** Firebase ID token from a completed Phone-OTP or Google Sign-In
   *  verification; the backend checks its phone_number or email claim
   *  against the submitted phone/email before creating the row. */
  firebaseToken: string;
```

- [ ] **Step 6: Typecheck**

Run: `npm --prefix Front-end run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 7: Production build**

Run: `npm --prefix Front-end run build`
Expected: `✓ built` with no new warnings beyond the pre-existing chunk-size warning.

- [ ] **Step 8: Manual verification in the browser**

The backend must be running (`pwsh -File Back-end/run-local.ps1`) and the frontend dev server running (`npm --prefix Front-end run dev`) for this step.

1. Open `http://localhost:5173/login`, click the "Đăng ký" tab.
2. Confirm the phone-number form still renders, followed by a "hoặc" divider and a "Đăng ký bằng Google" button below it.
3. Click "Đăng ký bằng Google" — a Google account-picker popup should open.
4. Complete the Google sign-in in the popup.
5. Expected: back on the page, the form now shows a phone-number field first, then Họ tên (pre-filled from the Google account), then a read-only Email field (pre-filled from the Google account), then Mật khẩu.
6. Enter a phone number not already registered and a password of 6+ characters, submit.
7. Expected: registration succeeds and the app lands on `/booking` (or wherever `redirectTo` points), matching the existing phone-OTP registration's post-submit behavior — because `handleCompleteRegistration` is shared, unchanged code.
8. Repeat steps 1-4 using a Google account whose email is already registered on an existing account (or re-run step 6 with the same Google account a second time) — expected: a Vietnamese error message appears (from the backend's `409 Email already registered.`) instead of a silent failure or a duplicate account.

- [ ] **Step 9: Commit**

```bash
git add Front-end/src/features/auth/pages/LoginPage.tsx Front-end/src/lib/api/auth.ts
git commit -m "feat: wire Google Sign-In into the registration UI"
```

---

## Follow-ups explicitly out of scope for this plan

- Updating `docs/srs/FR-001-customer-registration-otp.md` and `docs/srs/FR-002-customer-login.md` to describe the real (phone+password login, immediate-phone Google registration, reject-on-duplicate) design instead of the aspirational Firebase-token-only one — a docs-only follow-up, not blocking this feature.
- Google Sign-In as a login method for returning users — explicitly rejected in the design (see spec's Non-goals).
- Account linking/merging on duplicate identity — explicitly rejected in the design.
