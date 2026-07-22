# FR-004/FR-005 v2 Booking Engine — Phase 2: Guest Identity & OTP/Firebase Verification-Proof Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the secure backend primitives that guest booking creation and guest booking lookup will depend on in a later phase: server-side Firebase identity verification that never trusts a client `otpVerified` flag, a short-lived/single-use/purpose-bound/phone-bound verification proof persisted in SQL Server (so single-use correctness survives concurrent requests and process restarts), deterministic in-process rate limiting, and a tested authorization primitive for a future `GET /api/v1/bookings/{ref}` guest lookup. This phase adds **no HTTP controller** and **no VNPAY, slot-allocation, Swagger, or frontend work** — those remain later phases.

**Architecture:** One new additive, idempotent SQL Server table (`phone_verification_proofs`), matching this repo's existing hand-written `.sql` convention — no Flyway/Liquibase. Proof single-use correctness is enforced with a conditional `UPDATE ... WHERE ... AND consumed_at IS NULL AND expires_at > :now` guarded by the row's own primary-key lock under SQL Server's default READ COMMITTED isolation — the standard "compare-and-swap via UPDATE" pattern, requiring no `SERIALIZABLE` isolation and no in-memory locking. Rate limiting is a single-instance, in-memory, `Clock`-injected component (no Redis — this app is single-instance, matching Phase 1's `UX_bay_slot`-over-Redis precedent for the same reason). All new Java code follows this codebase's exact existing conventions: Lombok `@Getter/@Setter/@NoArgsConstructor/@AllArgsConstructor` entities, constructor-injected services, `GlobalExceptionHandler`'s existing two-shape error envelope (extended with one new 429 mapping), and the `FirebaseTokenVerifier`/`PhoneNormalizer` abstractions already proven in `AuthServiceImpl`.

**Tech Stack:** Java 17, Spring Boot 3.5.6 (Spring Data JPA, Spring Security, Spring Boot Test), SQL Server (`mssql-jdbc`), JUnit 5, Mockito, AssertJ, `firebase-admin` 9.2.0 — all already on the classpath. **No new Maven dependency is added in this phase.** `java.security.SecureRandom` and `java.util.concurrent.*` are JDK-standard, not external dependencies.

## Global Constraints

- Java 17 / Spring Boot parent 3.5.6 — unchanged, no version bumps. No new `Back-end/pom.xml` dependency.
- Migration convention (unchanged from Phase 1): plain, hand-written, idempotent `.sql` scripts under `Back-end/database/`, applied manually to both `autowash_pro` (dev) and `autowash_pro_test` (test). No Flyway/Liquibase.
- Test isolation (unchanged from Phase 1): the existing `autowash_pro_test` database, `application-test.properties`, `@ActiveProfiles("test")`, `RepositoryIntegrationTest`/`BookingTestFixtures` from Phase 1's Task 2. No Testcontainers.
- TDD is mandatory for every task: write the failing test, confirm the exact failure reason, implement, confirm green.
- Every git commit in this plan uses an explicit pathspec naming only the files that task touched. This repository's working directory has a large pre-existing unrelated staged pile (`git status` at plan-authoring time shows ~150+ unrelated staged files under `Front-end/autowash-pro (1)/**`, `.ua/**`, etc.) — **never** run `git add -A`, `git add .`, or `git add -u` in any step of this plan.
- Never log or print a Firebase token, OTP code, verification proof token, raw phone number, secret, or VNPAY credential, in code or in command output pasted into commit messages, `PROGRESS.md`, or the AI log.
- Scope boundary (explicit — do not silently expand): this phase adds **only** the `phone_verification_proofs` table, the `TooManyRequestsException`/429 mapping, `VerificationPurpose`, `PhoneVerificationProof`/`PhoneVerificationProofRepository`, `RateLimiter`, `VerificationProofResponse`/`ProofTokenGenerator`, `GuestVerificationService`/Impl, `BookingRepository.findByBookingRef`, and `GuestBookingLookupAuthorizationService`/Impl. No request DTO is created — nothing in this phase would consume one, since no controller exists yet to bind a request body to it. It implements **no HTTP controller/endpoint** (neither a proof-issuance endpoint nor `GET /api/v1/bookings/{ref}` itself — those belong to the phase that builds guest booking creation/lookup end-to-end), **no VNPAY**, **no slot/bay allocation**, **no Swagger annotation completion**, **no frontend change**, and **no `audit_logs` writes** (BR-025's full audit trail is a booking-creation/admin-change concern, deferred to whichever phase implements those write paths — writing partial, disconnected audit rows here would be speculative). Guest/Customer merge logic (BR-032) is also out of scope — this phase never creates or reads `Guest`/`Customer` rows at all; it only proves phone ownership.
- Message-language convention: this phase's new user-facing error messages are English, matching `GlobalExceptionHandler`'s pre-existing generic strings (`"Incorrect phone number or password."`, `"An unexpected error occurred..."`) rather than `AuthServiceImpl`'s Vietnamese domain strings — stated explicitly here since the codebase currently mixes both and no other precedent in this plan's touched files dictates otherwise.
- Every `mvn -f Back-end/pom.xml test` invocation in this plan requires `Back-end/.env`'s `DB_PASSWORD` (and, for Task 4's `@SpringBootTest`, any other variable `Back-end/.env` sets that the full Spring context needs, e.g. a JWT signing secret) loaded into the current shell's process environment first, using the same PowerShell snippet as Phase 1's Task 1 Step 1. Re-run it in any new shell session before running tests.

### Frozen decision: proof storage approach

**Persistent SQL Server table (`phone_verification_proofs`), not in-memory.** The owner's brief requires proof single-use correctness to "survive concurrent requests or restart." An in-memory store (even a thread-safe `ConcurrentHashMap`) is process-local: a restart during a deploy/crash silently forgets which proofs were consumed, and a load-balanced multi-instance deployment (not current, but not precluded by anything in this codebase) would let two instances each independently believe an unconsumed proof is theirs to consume. A DB row with a conditional `UPDATE` gives both restart-survival and cross-process correctness for free, using infrastructure this app already has (SQL Server) instead of adding any new component. This directly parallels Phase 1's `slot_reservations`/`UX_bay_slot` decision: DB constraints over app-level state for anything correctness-critical.

### Frozen decision: TTL

**5 minutes**, fixed at issuance (`issued_at` → `issued_at + 5m` as `expires_at`). Short-lived per the brief; 5 minutes is generous enough to cover normal UI latency between "user completes Firebase Phone-OTP" and "client submits the guest booking / lookup request that consumes the proof" (seconds, not minutes, in the real flow) while keeping the replay window small. This mirrors typical short-lived-token conventions and requires no new configuration property — it is a `private static final Duration PROOF_TTL = Duration.ofMinutes(5);` constant in `GuestVerificationServiceImpl`.

### Frozen decision: proof format

**Opaque random token, not a JWT.** Generated as 32 bytes from `java.security.SecureRandom`, Base64URL-encoded without padding (43 chars), prefixed `gvp_` for log/debug identifiability (47 chars total, stored in a `VARCHAR(64)` column). A JWT would let the client decode and inspect claims — the brief explicitly requires the proof be "opaque to clients." Since a persistent DB row is already mandatory for the single-use guarantee (see above), a JWT would add zero benefit (there is no scenario where we need to verify the proof *without* hitting the DB) while adding decode/verify complexity and a second secret to manage. The DB row's primary key is the token itself, so lookups are a direct PK access — no separate encoding/decoding step exists anywhere in the codebase.

### Frozen decision: purpose enum/list

Exactly two values, matching the brief's "at minimum": `GUEST_BOOKING`, `GUEST_BOOKING_LOOKUP`. Represented as a plain Java enum `com.autowashpro.entity.VerificationPurpose` (bare enum, no annotations — matching `VehicleSize`'s existing style) persisted via `@Enumerated(EnumType.STRING)`, and enforced at the DB level with a `CHECK (purpose IN ('GUEST_BOOKING','GUEST_BOOKING_LOOKUP'))` constraint (matching `bays.bay_type`'s and `slot_reservations.status`'s existing `CK_*` convention).

### Frozen decision: single-use transaction/atomicity mechanism

A single conditional `UPDATE` per consumption attempt, expressed as a Spring Data `@Modifying @Query`:

```sql
UPDATE phone_verification_proofs
SET consumed_at = :now
WHERE proof_token = :token AND phone = :phone AND purpose = :purpose
  AND consumed_at IS NULL AND expires_at > :now
```

(a phone-less variant for the lookup path — see Task 3.) Spring Data JPA repositories default `enableDefaultTransactions=true`, so every repository method — including custom `@Modifying @Query` ones — runs in its own transaction if the caller doesn't already have one open; this plan's service layer additionally wraps each consuming method in an explicit `@Transactional` for clarity, matching `AuthServiceImpl.register()`'s existing pattern. Correctness reasoning: SQL Server's default READ COMMITTED isolation still takes an exclusive row lock for the duration of an `UPDATE`'s matched row. Two concurrent transactions racing to update the *same* `proof_token` row serialize on that lock: the first to acquire it commits `consumed_at`; the second blocks, then — under READ COMMITTED's locking-read re-evaluation — sees `consumed_at IS NOT NULL` and matches zero rows. The caller checks the returned row-count: `1` means "you won the race," `0` means "someone else won, or it was invalid/expired/mismatched for any other reason" (see next section — these are intentionally not distinguished to the caller). This needs no `SERIALIZABLE` isolation, no application-level lock, and no new dependency — it is the standard "UPDATE-as-compare-and-swap" pattern and is proven under real concurrent threads in Task 4.

### Frozen invariant (from adversarial security review): `GuestBookingLookupAuthorizationServiceImpl.authorize()` must never run inside an outer `@Transactional`

`authorize()` (Task 9) is deliberately **not** `@Transactional`, and must stay that way. `consumeProofForLookup()` (which *is* `@Transactional`) commits the proof's single-use burn in its own transaction, independent of whatever `authorize()` does next. If a future caller wraps `authorize()` itself in an outer transaction (e.g. a controller method annotated `@Transactional`), the `ResourceNotFoundException`/`ForbiddenException` it can throw afterward would mark that outer transaction rollback-only — rolling back the `consumed_at` UPDATE along with it, making the proof replayable and reopening exactly the enumeration/replay risk single-use consumption exists to prevent. This is documented as a code comment on `authorize()` itself (Task 9) and proven behaviorally by a real-database integration test added to Task 9: after `authorize()` throws for an unknown `bookingRef`, a second call with the same token must fail with "invalid proof" (proving the DB row was durably consumed), not reach the ref lookup again.

### Frozen decision: rate-limit key/window/threshold

Single-instance, in-memory, deterministic fixed-window counter (`RateLimiter`, Task 5) — no Redis, per the brief's explicit "no new infra unless justified" instruction and Phase 1's own precedent of rejecting Redis in favor of DB/in-process mechanisms for a single-instance Spring app.

**Revised after adversarial security review** (original draft rate-limited `issueProof` on the *client-claimed, unverified* phone number, before Firebase verification ran — an attacker could exhaust a real victim's issuance quota with pure garbage tokens, a targeted lockout with no proof of phone ownership required. The same class of gap existed for `consumeProofForPhone`, phone-keyed before consumption succeeds). Fixed by keying every consumption-side and the issuance-side limiter on something the caller cannot claim without already holding a real credential:

| Action | Key | Window | Threshold | Why |
|---|---|---|---|---|
| Proof issuance (`issueProof`) | `"issue\|" + verifiedPhone + "\|" + purpose` — computed **after** Firebase verification succeeds and the verified phone is confirmed to match the submitted phone (see Task 6's reordered `issueProof`) | 15 minutes | 5 attempts | Keying on the *verified* phone (not the caller's raw claim) means an attacker holding no valid Firebase credential for a phone can never consume that phone's quota — closing the victim-lockout hole. Residual, explicitly accepted gap: nothing in this phase bounds the *volume* of garbage-token `verify()` calls a single attacker can make (no per-IP/per-session limiting exists yet — that needs the controller layer, a later phase); this phase's rate limiter protects a real phone number's issuance budget, not Firebase API call volume. |
| Proof consumption, phone-bound (`consumeProofForPhone`) | `"consume\|" + proofToken` (changed from phone-keyed to token-keyed, matching the lookup path below, for the identical reason: keying by phone here would let an attacker with no valid token exhaust a victim phone's consumption budget using garbage tokens) | 15 minutes | 10 attempts | The token is a 256-bit secret the caller can only have by already holding a real, `issueProof`-issued credential; keying on it bounds retry/replay-storm abuse of one specific credential without creating a phone-targeted lockout vector. |
| Proof consumption, lookup-bound (`consumeProofForLookup`) | `"lookup\|" + proofToken` | 15 minutes | 10 attempts | Unchanged from the original draft — already token-keyed. Vestigial against token-guessing (256 bits is computationally infeasible to brute-force) but bounds API-abuse retry storms against one specific token/booking. |

On the limit tripping, all call sites throw the new `TooManyRequestsException` with the **same** generic message regardless of key — verified by a dedicated unit-test assertion that the thrown exception's message never contains the phone number (Task 6).

### Frozen decision: error statuses and safe public messages

All new failure modes route through `GlobalExceptionHandler`'s existing `buildAuthStyleError(status, message)` shape (`{"success": false, "error": "<message>"}`), except the one 404 case which uses the existing `handleNotFound` shape (`{"timestamp", "status", "error": "Not Found", "message"}`), matching the resource-not-found convention already used for vehicles/customers.

| Failure mode | Exception | HTTP status | Exact public message |
|---|---|---|---|
| Firebase token invalid/expired/unparseable | `BadRequestException` | 400 | `Invalid or expired verification token.` |
| Firebase identity has neither phone nor is otherwise usable for this purpose (e.g. Google-only identity presented to a phone-verification flow) | `BadRequestException` | 400 | `Invalid or expired verification token.` |
| Firebase-verified phone does not match the submitted phone | `BadRequestException` | 400 | `Verified phone does not match the phone number provided.` |
| Proof not found / malformed token / expired / already consumed / phone mismatch / purpose mismatch (**consumption side — all six collapsed to one response**, see reasoning below) | `BadRequestException` | 400 | `Invalid or expired verification proof.` |
| Rate limit exceeded (issuance or consumption) | `TooManyRequestsException` (new) | 429 | `Too many verification requests. Please try again later.` |
| Guest booking-lookup: `bookingRef` does not exist | `ResourceNotFoundException` | 404 | `Booking not found.` |
| Guest booking-lookup: valid proof, but its phone does not own this booking (wrong guest, or booking belongs to a member not a guest) | `ForbiddenException` | 403 | `You are not authorized to view this booking.` |

**Why the six consumption-side failures collapse to one message and status:** the brief requires errors that "do not enable phone/account enumeration." If "expired" and "already consumed" and "wrong phone" returned visibly different responses, a client submitting many guesses could use the response to fingerprint proof state without needing to succeed — a timing/information oracle. Collapsing every consumption failure to one indistinguishable `400 Invalid or expired verification proof.` removes that signal entirely; this is a deliberate security property, not an oversight, and is asserted directly in tests (Task 7/8: every distinct DB-level failure reason maps to the identical service-level exception+message).

**Why booking-lookup keeps 404 vs 403 distinct:** this is not a phone-existence oracle. Reaching this code path already required a real, consumed, phone-bound Firebase-verified proof — the caller has already proven phone ownership before a `bookingRef` is even considered. Distinguishing "this ref doesn't exist" (404) from "this ref exists but isn't yours" (403) is standard, safe REST practice once the caller is already authenticated for *something*; it reveals nothing about phone/account existence.

### Frozen decision: database migration and rollback-safe strategy

One new additive file, `Back-end/database/FR004v2_phase2_guest_verification_migration.sql`, following Phase 1's exact idempotency convention: `IF OBJECT_ID(..., 'U') IS NULL BEGIN ... END` for the table, an independently-guarded `IF NOT EXISTS (SELECT 1 FROM sys.indexes ...)` for the index. No `ALTER`/`DROP` of any existing table. Rollback safety: if this migration needs to be reverted, `DROP TABLE dbo.phone_verification_proofs` is safe in isolation — no other table has a foreign key into it (deliberately: `phone` is a plain `VARCHAR`, not an FK, matching `idempotency_records.guest_phone`'s existing no-FK precedent, since a proof is a short-lived credential record, not a durable relationship).

### Frozen decision: exact tests (one-to-one against the mandatory list)

| Mandatory test | Where it is proven |
|---|---|
| Valid Firebase verification issues a proof bound to normalized phone and purpose | Task 6, `GuestVerificationServiceImplTest.issueProof_validFirebaseVerification_returnsProofBoundToNormalizedPhoneAndPurpose` |
| Expired proof is rejected | Task 3, `PhoneVerificationProofRepositoryTest.consumeIfValid_expiredProof_returnsZeroAndLeavesUnconsumed` |
| Replayed/consumed proof is rejected | Task 3, `PhoneVerificationProofRepositoryTest.consumeIfValid_alreadyConsumedProof_returnsZeroOnSecondAttempt` |
| Wrong phone and wrong purpose are rejected | Task 3, `consumeIfValid_wrongPhone_returnsZero` + `consumeIfValid_wrongPurpose_returnsZero` + `consumeIfValidForPurpose_wrongPurpose_returnsZero` (this third test closes a real gap an adversarial review found: `consumeIfValidForPurpose` — the query actually used by the lookup/IDOR path in Task 7/9 — originally had zero real-database coverage of its own, only mocked coverage from later tasks) |
| Concurrent consumption attempts produce exactly one success | Task 4, `PhoneVerificationProofConcurrencyTest.consumeIfValid_concurrentAttempts_exactlyOneSucceeds` (explicit test-pool sizing and a `@Timeout` were added after adversarial review to rule out connection-pool serialization as a false-positive explanation and to prevent an undiagnosed hang) |
| Rate limiting blocks excess attempts and does not leak PII | Task 5, `RateLimiterTest` (mechanics) + Task 6, `issueProof_rateLimitExceeded_throwsTooManyRequestsWithGenericMessageOnly` (no-PII-in-message assertion) |
| Guest/member authorization and IDOR cases are covered at the relevant service or MockMvc level | Task 9, `GuestBookingLookupAuthorizationServiceImplTest` (4 mocked cases: success, not-found, phone-mismatch/IDOR, guest-vs-member) + `GuestBookingLookupAuthorizationIntegrationTest` (1 real-database case proving the single-use burn survives an exception thrown afterward — the transactional invariant an adversarial security review flagged as silently reopening replay/enumeration if ever violated) |
| Invalid Firebase identity/token failure is handled safely | Task 6, `issueProof_invalidFirebaseToken_throwsBadRequestWithGenericMessage` + `issueProof_firebaseIdentityMissingPhone_throwsBadRequest` |
| Existing registration Firebase flow does not regress | Task 10, re-run `AuthServiceImplTest` unchanged as part of full-suite verification |
| Tests run against the configured SQL Server test database where persistence or concurrency matters | Tasks 3 and 4 use `RepositoryIntegrationTest`/`@SpringBootTest` against `autowash_pro_test`, not mocks |

---

### Task 1: Additive migration — `phone_verification_proofs` table

**Files:**
- Create: `Back-end/database/FR004v2_phase2_guest_verification_migration.sql`

**Interfaces:**
- Consumes: existing `Back-end/database/*.sql` chain (baseline schema already on disk in both `autowash_pro` and `autowash_pro_test`).
- Produces: the `phone_verification_proofs` table in both databases. Every later task in this plan depends on it existing in both.

- [ ] **Step 1: Load `Back-end/.env` into the current shell session**

Same as Phase 1's Task 1 Step 1:
```powershell
Get-Content Back-end/.env | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $parts = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
}
```
Verify: `if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { Write-Host "DB_PASSWORD NOT SET" } else { Write-Host "DB_PASSWORD is set" }` → expect `DB_PASSWORD is set`.

- [ ] **Step 2: Write the migration script**

Create `Back-end/database/FR004v2_phase2_guest_verification_migration.sql`:

```sql
-- FR004v2 Phase 2 — guest verification proof table.
-- Additive and idempotent — safe to run repeatedly against autowash_pro or autowash_pro_test.
USE [autowash_pro]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- phone_verification_proofs — short-lived, single-use, purpose-bound proof that the caller
-- controls a phone number, issued only after a real server-side Firebase ID token verification
-- succeeds. Never trust a client-supplied "otpVerified" flag; this table is the sole source of
-- truth for "has this phone been verified for this purpose, and has that verification already
-- been spent." consumed_at is set exactly once via an atomic conditional UPDATE (see
-- PhoneVerificationProofRepository) — no other write path may set it.
IF OBJECT_ID('dbo.phone_verification_proofs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.phone_verification_proofs (
        proof_token VARCHAR(64) NOT NULL,
        phone       VARCHAR(20) NOT NULL,
        purpose     VARCHAR(30) NOT NULL,
        issued_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        expires_at  DATETIME2 NOT NULL,
        consumed_at DATETIME2 NULL,
        CONSTRAINT PK_phone_verification_proofs PRIMARY KEY CLUSTERED (proof_token),
        CONSTRAINT CK_phone_verification_proofs_purpose CHECK (purpose IN ('GUEST_BOOKING','GUEST_BOOKING_LOOKUP'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_phone_verification_proofs_expires' AND object_id = OBJECT_ID('dbo.phone_verification_proofs'))
    CREATE INDEX IX_phone_verification_proofs_expires ON dbo.phone_verification_proofs(expires_at);
GO
```

- [ ] **Step 3: Apply to the dev database and verify**

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -i Back-end/database/FR004v2_phase2_guest_verification_migration.sql
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -Q "SELECT name FROM sys.tables WHERE name = 'phone_verification_proofs';"
```
Expected: no errors; `phone_verification_proofs` printed.

- [ ] **Step 4: Apply to the test database and verify**

```powershell
(Get-Content Back-end/database/FR004v2_phase2_guest_verification_migration.sql) -replace '^USE \[autowash_pro\]$', 'USE [autowash_pro_test]' |
    sqlcmd -S localhost -U sa -P $env:DB_PASSWORD
sqlcmd -S localhost -d autowash_pro_test -U sa -P $env:DB_PASSWORD -Q "SELECT name FROM sys.tables WHERE name = 'phone_verification_proofs';"
```
Expected: no errors; `phone_verification_proofs` printed.

- [ ] **Step 5: Commit**

```bash
git add Back-end/database/FR004v2_phase2_guest_verification_migration.sql
git commit -m "feat: add phone_verification_proofs schema for guest identity verification"
```

---

### Task 2: `TooManyRequestsException` + 429 mapping in `GlobalExceptionHandler`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/exception/custom/TooManyRequestsException.java`
- Modify: `Back-end/src/main/java/com/autowashpro/exception/handler/GlobalExceptionHandler.java`
- Modify: `Back-end/src/test/java/com/autowashpro/exception/handler/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Produces: `TooManyRequestsException(String message)` mapped to HTTP 429 via the existing `buildAuthStyleError` shape. `RateLimiter` and `GuestVerificationServiceImpl` (Tasks 5–7) throw this type.

- [ ] **Step 1: Write the failing test**

Add to `Back-end/src/test/java/com/autowashpro/exception/handler/GlobalExceptionHandlerTest.java`:

```java
import com.autowashpro.exception.custom.TooManyRequestsException;
```
```java
    @Test
    void handleTooManyRequests_returnsHttp429() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleTooManyRequests(new TooManyRequestsException("Too many verification requests. Please try again later."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).containsEntry("success", false);
        assertThat(response.getBody()).containsEntry("error", "Too many verification requests. Please try again later.");
    }
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GlobalExceptionHandlerTest
```
Expected: `BUILD FAILURE` — compile error, `TooManyRequestsException`/`handleTooManyRequests` do not exist yet.

- [ ] **Step 3: Write the exception class**

Create `Back-end/src/main/java/com/autowashpro/exception/custom/TooManyRequestsException.java`:

```java
package com.autowashpro.exception.custom;

public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Add the handler**

In `Back-end/src/main/java/com/autowashpro/exception/handler/GlobalExceptionHandler.java`, add the import `com.autowashpro.exception.custom.TooManyRequestsException`, and add this handler method next to `handleForbidden`:

```java
    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, Object>> handleTooManyRequests(TooManyRequestsException ex) {
        return buildAuthStyleError(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GlobalExceptionHandlerTest
```
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/exception/custom/TooManyRequestsException.java Back-end/src/main/java/com/autowashpro/exception/handler/GlobalExceptionHandler.java Back-end/src/test/java/com/autowashpro/exception/handler/GlobalExceptionHandlerTest.java
git commit -m "feat: add TooManyRequestsException and 429 mapping to GlobalExceptionHandler"
```

---

### Task 3: `VerificationPurpose` enum + `PhoneVerificationProof` entity + `PhoneVerificationProofRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/VerificationPurpose.java`
- Create: `Back-end/src/main/java/com/autowashpro/entity/PhoneVerificationProof.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/PhoneVerificationProofRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/PhoneVerificationProofRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `phone_verification_proofs` table, Phase 1's `RepositoryIntegrationTest`.
- Produces: `PhoneVerificationProof` (fields: `proofToken: String`, `phone: String`, `purpose: VerificationPurpose`, `issuedAt: LocalDateTime`, `expiresAt: LocalDateTime`, `consumedAt: LocalDateTime`). `PhoneVerificationProofRepository.consumeIfValid(String token, String phone, VerificationPurpose purpose, LocalDateTime now): int` and `.consumeIfValidForPurpose(String token, VerificationPurpose purpose, LocalDateTime now): int` — Task 4's concurrency test and Task 7's service both depend on these exact signatures and return semantics (`1` = consumed by this call, `0` = invalid/expired/consumed/mismatched).

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/PhoneVerificationProofRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PhoneVerificationProofRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    private PhoneVerificationProof newProof(String token, String phone, VerificationPurpose purpose, LocalDateTime expiresAt) {
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(token);
        proof.setPhone(phone);
        proof.setPurpose(purpose);
        proof.setIssuedAt(LocalDateTime.now());
        proof.setExpiresAt(expiresAt);
        return proof;
    }

    @Test
    void save_and_findById_persistsUnconsumedProof() {
        proofRepository.saveAndFlush(newProof("tok-persist-1", "+84911444001", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        PhoneVerificationProof loaded = proofRepository.findById("tok-persist-1").orElseThrow();
        assertThat(loaded.getPhone()).isEqualTo("+84911444001");
        assertThat(loaded.getPurpose()).isEqualTo(VerificationPurpose.GUEST_BOOKING);
        assertThat(loaded.getConsumedAt()).isNull();
    }

    @Test
    void consumeIfValid_matchingUnexpiredUnconsumedProof_marksConsumedAndReturnsOne() {
        proofRepository.saveAndFlush(newProof("tok-valid-1", "+84911444002", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-valid-1", "+84911444002", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(1);
        assertThat(proofRepository.findById("tok-valid-1").orElseThrow().getConsumedAt()).isNotNull();
    }

    @Test
    void consumeIfValid_expiredProof_returnsZeroAndLeavesUnconsumed() {
        proofRepository.saveAndFlush(newProof("tok-expired-1", "+84911444003", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().minusMinutes(1)));

        int updated = proofRepository.consumeIfValid("tok-expired-1", "+84911444003", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
        assertThat(proofRepository.findById("tok-expired-1").orElseThrow().getConsumedAt()).isNull();
    }

    @Test
    void consumeIfValid_alreadyConsumedProof_returnsZeroOnSecondAttempt() {
        proofRepository.saveAndFlush(newProof("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int first = proofRepository.consumeIfValid("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());
        int second = proofRepository.consumeIfValid("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
    }

    @Test
    void consumeIfValid_wrongPhone_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-wrongphone-1", "+84911444005", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-wrongphone-1", "+84911444999", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
    }

    @Test
    void consumeIfValid_wrongPurpose_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-wrongpurpose-1", "+84911444006", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-wrongpurpose-1", "+84911444006", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=PhoneVerificationProofRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, none of the new types exist yet.

- [ ] **Step 3: Write the `VerificationPurpose` enum**

Create `Back-end/src/main/java/com/autowashpro/entity/VerificationPurpose.java`:

```java
package com.autowashpro.entity;

public enum VerificationPurpose {
    GUEST_BOOKING,
    GUEST_BOOKING_LOOKUP
}
```

- [ ] **Step 4: Write the `PhoneVerificationProof` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/PhoneVerificationProof.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "phone_verification_proofs")
public class PhoneVerificationProof {

    @Id
    @Column(name = "proof_token", length = 64)
    private String proofToken;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 30)
    private VerificationPurpose purpose;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;
}
```

- [ ] **Step 5: Write the `PhoneVerificationProofRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/PhoneVerificationProofRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface PhoneVerificationProofRepository extends JpaRepository<PhoneVerificationProof, String> {

    // clearAutomatically = true is mandatory, not stylistic: a @Modifying bulk UPDATE runs as raw
    // SQL bypassing the persistence context, so without clearing it, a findById() later in the same
    // transaction returns the stale already-managed entity (still showing consumedAt == null) instead
    // of re-reading the DB. This repository test class relies on exactly that read-after-write pattern.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE PhoneVerificationProof p SET p.consumedAt = :now " +
           "WHERE p.proofToken = :token AND p.phone = :phone AND p.purpose = :purpose " +
           "AND p.consumedAt IS NULL AND p.expiresAt > :now")
    int consumeIfValid(@Param("token") String token, @Param("phone") String phone,
                        @Param("purpose") VerificationPurpose purpose, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE PhoneVerificationProof p SET p.consumedAt = :now " +
           "WHERE p.proofToken = :token AND p.purpose = :purpose " +
           "AND p.consumedAt IS NULL AND p.expiresAt > :now")
    int consumeIfValidForPurpose(@Param("token") String token, @Param("purpose") VerificationPurpose purpose,
                                  @Param("now") LocalDateTime now);
}
```

Also add these two tests to `PhoneVerificationProofRepositoryTest` (append inside the class, after `consumeIfValid_wrongPurpose_returnsZero`) — `consumeIfValidForPurpose` is the query actually used by the `GUEST_BOOKING_LOOKUP` consumption path (Task 7), so it needs its own real-database proof, not just mocked coverage from later tasks:

```java

    @Test
    void consumeIfValidForPurpose_matchingUnexpiredUnconsumedProof_marksConsumedAndReturnsOne() {
        proofRepository.saveAndFlush(newProof("tok-purpose-1", "+84911444007", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValidForPurpose("tok-purpose-1", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(1);
        assertThat(proofRepository.findById("tok-purpose-1").orElseThrow().getConsumedAt()).isNotNull();
    }

    @Test
    void consumeIfValidForPurpose_wrongPurpose_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-purpose-2", "+84911444008", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValidForPurpose("tok-purpose-2", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
        assertThat(proofRepository.findById("tok-purpose-2").orElseThrow().getConsumedAt()).isNull();
    }
```

- [ ] **Step 6: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=PhoneVerificationProofRepositoryTest
```
Expected: `BUILD SUCCESS`, 8 tests passed (6 for `consumeIfValid` + 2 new for `consumeIfValidForPurpose`).

- [ ] **Step 7: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/VerificationPurpose.java Back-end/src/main/java/com/autowashpro/entity/PhoneVerificationProof.java Back-end/src/main/java/com/autowashpro/repository/PhoneVerificationProofRepository.java Back-end/src/test/java/com/autowashpro/repository/PhoneVerificationProofRepositoryTest.java
git commit -m "feat: add PhoneVerificationProof entity and repository with atomic single-use consumption"
```

---

### Task 4: Concurrency proof — exactly one consumer wins

**Files:**
- Modify: `Back-end/src/main/resources/application-test.properties`
- Create: `Back-end/src/test/java/com/autowashpro/service/PhoneVerificationProofConcurrencyTest.java`

**Interfaces:**
- Consumes: Task 3's `PhoneVerificationProofRepository.consumeIfValid`.
- Produces: no new production code — this is the load-bearing proof for the "concurrent consumption attempts produce exactly one success" mandatory test.

This is the **first `@SpringBootTest` in this repository** (every existing test is either plain Mockito or `@DataJpaTest`). `@DataJpaTest` auto-rolls back per test on a single thread, which cannot exercise real concurrent writers. `@SpringBootTest` boots the full context (including `FirebaseConfig`, which degrades gracefully and does not fail startup when no service-account file is present — see `Back-end/src/main/java/com/autowashpro/config/FirebaseConfig.java:27-29`) and does **not** auto-rollback, so this test cleans up its own row manually in `@AfterEach`.

**Adversarial review note:** the test uses `threadCount = 10`, which happened to match HikariCP's unconfigured default pool size exactly — with no headroom, a "1 winner" result could come from connection-pool contention serializing threads rather than the intended row-lock compare-and-swap actually being exercised concurrently. Step 1 below sizes the test pool explicitly above `threadCount` so all 10 threads can hold a connection simultaneously, making the DB-level lock the only thing serializing them. A `@Timeout` is also added so a real hang (e.g. a genuine deadlock bug) fails the build instead of hanging `mvn test` forever with `@AfterEach` never running to clean up its row.

- [ ] **Step 1: Size the test datasource pool above the concurrency test's thread count**

Add to `Back-end/src/main/resources/application-test.properties` (append; do not touch existing lines):

```properties
spring.datasource.hikari.maximum-pool-size=20
```

- [ ] **Step 2: Write the test**

Create `Back-end/src/test/java/com/autowashpro/service/PhoneVerificationProofConcurrencyTest.java`:

```java
package com.autowashpro.service;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PhoneVerificationProofConcurrencyTest {

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    private String proofToken;

    @AfterEach
    void cleanUp() {
        if (proofToken != null) {
            proofRepository.deleteById(proofToken);
        }
    }

    @Test
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void consumeIfValid_concurrentAttempts_exactlyOneSucceeds() throws Exception {
        proofToken = "gvp_concurrency_" + UUID.randomUUID();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(proofToken);
        proof.setPhone("+84911999000");
        proof.setPurpose(VerificationPurpose.GUEST_BOOKING);
        LocalDateTime now = LocalDateTime.now();
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plusMinutes(5));
        proofRepository.saveAndFlush(proof);

        int threadCount = 10;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        CountDownLatch ready = new CountDownLatch(threadCount);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            results.add(pool.submit(() -> {
                ready.countDown();
                start.await();
                return proofRepository.consumeIfValid(proofToken, "+84911999000", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());
            }));
        }

        ready.await();
        start.countDown();

        int totalSuccesses = 0;
        for (Future<Integer> result : results) {
            totalSuccesses += result.get();
        }
        pool.shutdown();

        assertThat(totalSuccesses).isEqualTo(1);
        assertThat(proofRepository.findById(proofToken).orElseThrow().getConsumedAt()).isNotNull();
    }
}
```

- [ ] **Step 3: Run the test**

```powershell
mvn -f Back-end/pom.xml test -Dtest=PhoneVerificationProofConcurrencyTest
```
Expected: `BUILD SUCCESS`, 1 test passed, `totalSuccesses == 1` (not 0, not 10), completing well under the 10s timeout. If this is flaky, times out, or shows more than one success, stop — that means the atomicity assumption is wrong and must be re-diagnosed (per superpowers:systematic-debugging) before continuing to any later task.

- [ ] **Step 4: Commit**

```bash
git add Back-end/src/main/resources/application-test.properties Back-end/src/test/java/com/autowashpro/service/PhoneVerificationProofConcurrencyTest.java
git commit -m "test: prove exactly-one-winner semantics for concurrent proof consumption"
```

---

### Task 5: `RateLimiter` — deterministic, single-instance, in-memory

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/service/RateLimiter.java`
- Create: `Back-end/src/test/java/com/autowashpro/service/RateLimiterTest.java`

**Interfaces:**
- Produces: `RateLimiter.tryConsume(String key, int maxAttempts, Duration window): boolean` — Task 7's `GuestVerificationServiceImpl` depends on this exact signature.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/service/RateLimiterTest.java`:

```java
package com.autowashpro.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterTest {

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Test
    void tryConsume_underThreshold_allowsEachAttempt() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_overThreshold_blocksFurtherAttempts() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));

        assertThat(limiter.tryConsume("key-b", 3, Duration.ofMinutes(15))).isFalse();
    }

    @Test
    void tryConsume_afterWindowElapses_resetsCount() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        for (int i = 0; i < 3; i++) {
            limiter.tryConsume("key-c", 3, Duration.ofMinutes(15));
        }
        assertThat(limiter.tryConsume("key-c", 3, Duration.ofMinutes(15))).isFalse();

        clock.advance(Duration.ofMinutes(16));

        assertThat(limiter.tryConsume("key-c", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_differentKeys_haveIndependentQuotas() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        limiter.tryConsume("key-d1", 1, Duration.ofMinutes(15));
        assertThat(limiter.tryConsume("key-d1", 1, Duration.ofMinutes(15))).isFalse();

        assertThat(limiter.tryConsume("key-d2", 1, Duration.ofMinutes(15))).isTrue();
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=RateLimiterTest
```
Expected: `BUILD FAILURE` — compile error, `RateLimiter` does not exist yet.

- [ ] **Step 3: Write `RateLimiter`**

Create `Back-end/src/main/java/com/autowashpro/service/RateLimiter.java`:

```java
package com.autowashpro.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Deterministic, single-instance, in-memory fixed-window rate limiter. Not backed by Redis or
 * any external store — this application runs as a single Spring Boot instance, and correctness
 * of rate limiting (unlike proof single-use) does not need to survive a restart: a reset counter
 * after a restart only ever makes limits momentarily more permissive, never a security hole.
 */
@Component
public class RateLimiter {

    private final Clock clock;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimiter() {
        this(Clock.systemUTC());
    }

    RateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean tryConsume(String key, int maxAttempts, Duration window) {
        Instant now = clock.instant();
        Window result = windows.compute(key, (k, existing) -> {
            if (existing == null || now.isAfter(existing.windowStart().plus(window))) {
                return new Window(now, 1);
            }
            return new Window(existing.windowStart(), existing.count() + 1);
        });
        return result.count() <= maxAttempts;
    }

    private record Window(Instant windowStart, int count) {
    }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=RateLimiterTest
```
Expected: `BUILD SUCCESS`, 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/RateLimiter.java Back-end/src/test/java/com/autowashpro/service/RateLimiterTest.java
git commit -m "feat: add deterministic in-memory RateLimiter for verification attempts"
```

---

### Task 6: Response DTO + `ProofTokenGenerator` + `GuestVerificationService.issueProof`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/dto/response/VerificationProofResponse.java`
- Create: `Back-end/src/main/java/com/autowashpro/utils/ProofTokenGenerator.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java`
- Create: `Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java`

**Interfaces:**
- Consumes: existing `FirebaseTokenVerifier`/`VerifiedFirebaseIdentity`/`PhoneNormalizer`, Task 2's `TooManyRequestsException`, Task 3's `PhoneVerificationProof`/`PhoneVerificationProofRepository`/`VerificationPurpose`, Task 5's `RateLimiter`.
- Produces: `GuestVerificationService.issueProof(String phone, String firebaseToken, VerificationPurpose purpose): VerificationProofResponse` — Task 7 extends this same interface/impl with `consumeProofForPhone`/`consumeProofForLookup`.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java`:

```java
package com.autowashpro.service.impl;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.RateLimiter;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.google.firebase.auth.FirebaseAuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestVerificationServiceImplTest {

    @Mock
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @Mock
    private PhoneVerificationProofRepository proofRepository;

    @Mock
    private RateLimiter rateLimiter;

    private GuestVerificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestVerificationServiceImpl(firebaseTokenVerifier, proofRepository, rateLimiter);
    }

    // Stub ordering below matches issueProof's actual execution order (Firebase verification runs
    // BEFORE the rate-limit check — see the reordering note above Step 6). Tests for failures that
    // occur before the rate-limit check deliberately do NOT stub rateLimiter.tryConsume at all: under
    // MockitoExtension's default STRICT_STUBS, a stub that is set up but never invoked fails the test
    // class with UnnecessaryStubbingException, so an unreachable stub must be omitted, not just unused.

    @Test
    void issueProof_validFirebaseVerification_returnsProofBoundToNormalizedPhoneAndPurpose() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("valid-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(true);

        VerificationProofResponse response = service.issueProof("0901234567", "valid-token", VerificationPurpose.GUEST_BOOKING);

        assertThat(response.getProofToken()).isNotBlank();
        assertThat(response.getExpiresAt()).isNotNull();

        ArgumentCaptor<PhoneVerificationProof> captor = ArgumentCaptor.forClass(PhoneVerificationProof.class);
        verify(proofRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo("+84901234567");
        assertThat(captor.getValue().getPurpose()).isEqualTo(VerificationPurpose.GUEST_BOOKING);
        assertThat(captor.getValue().getConsumedAt()).isNull();
    }

    @Test
    void issueProof_invalidFirebaseToken_throwsBadRequestWithGenericMessage() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("bad-token")).thenThrow(FirebaseAuthException.class);

        assertThatThrownBy(() -> service.issueProof("0901234567", "bad-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification token.");
    }

    @Test
    void issueProof_firebaseIdentityMissingPhone_throwsBadRequest() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "user@example.com"));

        assertThatThrownBy(() -> service.issueProof("0901234567", "google-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification token.");
    }

    @Test
    void issueProof_verifiedPhoneMismatch_throwsBadRequest() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("valid-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84909999999", null));

        assertThatThrownBy(() -> service.issueProof("0901234567", "valid-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Verified phone does not match the phone number provided.");
    }

    @Test
    void issueProof_rateLimitExceeded_throwsTooManyRequestsWithGenericMessageOnly() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("any-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.issueProof("0901234567", "any-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("Too many verification requests. Please try again later.")
                .satisfies(ex -> assertThat(ex.getMessage()).doesNotContain("0901234567").doesNotContain("+84901234567"));
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestVerificationServiceImplTest
```
Expected: `BUILD FAILURE` — compile error, none of the new types exist yet.

- [ ] **Step 3: Write the response DTO**

No request DTO is created in this phase: `issueProof` takes its three parameters directly (`phone`, `firebaseToken`, `purpose`), and no controller exists yet to bind an HTTP request body — a `VerificationProofRequest` class would be unused, speculative code for an endpoint this phase explicitly does not build (see Global Constraints' scope boundary). The future phase that adds the controller can add the request DTO alongside it, once there's a real consumer.

Create `Back-end/src/main/java/com/autowashpro/dto/response/VerificationProofResponse.java`:

```java
package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class VerificationProofResponse {

    @Schema(description = "Opaque, single-use verification proof token")
    private String proofToken;

    @Schema(description = "Timestamp after which the proof is no longer valid")
    private LocalDateTime expiresAt;
}
```

- [ ] **Step 4: Write `ProofTokenGenerator`**

Create `Back-end/src/main/java/com/autowashpro/utils/ProofTokenGenerator.java`:

```java
package com.autowashpro.utils;

import java.security.SecureRandom;
import java.util.Base64;

public final class ProofTokenGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private ProofTokenGenerator() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return "gvp_" + ENCODER.encodeToString(bytes);
    }
}
```

- [ ] **Step 5: Write `GuestVerificationService`**

Create `Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java`:

```java
package com.autowashpro.service;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.VerificationPurpose;

public interface GuestVerificationService {

    VerificationProofResponse issueProof(String phone, String firebaseToken, VerificationPurpose purpose);
}
```

- [ ] **Step 6: Write `GuestVerificationServiceImpl`**

Create `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java`:

```java
package com.autowashpro.service.impl;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.GuestVerificationService;
import com.autowashpro.service.RateLimiter;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.autowashpro.utils.PhoneNormalizer;
import com.autowashpro.utils.ProofTokenGenerator;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class GuestVerificationServiceImpl implements GuestVerificationService {

    private static final Duration PROOF_TTL = Duration.ofMinutes(5);
    private static final int ISSUANCE_MAX_ATTEMPTS = 5;
    private static final Duration ISSUANCE_WINDOW = Duration.ofMinutes(15);
    private static final String GENERIC_TOKEN_ERROR = "Invalid or expired verification token.";
    private static final String GENERIC_RATE_LIMIT_ERROR = "Too many verification requests. Please try again later.";

    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final PhoneVerificationProofRepository proofRepository;
    private final RateLimiter rateLimiter;

    public GuestVerificationServiceImpl(FirebaseTokenVerifier firebaseTokenVerifier,
                                         PhoneVerificationProofRepository proofRepository,
                                         RateLimiter rateLimiter) {
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.proofRepository = proofRepository;
        this.rateLimiter = rateLimiter;
    }

    @Override
    @Transactional
    public VerificationProofResponse issueProof(String phone, String firebaseToken, VerificationPurpose purpose) {
        // Order matters here, per the adversarial security review: verify the caller's Firebase
        // identity BEFORE rate-limiting. The original draft rate-limited on the caller's raw, unproven
        // phone claim first — meaning anyone could exhaust a real victim's issuance quota using pure
        // garbage tokens, with no proof of phone ownership required. Rate-limiting only after a real
        // Firebase-verified phone is established means the limiter can only ever be tripped by someone
        // who actually controls that phone number.
        String normalizedPhone = PhoneNormalizer.toE164(phone);

        VerifiedFirebaseIdentity identity;
        try {
            identity = firebaseTokenVerifier.verify(firebaseToken);
        } catch (FirebaseAuthException e) {
            throw new BadRequestException(GENERIC_TOKEN_ERROR);
        }

        if (identity.phoneNumber() == null) {
            throw new BadRequestException(GENERIC_TOKEN_ERROR);
        }

        String verifiedPhone = PhoneNormalizer.toE164(identity.phoneNumber());
        if (!verifiedPhone.equals(normalizedPhone)) {
            throw new BadRequestException("Verified phone does not match the phone number provided.");
        }

        if (!rateLimiter.tryConsume("issue|" + verifiedPhone + "|" + purpose, ISSUANCE_MAX_ATTEMPTS, ISSUANCE_WINDOW)) {
            throw new TooManyRequestsException(GENERIC_RATE_LIMIT_ERROR);
        }

        LocalDateTime now = LocalDateTime.now();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(ProofTokenGenerator.generate());
        proof.setPhone(normalizedPhone);
        proof.setPurpose(purpose);
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plus(PROOF_TTL));
        proofRepository.save(proof);

        return new VerificationProofResponse(proof.getProofToken(), proof.getExpiresAt());
    }
}
```

- [ ] **Step 7: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestVerificationServiceImplTest
```
Expected: `BUILD SUCCESS`, 5 tests passed.

- [ ] **Step 8: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/dto/response/VerificationProofResponse.java Back-end/src/main/java/com/autowashpro/utils/ProofTokenGenerator.java Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java
git commit -m "feat: add GuestVerificationService.issueProof — server-side Firebase-verified proof issuance"
```

---

### Task 7: `GuestVerificationService.consumeProofForPhone` / `.consumeProofForLookup`

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java`
- Modify: `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java`
- Modify: `Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java`

**Interfaces:**
- Consumes: Task 3's `PhoneVerificationProofRepository.consumeIfValid`/`.consumeIfValidForPurpose`.
- Produces: `consumeProofForPhone(String proofToken, String phone, VerificationPurpose purpose): String` (returns the normalized phone on success; used by a future guest-booking-creation flow, which supplies its own phone to cross-check). `consumeProofForLookup(String proofToken, VerificationPurpose purpose): String` (no phone parameter — returns the phone bound to the proof at issuance time; used by Task 9's authorization primitive, which is why the client never needs to resend a phone at lookup time).

- [ ] **Step 1: Write the failing tests**

Add to `Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java` (add `import com.autowashpro.entity.PhoneVerificationProof;` if not already present, and `import java.util.Optional;`, `import static org.mockito.ArgumentMatchers.eq;`, `import static org.mockito.Mockito.verifyNoInteractions;`):

```java
    @Test
    void consumeProofForPhone_validProof_returnsNormalizedPhone() {
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValid(eq("token-1"), eq("+84901234567"), eq(VerificationPurpose.GUEST_BOOKING), any()))
                .thenReturn(1);

        String phone = service.consumeProofForPhone("token-1", "0901234567", VerificationPurpose.GUEST_BOOKING);

        assertThat(phone).isEqualTo("+84901234567");
    }

    @Test
    void consumeProofForPhone_invalidProof_throwsGenericBadRequest() {
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValid(anyString(), anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.consumeProofForPhone("token-1", "0901234567", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    @Test
    void consumeProofForPhone_rateLimitExceeded_throwsTooManyRequests() {
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.consumeProofForPhone("token-1", "0901234567", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void consumeProofForLookup_validProof_returnsPhoneFromRecord() {
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValidForPurpose(eq("token-2"), eq(VerificationPurpose.GUEST_BOOKING_LOOKUP), any()))
                .thenReturn(1);
        PhoneVerificationProof stored = new PhoneVerificationProof();
        stored.setProofToken("token-2");
        stored.setPhone("+84901234567");
        stored.setPurpose(VerificationPurpose.GUEST_BOOKING_LOOKUP);
        when(proofRepository.findById("token-2")).thenReturn(Optional.of(stored));

        String phone = service.consumeProofForLookup("token-2", VerificationPurpose.GUEST_BOOKING_LOOKUP);

        assertThat(phone).isEqualTo("+84901234567");
    }

    @Test
    void consumeProofForLookup_invalidProof_throwsGenericBadRequest() {
        when(rateLimiter.tryConsume(anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValidForPurpose(anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.consumeProofForLookup("token-3", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    @Test
    void consumeProofForLookup_blankToken_throwsGenericBadRequestWithoutQueryingRepository() {
        assertThatThrownBy(() -> service.consumeProofForLookup("   ", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");

        verifyNoInteractions(proofRepository, rateLimiter);
    }
```

- [ ] **Step 2: Run the tests to confirm they fail**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestVerificationServiceImplTest
```
Expected: `BUILD FAILURE` — compile error, `consumeProofForPhone`/`consumeProofForLookup` do not exist yet.

- [ ] **Step 3: Extend `GuestVerificationService`**

In `Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java`, add:

```java
    String consumeProofForPhone(String proofToken, String phone, VerificationPurpose purpose);

    String consumeProofForLookup(String proofToken, VerificationPurpose purpose);
```

- [ ] **Step 4: Extend `GuestVerificationServiceImpl`**

In `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java`, add the constants:

```java
    private static final int CONSUMPTION_MAX_ATTEMPTS = 10;
    private static final Duration CONSUMPTION_WINDOW = Duration.ofMinutes(15);
    private static final String GENERIC_PROOF_ERROR = "Invalid or expired verification proof.";
```

and the two methods:

```java
    @Override
    @Transactional
    public String consumeProofForPhone(String proofToken, String phone, VerificationPurpose purpose) {
        if (proofToken == null || proofToken.isBlank()) {
            throw new BadRequestException(GENERIC_PROOF_ERROR);
        }
        String normalizedPhone = PhoneNormalizer.toE164(phone);
        // Keyed on the token, not the phone (see the Global Constraints rate-limit table) — an
        // attacker with no valid token for a phone cannot exhaust that phone's consumption budget
        // using garbage tokens, the same class of lockout the issuance-side reordering above closes.
        enforceConsumptionRateLimit("consume|" + proofToken);

        int updated = proofRepository.consumeIfValid(proofToken, normalizedPhone, purpose, LocalDateTime.now());
        if (updated != 1) {
            throw new BadRequestException(GENERIC_PROOF_ERROR);
        }
        return normalizedPhone;
    }

    @Override
    @Transactional
    public String consumeProofForLookup(String proofToken, VerificationPurpose purpose) {
        if (proofToken == null || proofToken.isBlank()) {
            throw new BadRequestException(GENERIC_PROOF_ERROR);
        }
        enforceConsumptionRateLimit("lookup|" + proofToken);

        int updated = proofRepository.consumeIfValidForPurpose(proofToken, purpose, LocalDateTime.now());
        if (updated != 1) {
            throw new BadRequestException(GENERIC_PROOF_ERROR);
        }
        return proofRepository.findById(proofToken)
                .map(PhoneVerificationProof::getPhone)
                .orElseThrow(() -> new BadRequestException(GENERIC_PROOF_ERROR));
    }

    private void enforceConsumptionRateLimit(String key) {
        if (!rateLimiter.tryConsume(key, CONSUMPTION_MAX_ATTEMPTS, CONSUMPTION_WINDOW)) {
            throw new TooManyRequestsException(GENERIC_RATE_LIMIT_ERROR);
        }
    }
```

- [ ] **Step 5: Run the tests to confirm they pass**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestVerificationServiceImplTest
```
Expected: `BUILD SUCCESS`, 11 tests passed (5 from Task 6 + 6 new).

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java
git commit -m "feat: add GuestVerificationService proof consumption for phone- and lookup-bound flows"
```

---

### Task 8: `BookingRepository.findByBookingRef`

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/repository/BookingRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/BookingRepositoryTest.java`

**Interfaces:**
- Consumes: existing `Booking` entity (already has `bookingRef`/`guest` fields on disk), Phase 1's `RepositoryIntegrationTest`/`BookingTestFixtures`.
- Produces: `BookingRepository.findByBookingRef(String): Optional<Booking>` — Task 9's authorization service depends on this exact signature.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/BookingRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BookingRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void findByBookingRef_existingRef_returnsBooking() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Lookup Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333010"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-88888"));
        bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-LOOKUP1"));

        Optional<Booking> found = bookingRepository.findByBookingRef("AWP-LOOKUP1");

        assertThat(found).isPresent();
        assertThat(found.get().getBookingRef()).isEqualTo("AWP-LOOKUP1");
    }

    @Test
    void findByBookingRef_unknownRef_returnsEmpty() {
        assertThat(bookingRepository.findByBookingRef("AWP-DOES-NOT-EXIST")).isEmpty();
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `findByBookingRef` does not exist yet.

- [ ] **Step 3: Add the method**

In `Back-end/src/main/java/com/autowashpro/repository/BookingRepository.java`, add `import java.util.Optional;` and:

```java
    Optional<Booking> findByBookingRef(String bookingRef);
```

- [ ] **Step 4: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingRepositoryTest
```
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/repository/BookingRepository.java Back-end/src/test/java/com/autowashpro/repository/BookingRepositoryTest.java
git commit -m "feat: add BookingRepository.findByBookingRef for the future guest lookup endpoint"
```

---

### Task 9: `GuestBookingLookupAuthorizationService` — the tested authorization primitive

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/service/GuestBookingLookupAuthorizationService.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImpl.java`
- Create: `Back-end/src/test/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImplTest.java`
- Create: `Back-end/src/test/java/com/autowashpro/service/GuestBookingLookupAuthorizationIntegrationTest.java`

**Interfaces:**
- Consumes: Task 7's `GuestVerificationService.consumeProofForLookup`, Task 8's `BookingRepository.findByBookingRef`.
- Produces: `GuestBookingLookupAuthorizationService.authorize(String bookingRef, String proofToken): Booking`. This is the primitive a future `GET /api/v1/bookings/{ref}` controller will call — this phase implements and tests only the primitive, not the controller. **Never accepts a phone number as input** — the caller supplies only `bookingRef` (path) and `proofToken` (intended for a request header, e.g. `X-Verification-Proof`, in the future controller — never a query string parameter), matching the brief's "do not put raw phone numbers in query strings." Member (JWT-authenticated) booking lookups are out of scope here — they continue to use JWT-derived ownership exactly as `BookingController.customerBookings` already does; this service is guest-only.
- **Binding invariant (see Global Constraints):** `authorize()` must never be called from inside an outer `@Transactional` context. It deliberately stays non-`@Transactional` itself so that `consumeProofForLookup`'s single-use burn commits independently of whatever `authorize()` does afterward (a 404/403 thrown here must NOT roll that burn back). A real-database integration test in this task proves this behaviorally, not just by comment.

- [ ] **Step 1: Write the failing tests**

Create `Back-end/src/test/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImplTest.java`:

```java
package com.autowashpro.service.impl;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.service.GuestVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestBookingLookupAuthorizationServiceImplTest {

    @Mock
    private GuestVerificationService guestVerificationService;

    @Mock
    private BookingRepository bookingRepository;

    private GuestBookingLookupAuthorizationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestBookingLookupAuthorizationServiceImpl(guestVerificationService, bookingRepository);
    }

    @Test
    void authorize_validProofAndMatchingGuest_returnsBooking() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        Guest guest = new Guest();
        guest.setPhone("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-ABC12345");
        booking.setGuest(guest);
        when(bookingRepository.findByBookingRef("AWP-ABC12345")).thenReturn(Optional.of(booking));

        Booking result = service.authorize("AWP-ABC12345", "token-1");

        assertThat(result).isSameAs(booking);
    }

    @Test
    void authorize_unknownBookingRef_throwsResourceNotFound() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        when(bookingRepository.findByBookingRef("AWP-MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.authorize("AWP-MISSING", "token-1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void authorize_proofPhoneDoesNotMatchBookingGuestPhone_throwsForbidden() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84909999999");
        Guest guest = new Guest();
        guest.setPhone("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-ABC12345");
        booking.setGuest(guest);
        when(bookingRepository.findByBookingRef("AWP-ABC12345")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.authorize("AWP-ABC12345", "token-1"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void authorize_bookingBelongsToMemberNotGuest_throwsForbidden() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-MEMBER01");
        booking.setGuest(null);
        when(bookingRepository.findByBookingRef("AWP-MEMBER01")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.authorize("AWP-MEMBER01", "token-1"))
                .isInstanceOf(ForbiddenException.class);
    }
}
```

- [ ] **Step 2: Run the tests to confirm they fail**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestBookingLookupAuthorizationServiceImplTest
```
Expected: `BUILD FAILURE` — compile error, none of the new types exist yet.

- [ ] **Step 3: Write the interface**

Create `Back-end/src/main/java/com/autowashpro/service/GuestBookingLookupAuthorizationService.java`:

```java
package com.autowashpro.service;

import com.autowashpro.entity.Booking;

public interface GuestBookingLookupAuthorizationService {

    Booking authorize(String bookingRef, String proofToken);
}
```

- [ ] **Step 4: Write the implementation**

Create `Back-end/src/main/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImpl.java`:

```java
package com.autowashpro.service.impl;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.service.GuestBookingLookupAuthorizationService;
import com.autowashpro.service.GuestVerificationService;
import org.springframework.stereotype.Service;

@Service
public class GuestBookingLookupAuthorizationServiceImpl implements GuestBookingLookupAuthorizationService {

    private final GuestVerificationService guestVerificationService;
    private final BookingRepository bookingRepository;

    public GuestBookingLookupAuthorizationServiceImpl(GuestVerificationService guestVerificationService,
                                                        BookingRepository bookingRepository) {
        this.guestVerificationService = guestVerificationService;
        this.bookingRepository = bookingRepository;
    }

    // Deliberately NOT @Transactional. consumeProofForLookup() below commits the proof's single-use
    // burn in its own transaction. If this method were wrapped in an outer transaction (by a future
    // caller), the exceptions thrown after consumption (ResourceNotFoundException/ForbiddenException)
    // would mark that outer transaction rollback-only, undoing the burn and making the proof replayable
    // — reopening exactly the replay/enumeration risk single-use consumption exists to prevent. See
    // GuestBookingLookupAuthorizationIntegrationTest, which proves this behaviorally.
    @Override
    public Booking authorize(String bookingRef, String proofToken) {
        String verifiedPhone = guestVerificationService.consumeProofForLookup(proofToken, VerificationPurpose.GUEST_BOOKING_LOOKUP);

        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found."));

        if (booking.getGuest() == null || !verifiedPhone.equals(booking.getGuest().getPhone())) {
            throw new ForbiddenException("You are not authorized to view this booking.");
        }

        return booking;
    }
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestBookingLookupAuthorizationServiceImplTest
```
Expected: `BUILD SUCCESS`, 4 tests passed.

- [ ] **Step 6: Write the real-database invariant test**

The 4 tests above are fully mocked (`GuestVerificationService` is a `@Mock`), so they cannot observe whether the proof's `consumed_at` commit actually survives an exception thrown afterward — that requires a real transaction boundary. Create `Back-end/src/test/java/com/autowashpro/service/GuestBookingLookupAuthorizationIntegrationTest.java`:

```java
package com.autowashpro.service;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class GuestBookingLookupAuthorizationIntegrationTest {

    @Autowired
    private GuestBookingLookupAuthorizationService authorizationService;

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    private String proofToken;

    @AfterEach
    void cleanUp() {
        if (proofToken != null) {
            proofRepository.deleteById(proofToken);
        }
    }

    @Test
    void authorize_unknownBookingRef_stillConsumesProofDespiteException() {
        proofToken = "gvp_txn_invariant_" + UUID.randomUUID();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(proofToken);
        proof.setPhone("+84911888000");
        proof.setPurpose(VerificationPurpose.GUEST_BOOKING_LOOKUP);
        LocalDateTime now = LocalDateTime.now();
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plusMinutes(5));
        proofRepository.saveAndFlush(proof);

        assertThatThrownBy(() -> authorizationService.authorize("AWP-DOES-NOT-EXIST", proofToken))
                .isInstanceOf(ResourceNotFoundException.class);

        // If the burn had rolled back with the exception above, this second call would reach the ref
        // lookup again and throw ResourceNotFoundException a second time. Instead it must fail earlier,
        // at proof consumption, proving the first call's consumed_at commit was durable.
        assertThatThrownBy(() -> authorizationService.authorize("AWP-DOES-NOT-EXIST", proofToken))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }
}
```

- [ ] **Step 7: Run the new test**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestBookingLookupAuthorizationIntegrationTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 8: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/GuestBookingLookupAuthorizationService.java Back-end/src/main/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImpl.java Back-end/src/test/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImplTest.java Back-end/src/test/java/com/autowashpro/service/GuestBookingLookupAuthorizationIntegrationTest.java
git commit -m "feat: add GuestBookingLookupAuthorizationService — tested primitive for a future guest booking lookup endpoint"
```

---

### Task 10: Full-suite verification, regression check, evidence, and progress records

**Files:**
- Modify: `PROGRESS.md`
- Create: `docs/ai-logs/m1/2026-07-22-fr004v2-phase2-guest-verification.md`

**Interfaces:**
- Consumes: every prior task in this plan.
- Produces: recorded evidence per AGENTS.md's "Evidence and progress" requirement; no code interface.

- [ ] **Step 1: Run the existing registration Firebase-flow test in isolation, to prove no regression**

```powershell
mvn -f Back-end/pom.xml test -Dtest=AuthServiceImplTest
```
Expected: `BUILD SUCCESS`, all tests passing with the same count as before this plan started (this plan's Tasks 1–9 did not modify `AuthServiceImpl.java`, `FirebaseTokenVerifier.java`, `FirebaseTokenVerifierImpl.java`, `VerifiedFirebaseIdentity.java`, or `PhoneNormalizer.java` — only reused them — so this must be a pure re-verification, not a fix). Record the exact test count printed; this is the mandatory "existing registration Firebase flow does not regress" evidence.

- [ ] **Step 2: Run the complete backend test suite**

```powershell
mvn -f Back-end/pom.xml test
```
Expected: `BUILD SUCCESS`. Record the exact total test count and pass count printed — do not assume or pre-compute a number; this plan adds exactly 32 new tests across Tasks 2–9 (1 + 8 + 1 + 4 + 5 + 6 + 2 + 5 — recount from each task's "Run the test(s) to confirm they pass" step if this total is ever in doubt; Task 3 is 8, not the original draft's 6, and Task 9 is 5, not 4, after the adversarial-review fixes added a `consumeIfValidForPurpose` real-database test pair to Task 3 and a real-database transaction-invariant test to Task 9) on top of whatever this repository's actual pre-existing count is at the time this task runs.

- [ ] **Step 3: Confirm the new table's live state on both databases**

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -Q "SELECT COUNT(*) AS proof_count FROM phone_verification_proofs;"
sqlcmd -S localhost -d autowash_pro_test -U sa -P $env:DB_PASSWORD -Q "SELECT COUNT(*) AS proof_count FROM phone_verification_proofs;"
```
Record the actual counts printed (`autowash_pro_test`'s count should be 0 or near-0: Task 3's `@DataJpaTest` tests roll back, and Task 4's `@SpringBootTest` test cleans up its own row in `@AfterEach`).

- [ ] **Step 4: Update `PROGRESS.md`**

Add a new "Last AI-assisted work" entry (above the existing most-recent entry) summarizing: Phase 2 of the owner-approved backend-first FR-004/FR-005 v2 plan is complete — a server-side Firebase-verified, short-lived (5-minute), single-use, phone- and purpose-bound proof mechanism now exists (`phone_verification_proofs` table + atomic conditional-UPDATE consumption, proven under real concurrent threads), backed by a deterministic in-memory rate limiter and a tested guest-booking-lookup authorization primitive. State explicitly: **no HTTP controller/endpoint was added in this phase** — proof issuance/consumption and the lookup authorization primitive exist only as tested service-layer components, ready for the phase that implements guest booking creation and the real `GET /api/v1/bookings/{ref}` endpoint to call them. Record the exact `mvn -f Back-end/pom.xml test` pass count from Step 2.

- [ ] **Step 5: Write the AI log**

Create `docs/ai-logs/m1/2026-07-22-fr004v2-phase2-guest-verification.md` recording: the task, the frozen decisions from this plan's Global Constraints (proof storage/TTL/format/purpose list/atomicity mechanism/rate-limit values/error envelope/migration strategy) and the reasoning for each, the exact files created/modified (list every file from Tasks 1–9), the exact verification commands run and their results (Steps 1–3 of this task), and the explicit scope boundary (no controller, no VNPAY, no slot allocation, no Swagger, no frontend, no audit-log writes, no guest/customer merge logic — service-layer identity-verification foundation only).

- [ ] **Step 6: Commit**

```bash
git add PROGRESS.md docs/ai-logs/m1/2026-07-22-fr004v2-phase2-guest-verification.md
git commit -m "docs: record Phase 2 (guest identity verification-proof foundation) evidence in PROGRESS.md and AI log"
```