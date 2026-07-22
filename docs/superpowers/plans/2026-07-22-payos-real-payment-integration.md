# PayOS Real Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo self-confirm VietQR payment flow with a real payOS payment-link integration (create link on booking creation, poll real status, cancel on booking cancellation), charging the full booking total.

**Architecture:** A new `PayOsClient` (Spring `RestClient` + HMAC-SHA256 signing) talks to payOS's REST API. `BookingManagementService.create()` persists a `Payment` row and creates a real payOS link inside the same transaction. A new `POST /api/v1/payments/{id}/refresh-status` endpoint replaces the old self-confirm endpoint, updating payment status only from payOS's own response. The frontend renders payOS's QR client-side and offers the real `checkoutUrl` as a reliable fallback/secondary action.

**Tech Stack:** Spring Boot 3.5.6 (Java 17), Spring's built-in `RestClient`, `javax.crypto.Mac` (JDK), SQL Server, React 19 + TanStack Query + `qrcode.react` (new dependency).

## Global Constraints

- **Real money**: the configured PayOS credentials are a live merchant account (owner-confirmed, owner-accepted). Every payment link created is real and payable.
- **Never trust a client-supplied payment status** — status is written only from payOS's own API responses.
- **No PayOS secret** (`PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY`) may appear in frontend code, logs, README, or committed source — env-only, server-side only.
- **No webhook, no deposit tiers, no `PENDING_DEPOSIT` state** — full booking total, polling-only status checks (explicit non-goals, see spec §3).
- **No `FAILED` payment status** — removed from the vocabulary; only `PENDING`/`PROCESSING`/`PAID`/`CANCELLED` are ever written or rendered.
- Full spec: `docs/superpowers/specs/2026-07-22-payos-real-payment-integration-design.md` (read the whole thing before starting — it has the verified live API contract in §4).
- Reference PROGRESS.md for repo evidence conventions and AGENTS.md for the verification commands to run (`mvn -f Back-end/pom.xml test`, `npm --prefix Front-end run typecheck`, `npm --prefix Front-end run build`).

---

## Task 1: `PayOsProperties` config

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/config/PayOsProperties.java`
- Modify: `Back-end/src/main/resources/application.properties`

**Interfaces:**
- Produces: `PayOsProperties` bean-bindable class with getters `getClientId()`, `getApiKey()`, `getChecksumKey()`, `getBaseUrl()`, `getReturnUrl()`, `getCancelUrl()`, `getConnectTimeoutMs()` (`long`), `getReadTimeoutMs()` (`long`). Consumed by Task 3's `PayOsClientImpl`.

This task has no independent test (it's plain config binding, mirroring the existing untested `SystemAccountSeedProperties`) — verified indirectly by Task 3's tests, which fail to wire up if this is wrong.

- [ ] **Step 1: Create `PayOsProperties`**

```java
package com.autowashpro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "autowash.payos")
public class PayOsProperties {

    private String clientId;
    private String apiKey;
    private String checksumKey;
    private String baseUrl;
    private String returnUrl;
    private String cancelUrl;
    private long connectTimeoutMs;
    private long readTimeoutMs;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getChecksumKey() {
        return checksumKey;
    }

    public void setChecksumKey(String checksumKey) {
        this.checksumKey = checksumKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getCancelUrl() {
        return cancelUrl;
    }

    public void setCancelUrl(String cancelUrl) {
        this.cancelUrl = cancelUrl;
    }

    public long getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(long connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public long getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(long readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}
```

- [ ] **Step 2: Add config to `application.properties`**

Append after the existing `autowash.payment.*` lines (end of file):

```properties
# ==========================
# PAYOS (real payment gateway — see docs/superpowers/specs/2026-07-22-payos-real-payment-integration-design.md)
# ==========================
autowash.payos.client-id=${PAYOS_CLIENT_ID}
autowash.payos.api-key=${PAYOS_API_KEY}
autowash.payos.checksum-key=${PAYOS_CHECKSUM_KEY}
autowash.payos.base-url=${PAYOS_BASE_URL:https://api-merchant.payos.vn}
autowash.payos.return-url=${PAYOS_RETURN_URL:http://localhost:5173/app/booking/return}
autowash.payos.cancel-url=${PAYOS_CANCEL_URL:http://localhost:5173/app/booking/cancel}
autowash.payos.connect-timeout-ms=${PAYOS_CONNECT_TIMEOUT_MS:5000}
autowash.payos.read-timeout-ms=${PAYOS_READ_TIMEOUT_MS:10000}
```

No defaults on the three secret keys — matches `autowash.jwt.secret=${JWT_SECRET}`'s fail-fast posture.

- [ ] **Step 3: Compile to verify no syntax errors**

Run: `mvn -f Back-end/pom.xml -q compile`
Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/config/PayOsProperties.java Back-end/src/main/resources/application.properties
git commit -m "feat: add PayOS config properties"
```

---

## Task 2: PayOS response DTOs and `PayOsClient` interface

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/dto/response/PayOsPaymentLink.java`
- Create: `Back-end/src/main/java/com/autowashpro/dto/response/PayOsPaymentLinkStatus.java`
- Create: `Back-end/src/main/java/com/autowashpro/service/PayOsClient.java`

**Interfaces:**
- Produces: `PayOsClient` interface with `createPaymentLink(long, BigDecimal, String)`, `getPaymentLinkInfo(long)`, `cancelPaymentLink(long, String)`. Consumed by Task 3 (`PayOsClientImpl`), Task 6 (`BookingManagementService`), Task 9 (`PaymentServiceImpl`).

- [ ] **Step 1: Create `PayOsPaymentLink`** (maps the verified §4.1 create-response `data` object — only the fields this design actually uses)

```java
package com.autowashpro.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PayOsPaymentLink {
    private String paymentLinkId;
    private String checkoutUrl;
    private String qrCode;
    private String status;
}
```

- [ ] **Step 2: Create `PayOsPaymentLinkStatus`** (maps the verified §4.2/§4.3 `data` object)

```java
package com.autowashpro.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PayOsPaymentLinkStatus {
    private String status;
    private long amountPaid;
    private String cancellationReason;
}
```

- [ ] **Step 3: Create `PayOsClient` interface**

```java
package com.autowashpro.service;

import com.autowashpro.dto.response.PayOsPaymentLink;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;

import java.math.BigDecimal;

/** Real payOS payment-gateway client. No webhook receiver exists in this
 *  phase — payment status is only ever learned by explicitly calling
 *  {@link #getPaymentLinkInfo(long)}, never trusted from any other source. */
public interface PayOsClient {

    /** Creates a real, payable payOS payment link. {@code orderCode} must be
     *  a value the caller controls and can query/cancel later — this design
     *  uses the local {@code Payment} row's own auto-generated id. */
    PayOsPaymentLink createPaymentLink(long orderCode, BigDecimal amount, String description);

    /** Reads the real, current status of a previously created payment link. */
    PayOsPaymentLinkStatus getPaymentLinkInfo(long orderCode);

    /** Best-effort cancellation of a payment link. Callers must not assume
     *  this always succeeds — payOS itself may be unreachable. */
    void cancelPaymentLink(long orderCode, String reason);
}
```

- [ ] **Step 4: Compile to verify no syntax errors**

Run: `mvn -f Back-end/pom.xml -q compile`
Expected: exits 0, no output. (This will fail until Task 3 provides an implementation bean if anything eagerly wires `PayOsClient` — at this point in the plan nothing does yet, so it should still compile.)

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/dto/response/PayOsPaymentLink.java Back-end/src/main/java/com/autowashpro/dto/response/PayOsPaymentLinkStatus.java Back-end/src/main/java/com/autowashpro/service/PayOsClient.java
git commit -m "feat: add PayOS client interface and response DTOs"
```

---

## Task 3: `PayOsClientImpl` with HMAC signing, timeouts, and tests

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/service/impl/PayOsClientImpl.java`
- Test: `Back-end/src/test/java/com/autowashpro/service/impl/PayOsClientImplTest.java`

**Interfaces:**
- Consumes: `PayOsProperties` (Task 1), `PayOsClient`/`PayOsPaymentLink`/`PayOsPaymentLinkStatus` (Task 2), existing `ServiceUnavailableException` (`com.autowashpro.exception.custom`).
- Produces: `PayOsClientImpl implements PayOsClient` — a `@Service` bean, consumed by Task 6 and Task 9.

- [ ] **Step 1: Write the failing tests**

```java
package com.autowashpro.service.impl;

import com.autowashpro.config.PayOsProperties;
import com.autowashpro.dto.response.PayOsPaymentLink;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;
import com.autowashpro.exception.custom.ServiceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PayOsClientImplTest {

    private PayOsProperties properties() {
        PayOsProperties props = new PayOsProperties();
        props.setClientId("test-client-id");
        props.setApiKey("test-api-key");
        props.setChecksumKey("test-checksum-key");
        props.setBaseUrl("https://payos.test");
        props.setReturnUrl("https://example.test/return");
        props.setCancelUrl("https://example.test/cancel");
        props.setConnectTimeoutMs(5000);
        props.setReadTimeoutMs(10000);
        return props;
    }

    private PayOsClientImpl client;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(properties().getBaseUrl());
        server = MockRestServiceServer.bindTo(builder).build();
        client = new PayOsClientImpl(properties(), builder.build());
    }

    @Test
    void createPaymentLink_sendsExactlyVerifiedSignatureAndBody() {
        // Fixture HMAC-SHA256 over the exact sorted-field string, computed with
        // the fixture checksum key above — NOT the real production secret.
        server.expect(requestTo("https://payos.test/v2/payment-requests"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(header("x-client-id", "test-client-id"))
                .andExpect(header("x-api-key", "test-api-key"))
                .andExpect(jsonPath("$.orderCode").value(42))
                .andExpect(jsonPath("$.amount").value(250000))
                .andExpect(jsonPath("$.description").value("AWP-ABCDEFGH"))
                .andExpect(jsonPath("$.cancelUrl").value("https://example.test/cancel"))
                .andExpect(jsonPath("$.returnUrl").value("https://example.test/return"))
                .andExpect(jsonPath("$.signature").value(
                        "d25b850219d62bce42ea5559b37a679621f395b951f7b4159fed1435131545d4"))
                .andRespond(withSuccess("""
                        {"code":"00","desc":"success","data":{
                          "paymentLinkId":"link-123","checkoutUrl":"https://pay.payos.vn/web/link-123",
                          "qrCode":"00020101...","status":"PENDING"},"signature":"resp-sig"}
                        """, MediaType.APPLICATION_JSON));

        PayOsPaymentLink result = client.createPaymentLink(42L, new BigDecimal("250000"), "AWP-ABCDEFGH");

        assertThat(result.getPaymentLinkId()).isEqualTo("link-123");
        assertThat(result.getCheckoutUrl()).isEqualTo("https://pay.payos.vn/web/link-123");
        assertThat(result.getStatus()).isEqualTo("PENDING");
        server.verify();
    }

    @Test
    void createPaymentLink_nonExactAmount_throwsBeforeAnyNetworkCall() {
        assertThatThrownBy(() -> client.createPaymentLink(42L, new BigDecimal("250000.50"), "AWP-ABCDEFGH"))
                .isInstanceOf(ArithmeticException.class);
        server.verify(); // no expectations set, so this proves zero requests were made
    }

    @Test
    void createPaymentLink_serverError_throwsServiceUnavailable() {
        server.expect(requestTo("https://payos.test/v2/payment-requests"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.createPaymentLink(42L, new BigDecimal("250000"), "AWP-ABCDEFGH"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void getPaymentLinkInfo_mapsStatusAmountPaidAndCancellationReason() {
        server.expect(requestTo("https://payos.test/v2/payment-requests/42"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(header("x-client-id", "test-client-id"))
                .andRespond(withSuccess("""
                        {"code":"00","desc":"success","data":{
                          "status":"CANCELLED","amountPaid":0,"cancellationReason":"test"},"signature":"resp-sig"}
                        """, MediaType.APPLICATION_JSON));

        PayOsPaymentLinkStatus result = client.getPaymentLinkInfo(42L);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        assertThat(result.getAmountPaid()).isZero();
        assertThat(result.getCancellationReason()).isEqualTo("test");
    }

    @Test
    void cancelPaymentLink_postsCancellationReason() {
        server.expect(requestTo("https://payos.test/v2/payment-requests/42/cancel"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(jsonPath("$.cancellationReason").value("Booking cancelled"))
                .andRespond(withSuccess("""
                        {"code":"00","desc":"success","data":{"status":"CANCELLED"},"signature":"resp-sig"}
                        """, MediaType.APPLICATION_JSON));

        client.cancelPaymentLink(42L, "Booking cancelled");

        server.verify();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=PayOsClientImplTest`
Expected: compile error — `PayOsClientImpl` does not exist yet.

- [ ] **Step 3: Write `PayOsClientImpl`**

```java
package com.autowashpro.service.impl;

import com.autowashpro.config.PayOsProperties;
import com.autowashpro.dto.response.PayOsPaymentLink;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;
import com.autowashpro.exception.custom.ServiceUnavailableException;
import com.autowashpro.service.PayOsClient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@EnableConfigurationProperties(PayOsProperties.class)
public class PayOsClientImpl implements PayOsClient {

    private final PayOsProperties properties;
    private final RestClient restClient;

    public PayOsClientImpl(PayOsProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) properties.getConnectTimeoutMs());
        factory.setReadTimeout((int) properties.getReadTimeoutMs());
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(factory)
                .build();
    }

    /** Test-only constructor: accepts a pre-built RestClient (e.g. bound to a
     *  MockRestServiceServer) instead of constructing one from properties. */
    PayOsClientImpl(PayOsProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public PayOsPaymentLink createPaymentLink(long orderCode, BigDecimal amount, String description) {
        long amountLong = amount.longValueExact();
        String signString = "amount=" + amountLong
                + "&cancelUrl=" + properties.getCancelUrl()
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + properties.getReturnUrl();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", orderCode);
        body.put("amount", amountLong);
        body.put("description", description);
        body.put("cancelUrl", properties.getCancelUrl());
        body.put("returnUrl", properties.getReturnUrl());
        body.put("signature", sign(signString));
        return post("/v2/payment-requests", body,
                new ParameterizedTypeReference<PayOsEnvelope<PayOsPaymentLink>>() { }).getData();
    }

    @Override
    public PayOsPaymentLinkStatus getPaymentLinkInfo(long orderCode) {
        return get("/v2/payment-requests/" + orderCode,
                new ParameterizedTypeReference<PayOsEnvelope<PayOsPaymentLinkStatus>>() { }).getData();
    }

    @Override
    public void cancelPaymentLink(long orderCode, String reason) {
        post("/v2/payment-requests/" + orderCode + "/cancel", Map.of("cancellationReason", reason),
                new ParameterizedTypeReference<PayOsEnvelope<PayOsPaymentLinkStatus>>() { });
    }

    private <T> PayOsEnvelope<T> post(
            String path, Object body, ParameterizedTypeReference<PayOsEnvelope<T>> type) {
        try {
            PayOsEnvelope<T> response = restClient.post()
                    .uri(path)
                    .header("x-client-id", properties.getClientId())
                    .header("x-api-key", properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(type);
            return requireData(response);
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException("Payment gateway is temporarily unavailable.");
        }
    }

    private <T> PayOsEnvelope<T> get(String path, ParameterizedTypeReference<PayOsEnvelope<T>> type) {
        try {
            PayOsEnvelope<T> response = restClient.get()
                    .uri(path)
                    .header("x-client-id", properties.getClientId())
                    .header("x-api-key", properties.getApiKey())
                    .retrieve()
                    .body(type);
            return requireData(response);
        } catch (RestClientException ex) {
            throw new ServiceUnavailableException("Payment gateway is temporarily unavailable.");
        }
    }

    private <T> PayOsEnvelope<T> requireData(PayOsEnvelope<T> response) {
        if (response == null || response.getData() == null) {
            throw new ServiceUnavailableException("Payment gateway returned an empty response.");
        }
        return response;
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getChecksumKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException ex) {
            throw new ServiceUnavailableException("Payment gateway signing failed.");
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static final class PayOsEnvelope<T> {
        private String code;
        private String desc;
        private T data;
        private String signature;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getDesc() {
            return desc;
        }

        public void setDesc(String desc) {
            this.desc = desc;
        }

        public T getData() {
            return data;
        }

        public void setData(T data) {
            this.data = data;
        }

        public String getSignature() {
            return signature;
        }

        public void setSignature(String signature) {
            this.signature = signature;
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=PayOsClientImplTest`
Expected: exits 0, all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/impl/PayOsClientImpl.java Back-end/src/test/java/com/autowashpro/service/impl/PayOsClientImplTest.java
git commit -m "feat: implement real PayOS HTTP client with HMAC signing"
```

---

## Task 4: `payments` table migration and `Payment` entity fields

**Files:**
- Create: `Back-end/database/FR005_payos_payment_integration_migration.sql`
- Modify: `Back-end/src/main/java/com/autowashpro/entity/Payment.java`

**Interfaces:**
- Produces: `Payment.getOrderCode()`/`setOrderCode(Long)`, `getCheckoutUrl()`/`setCheckoutUrl(String)`, `getQrCode()`/`setQrCode(String)`. Consumed by Task 6 (`BookingManagementService`) and Task 9 (`PaymentServiceImpl`).

- [ ] **Step 1: Write the migration file**

```sql
-- FR005 payOS payment integration migration.
-- Additive and idempotent — safe to run repeatedly against autowash_pro or autowash_pro_test.
USE [autowash_pro]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF COL_LENGTH('dbo.payments', 'order_code') IS NULL
    ALTER TABLE dbo.payments ADD order_code BIGINT NULL;
GO
IF COL_LENGTH('dbo.payments', 'checkout_url') IS NULL
    ALTER TABLE dbo.payments ADD checkout_url NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.payments', 'qr_code') IS NULL
    ALTER TABLE dbo.payments ADD qr_code NVARCHAR(MAX) NULL;
GO

-- Existing rows from the retired demo self-confirm flow used 'SUCCESS';
-- migrate them to the new vocabulary BEFORE tightening the constraint.
UPDATE dbo.payments SET status = 'PAID' WHERE status = 'SUCCESS';
GO

-- Pre-existing 'PENDING' rows from the demo flow have no order_code and can
-- never be completed through payOS (no real link backs them). Mark them
-- CANCELLED so PaymentServiceImpl.refreshStatus's null-order_code guard
-- short-circuits cleanly instead of ever being reached for these rows.
UPDATE dbo.payments SET status = 'CANCELLED' WHERE order_code IS NULL AND status = 'PENDING';
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_payments_status')
    ALTER TABLE dbo.payments DROP CONSTRAINT CK_payments_status;
GO
-- 'FAILED' intentionally omitted — no verified payOS response ever returns
-- it and no code path in this design ever writes it.
ALTER TABLE dbo.payments ADD CONSTRAINT CK_payments_status
    CHECK (status IN ('PENDING','PROCESSING','PAID','CANCELLED'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_payments_order_code' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE UNIQUE INDEX UX_payments_order_code ON dbo.payments(order_code) WHERE order_code IS NOT NULL;
GO
```

- [ ] **Step 2: Apply the migration to both databases**

Run against the dev database:
```bash
sqlcmd -S localhost -d autowash_pro -i Back-end/database/FR005_payos_payment_integration_migration.sql
```
Then edit the file's `USE [autowash_pro]` line to `USE [autowash_pro_test]` temporarily (or pass `-d autowash_pro_test` if your `sqlcmd` setup overrides the `USE` statement) and run again against the test database. Record which `sqlcmd` invocation/credentials actually worked in the AI log (Task 12).
Expected: no errors; re-running the same script a second time also produces no errors (idempotency check).

- [ ] **Step 3: Add the new fields to `Payment.java`**

In `Back-end/src/main/java/com/autowashpro/entity/Payment.java`, add after the existing `ipnPayload` field (before `createdAt`):

```java
    @Column(name = "order_code")
    private Long orderCode;

    @Column(name = "checkout_url", length = 500)
    private String checkoutUrl;

    @Column(name = "qr_code", columnDefinition = "NVARCHAR(MAX)")
    private String qrCode;
```

- [ ] **Step 4: Compile to verify no syntax errors**

Run: `mvn -f Back-end/pom.xml -q compile`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add Back-end/database/FR005_payos_payment_integration_migration.sql Back-end/src/main/java/com/autowashpro/entity/Payment.java
git commit -m "feat: add PayOS columns to payments table and entity"
```

---

## Task 5: `BookingResponse` cleanup

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/dto/booking/BookingResponse.java`

**Interfaces:**
- Produces: `BookingResponse` without `vietQrUrl` (removed — replaced by the already-present `paymentId`/`paymentReference`/`paymentStatus`, plus new `checkoutUrl`/`qrCode` added here). Consumed by Task 6, Task 9, and the frontend (Task 10/11).

- [ ] **Step 1: Remove `vietQrUrl`, add `checkoutUrl`/`qrCode`**

In `BookingResponse.java`, replace:
```java
    private String vietQrUrl;
    private Long paymentId;
    private String paymentReference;
    private String paymentStatus;
```
with:
```java
    private Long paymentId;
    private String paymentReference;
    private String paymentStatus;
    private String checkoutUrl;
    private String qrCode;
```

- [ ] **Step 2: Compile — expect a failure**

Run: `mvn -f Back-end/pom.xml -q compile`
Expected: **fails** — `BookingManagementService.toResponse()` still calls `.vietQrUrl(qr)` on the builder. This is expected; Task 6 fixes it. Do not fix it here — this step is just confirming the removal actually took effect (a compile that still passed would mean the field wasn't really removed).

- [ ] **Step 3: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/dto/booking/BookingResponse.java
git commit -m "feat: replace BookingResponse.vietQrUrl with checkoutUrl/qrCode"
```

(The repo is intentionally left non-compiling between Task 5 and Task 6 for exactly one commit — Task 6 must be done immediately after. If using subagent-driven-development, Tasks 5 and 6 should be treated as one reviewer gate, not two independent ones, since Task 5 alone doesn't compile.)

---

## Task 6: `BookingManagementService.create()` and `toResponse()` rewrite

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java`
- Modify: `Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java`

**Interfaces:**
- Consumes: `PayOsClient` (Task 2/3), `Payment.orderCode/checkoutUrl/qrCode` (Task 4), `BookingResponse.checkoutUrl/qrCode` (Task 5).
- Produces: `BookingManagementService(..., PayOsClient)` — **constructor signature changes**, breaking `BookingManagementServiceTest`'s existing `new BookingManagementService(...)` call, which this task also fixes.

- [ ] **Step 1: Update the failing test's constructor wiring and add new test cases**

In `Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java`:

Replace the imports block's tail and mocks/setUp:
```java
import com.autowashpro.dto.response.PayOsPaymentLink;
import com.autowashpro.exception.custom.ServiceUnavailableException;
import com.autowashpro.service.PayOsClient;
import org.mockito.ArgumentCaptor;
```
(add these to the existing import list; keep everything already there)

Replace:
```java
    @Mock private PaymentRepository paymentRepository;

    private BookingManagementService bookingManagementService;

    @BeforeEach
    void setUp() {
        bookingManagementService = new BookingManagementService(
                bookingRepository, customerRepository, vehicleRepository, branchRepository,
                serviceRepository, bookingServiceRepository, voucherRepository,
                pointHistoryRepository, promotionRepository, paymentRepository);
        // @Value fields are never injected outside a Spring context; the VietQR
        // URL built in toResponse() needs non-null values to avoid NPEs.
        ReflectionTestUtils.setField(bookingManagementService, "bankCode", "VCB");
        ReflectionTestUtils.setField(bookingManagementService, "accountNumber", "1234567890");
        ReflectionTestUtils.setField(bookingManagementService, "accountName", "VINAWASH CO. LTD");
    }
```
with:
```java
    @Mock private PaymentRepository paymentRepository;
    @Mock private PayOsClient payOsClient;

    private BookingManagementService bookingManagementService;

    @BeforeEach
    void setUp() {
        bookingManagementService = new BookingManagementService(
                bookingRepository, customerRepository, vehicleRepository, branchRepository,
                serviceRepository, bookingServiceRepository, voucherRepository,
                pointHistoryRepository, promotionRepository, paymentRepository, payOsClient);
    }
```

Replace the existing `create_persistsPendingPaymentAndResponseSurfacesPaymentFields` test (the VietQR-URL assertions no longer apply) with:
```java
    @Test
    void create_callsPayOsAndPersistsCheckoutUrlAndQrCode() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(new Customer()));
        when(bookingRepository.existsByCustomerCustomerIdAndStatusIn(1L, List.of("PENDING", "CONFIRMED")))
                .thenReturn(false);

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(99L);
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        when(vehicleRepository.findByVehicleIdAndCustomerCustomerId(99L, 1L)).thenReturn(Optional.of(vehicle));

        Branch branch = new Branch();
        branch.setBranchId(1L);
        branch.setStatus("ACTIVE");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));

        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceId(1L);
        service.setServiceCode("WASH");
        service.setServiceName("Rửa xe cơ bản");
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(30);
        service.setStatus("ACTIVE");
        when(serviceRepository.findByServiceCodeIn(List.of("WASH"))).thenReturn(List.of(service));

        when(bookingRepository.findByBranchBranchIdAndBookingDateAndStatusNot(eq(1L), any(LocalDate.class), eq("CANCELLED")))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setBookingId(500L);
            return saved;
        });
        when(bookingServiceRepository.findByBookingBookingId(500L)).thenReturn(List.of());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setPaymentId(77L);
            return saved;
        });

        PayOsPaymentLink link = new PayOsPaymentLink();
        link.setPaymentLinkId("link-abc");
        link.setCheckoutUrl("https://pay.payos.vn/web/link-abc");
        link.setQrCode("00020101...");
        link.setStatus("PENDING");
        when(payOsClient.createPaymentLink(eq(77L), eq(new BigDecimal("100000")), eq("AWP-TESTREF")))
                .thenReturn(link);

        Payment persistedPayment = new Payment();
        persistedPayment.setPaymentId(77L);
        persistedPayment.setOrderCode(77L);
        persistedPayment.setCheckoutUrl("https://pay.payos.vn/web/link-abc");
        persistedPayment.setQrCode("00020101...");
        persistedPayment.setProviderTxnRef("link-abc");
        persistedPayment.setStatus("PENDING");
        when(paymentRepository.findByBookingBookingId(500L)).thenReturn(List.of(persistedPayment));

        CreateBookingRequest request = new CreateBookingRequest();
        request.setCustomerId(1L);
        request.setVehicleId(99L);
        request.setBranchId(1L);
        request.setServiceCodes(List.of("WASH"));
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setBookingTime(LocalTime.of(9, 0));

        BookingResponse response = bookingManagementService.create(request);

        assertThat(response.getBookingRef()).isNotNull();
        assertThat(response.getCheckoutUrl()).isEqualTo("https://pay.payos.vn/web/link-abc");
        assertThat(response.getQrCode()).isEqualTo("00020101...");
        assertThat(response.getPaymentStatus()).isEqualTo("PENDING");

        ArgumentCaptor<Payment> savedPaymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository, org.mockito.Mockito.times(2)).save(savedPaymentCaptor.capture());
        Payment finalSave = savedPaymentCaptor.getAllValues().get(1);
        assertThat(finalSave.getOrderCode()).isEqualTo(77L);
        assertThat(finalSave.getCheckoutUrl()).isEqualTo("https://pay.payos.vn/web/link-abc");
        assertThat(finalSave.getProviderTxnRef()).isEqualTo("link-abc");
    }

    @Test
    void create_payOsFailure_attemptsCompensatingCancelThenRollsBackViaException() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(new Customer()));
        when(bookingRepository.existsByCustomerCustomerIdAndStatusIn(1L, List.of("PENDING", "CONFIRMED")))
                .thenReturn(false);

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(99L);
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        when(vehicleRepository.findByVehicleIdAndCustomerCustomerId(99L, 1L)).thenReturn(Optional.of(vehicle));

        Branch branch = new Branch();
        branch.setBranchId(1L);
        branch.setStatus("ACTIVE");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));

        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceId(1L);
        service.setServiceCode("WASH");
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(30);
        service.setStatus("ACTIVE");
        when(serviceRepository.findByServiceCodeIn(List.of("WASH"))).thenReturn(List.of(service));

        when(bookingRepository.findByBranchBranchIdAndBookingDateAndStatusNot(eq(1L), any(LocalDate.class), eq("CANCELLED")))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking saved = invocation.getArgument(0);
            saved.setBookingId(501L);
            return saved;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setPaymentId(78L);
            return saved;
        });
        when(payOsClient.createPaymentLink(eq(78L), any(BigDecimal.class), any(String.class)))
                .thenThrow(new ServiceUnavailableException("payOS down"));
        when(payOsClient.getPaymentLinkInfo(78L))
                .thenThrow(new ServiceUnavailableException("payOS down"));

        CreateBookingRequest request = new CreateBookingRequest();
        request.setCustomerId(1L);
        request.setVehicleId(99L);
        request.setBranchId(1L);
        request.setServiceCodes(List.of("WASH"));
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setBookingTime(LocalTime.of(9, 0));

        assertThatThrownBy(() -> bookingManagementService.create(request))
                .isInstanceOf(ServiceUnavailableException.class);

        // Compensating check attempted (best-effort) even though it also failed.
        verify(payOsClient).getPaymentLinkInfo(78L);
        // Cancel must NOT be attempted since the compensating check itself failed
        // (we never learned whether a link actually exists).
        verify(payOsClient, org.mockito.Mockito.never()).cancelPaymentLink(org.mockito.ArgumentMatchers.anyLong(), any(String.class));
    }
```

Also add `assertThat` to the static imports if not already present (it already is, from the earlier Task's edits — verify `import static org.assertj.core.api.Assertions.assertThat;` exists; it does from the prior session's work).

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingManagementServiceTest`
Expected: compile error — `BookingManagementService`'s constructor doesn't accept a `PayOsClient` yet, and `Payment` has no `getOrderCode`/etc (already added in Task 4, so those specifically should resolve — only the constructor arity should fail).

- [ ] **Step 3: Rewrite `BookingManagementService.create()` and `toResponse()`**

Replace the whole class body's dependencies section and `create()`/`toResponse()` methods. First, replace:
```java
@Service @RequiredArgsConstructor @Transactional
public class BookingManagementService {
    @Value("${autowash.payment.bank-code:VCB}") private String bankCode;
    @Value("${autowash.payment.account-number:1234567890}") private String accountNumber;
    @Value("${autowash.payment.account-name:VINAWASH CO. LTD}") private String accountName;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final PromotionRepository promotionRepository;
    private final PaymentRepository paymentRepository;
```
with:
```java
@Service @RequiredArgsConstructor @Transactional
public class BookingManagementService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BookingManagementService.class);
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final PromotionRepository promotionRepository;
    private final PaymentRepository paymentRepository;
    private final com.autowashpro.service.PayOsClient payOsClient;
```

Then replace the body of `create()` from the `Payment payment = new Payment();` line onward:
```java
        Payment payment = new Payment();
        payment.setBooking(b); payment.setProvider("DEMO_QR");
        payment.setProviderTxnRef("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setAmount(total); payment.setStatus("PENDING"); payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
        return toResponse(b);
    }
```
with:
```java
        Payment payment = new Payment();
        payment.setBooking(b); payment.setProvider("PAYOS");
        payment.setAmount(total); payment.setStatus("PENDING"); payment.setCreatedAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        long orderCode = payment.getPaymentId();
        com.autowashpro.dto.response.PayOsPaymentLink link;
        try {
            link = payOsClient.createPaymentLink(orderCode, total, b.getBookingRef());
        } catch (RuntimeException createFailure) {
            attemptCompensatingCancel(orderCode, createFailure);
            throw createFailure;
        }
        payment.setOrderCode(orderCode);
        payment.setCheckoutUrl(link.getCheckoutUrl());
        payment.setQrCode(link.getQrCode());
        payment.setProviderTxnRef(link.getPaymentLinkId());
        paymentRepository.save(payment);

        return toResponse(b);
    }

    /** If createPaymentLink's own network call failed, we don't know whether
     *  payOS actually created the link server-side before our client gave up
     *  (e.g. a read timeout after the write). Best-effort: check, and cancel
     *  if a link exists. Both calls are swallowed on failure — the original
     *  exception is always rethrown by the caller regardless. */
    private void attemptCompensatingCancel(long orderCode, RuntimeException originalFailure) {
        try {
            payOsClient.getPaymentLinkInfo(orderCode);
            try {
                payOsClient.cancelPaymentLink(orderCode, "Local booking creation rolled back");
            } catch (RuntimeException cancelFailure) {
                log.warn("Compensating cancel failed for orderCode={} after createPaymentLink failure", orderCode, cancelFailure);
            }
        } catch (RuntimeException checkFailure) {
            log.warn("Compensating status check failed for orderCode={} after createPaymentLink failure ({}); "
                    + "a payOS link may exist untracked locally — check the payOS dashboard.",
                    orderCode, originalFailure.getMessage(), checkFailure);
        }
    }
```

Then replace `toResponse()`'s QR-building and builder call:
```java
    public BookingResponse toResponse(Booking b) {
        List<BookingService> bookingServices = bookingServiceRepository.findByBookingBookingId(b.getBookingId());
        List<Long> ids = bookingServices.stream().map(x -> x.getService().getServiceId()).toList();
        List<String> serviceNames = bookingServices.stream().map(x -> x.getService().getServiceName()).toList();
        String info = URLEncoder.encode(b.getBookingRef(), StandardCharsets.UTF_8);
        String qr = "https://img.vietqr.io/image/" + bankCode + "-" + accountNumber + "-compact2.png?amount=" + b.getTotalPrice().toPlainString() + "&addInfo=" + info + "&accountName=" + URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        Customer customer = b.getCustomer();
        Guest guest = b.getGuest();
        Vehicle vehicle = b.getVehicle();
        Payment payment = paymentRepository.findByBookingBookingId(b.getBookingId()).stream()
                .max(Comparator.comparing(Payment::getPaymentId)).orElse(null);
        return BookingResponse.builder().id(b.getBookingId()).bookingRef(b.getBookingRef())
                .customerId(customer == null ? null : customer.getCustomerId())
                .customerName(customer == null ? guest.getFullName() : customer.getFullName())
                .customerPhone(customer == null ? guest.getPhone() : customer.getPhone())
                .vehicleId(vehicle == null ? null : vehicle.getVehicleId())
                .licensePlate(vehicle == null ? b.getGuestLicensePlate() : vehicle.getLicensePlate())
                .vehicleBrand(vehicle == null ? b.getGuestVehicleBrand() : vehicle.getBrand())
                .vehicleSize(vehicle == null
                        ? b.getGuestVehicleSize().name() : vehicle.getVehicleSize().name())
                .branchId(b.getBranch().getBranchId()).serviceIds(ids).serviceNames(serviceNames)
                .bookingDate(b.getBookingDate()).bookingTime(b.getBookingTime()).endTime(b.getEndTime()).durationMinutes(b.getDurationMinutes())
                .totalPrice(b.getTotalPrice()).status(b.getStatus()).pointsEarned(b.getPointsEarned())
                .appliedVoucherId(b.getAppliedVoucher() == null ? null : b.getAppliedVoucher().getVoucherId()).createdAt(b.getCreatedAt()).vietQrUrl(qr)
                .paymentId(payment == null ? null : payment.getPaymentId())
                .paymentReference(payment == null ? null : payment.getProviderTxnRef())
                .paymentStatus(payment == null ? null : payment.getStatus())
                .build();
    }
```
with:
```java
    public BookingResponse toResponse(Booking b) {
        List<BookingService> bookingServices = bookingServiceRepository.findByBookingBookingId(b.getBookingId());
        List<Long> ids = bookingServices.stream().map(x -> x.getService().getServiceId()).toList();
        List<String> serviceNames = bookingServices.stream().map(x -> x.getService().getServiceName()).toList();
        Customer customer = b.getCustomer();
        Guest guest = b.getGuest();
        Vehicle vehicle = b.getVehicle();
        Payment payment = paymentRepository.findByBookingBookingId(b.getBookingId()).stream()
                .max(Comparator.comparing(Payment::getPaymentId)).orElse(null);
        return BookingResponse.builder().id(b.getBookingId()).bookingRef(b.getBookingRef())
                .customerId(customer == null ? null : customer.getCustomerId())
                .customerName(customer == null ? guest.getFullName() : customer.getFullName())
                .customerPhone(customer == null ? guest.getPhone() : customer.getPhone())
                .vehicleId(vehicle == null ? null : vehicle.getVehicleId())
                .licensePlate(vehicle == null ? b.getGuestLicensePlate() : vehicle.getLicensePlate())
                .vehicleBrand(vehicle == null ? b.getGuestVehicleBrand() : vehicle.getBrand())
                .vehicleSize(vehicle == null
                        ? b.getGuestVehicleSize().name() : vehicle.getVehicleSize().name())
                .branchId(b.getBranch().getBranchId()).serviceIds(ids).serviceNames(serviceNames)
                .bookingDate(b.getBookingDate()).bookingTime(b.getBookingTime()).endTime(b.getEndTime()).durationMinutes(b.getDurationMinutes())
                .totalPrice(b.getTotalPrice()).status(b.getStatus()).pointsEarned(b.getPointsEarned())
                .appliedVoucherId(b.getAppliedVoucher() == null ? null : b.getAppliedVoucher().getVoucherId()).createdAt(b.getCreatedAt())
                .paymentId(payment == null ? null : payment.getPaymentId())
                .paymentReference(payment == null ? null : payment.getProviderTxnRef())
                .paymentStatus(payment == null ? null : payment.getStatus())
                .checkoutUrl(payment == null ? null : payment.getCheckoutUrl())
                .qrCode(payment == null ? null : payment.getQrCode())
                .build();
    }
```

`URLEncoder`/`StandardCharsets` imports become unused — remove the `import java.net.URLEncoder;` and `import java.nio.charset.StandardCharsets;` lines from the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingManagementServiceTest`
Expected: exits 0, all tests pass (including the two new ones and the two pre-existing forbidden-exception tests, which don't reach the payOS call so are unaffected).

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java
git commit -m "feat: create real PayOS payment links on booking creation"
```

---

## Task 7: Booking cancellation reconciles the payOS link and local status

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java`
- Modify: `Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java`

**Interfaces:**
- Consumes: `PayOsClient.cancelPaymentLink` (Task 2/3), `PaymentRepository.findByBookingBookingId` (existing).

- [ ] **Step 1: Write the failing test**

Add to `BookingManagementServiceTest.java`:
```java
    @Test
    void transition_toCancelled_bestEffortCancelsPayOsLinkAndSetsLocalPaymentCancelled() {
        Booking booking = new Booking();
        booking.setBookingId(600L);
        booking.setStatus("PENDING");
        when(bookingRepository.findById(600L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = new Payment();
        payment.setPaymentId(90L);
        payment.setOrderCode(90L);
        payment.setStatus("PENDING");
        when(paymentRepository.findByBookingBookingId(600L)).thenReturn(List.of(payment));
        doThrow(new ServiceUnavailableException("payOS down")).when(payOsClient).cancelPaymentLink(90L, "Booking cancelled");

        BookingResponse response = bookingManagementService.transition(600L, "CANCELLED");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(payment.getStatus()).isEqualTo("CANCELLED"); // set locally despite the payOS call throwing
        verify(payOsClient).cancelPaymentLink(90L, "Booking cancelled");
    }
```
Add `import static org.mockito.Mockito.doThrow;` to the test file's static imports.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingManagementServiceTest#transition_toCancelled_bestEffortCancelsPayOsLinkAndSetsLocalPaymentCancelled`
Expected: FAIL — `transition()` doesn't touch payments at all yet.

- [ ] **Step 3: Implement in `transition()`**

Replace:
```java
    public BookingResponse transition(Long id, String requested) {
        Booking b = bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        String next = requested.toUpperCase();
        Map<String, Set<String>> allowed = Map.of("PENDING", Set.of("CONFIRMED", "CANCELLED"), "CONFIRMED", Set.of("CHECKED_IN", "CANCELLED"), "CHECKED_IN", Set.of("COMPLETED"));
        if (!allowed.getOrDefault(b.getStatus(), Set.of()).contains(next)) throw new BadRequestException("Invalid booking status transition: " + b.getStatus() + " -> " + next);
        b.setStatus(next);
        if ("CANCELLED".equals(next) && b.getAppliedVoucher() != null) { b.getAppliedVoucher().setStatus("ACTIVE"); voucherRepository.save(b.getAppliedVoucher()); }
        if ("COMPLETED".equals(next)) complete(b);
        return toResponse(bookingRepository.save(b));
    }
```
with:
```java
    public BookingResponse transition(Long id, String requested) {
        Booking b = bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        String next = requested.toUpperCase();
        Map<String, Set<String>> allowed = Map.of("PENDING", Set.of("CONFIRMED", "CANCELLED"), "CONFIRMED", Set.of("CHECKED_IN", "CANCELLED"), "CHECKED_IN", Set.of("COMPLETED"));
        if (!allowed.getOrDefault(b.getStatus(), Set.of()).contains(next)) throw new BadRequestException("Invalid booking status transition: " + b.getStatus() + " -> " + next);
        b.setStatus(next);
        if ("CANCELLED".equals(next)) {
            if (b.getAppliedVoucher() != null) { b.getAppliedVoucher().setStatus("ACTIVE"); voucherRepository.save(b.getAppliedVoucher()); }
            reconcilePaymentOnCancellation(b);
        }
        if ("COMPLETED".equals(next)) complete(b);
        return toResponse(bookingRepository.save(b));
    }

    /** Best-effort payOS cancel, but the local payment status is always set
     *  to CANCELLED regardless of that call's outcome — a customer has no
     *  reason to call refresh-status on a booking they just cancelled, so
     *  without this the local row could sit PENDING/PROCESSING forever. */
    private void reconcilePaymentOnCancellation(Booking b) {
        Payment payment = paymentRepository.findByBookingBookingId(b.getBookingId()).stream()
                .max(Comparator.comparing(Payment::getPaymentId)).orElse(null);
        if (payment == null || !Set.of("PENDING", "PROCESSING").contains(payment.getStatus())) {
            return;
        }
        if (payment.getOrderCode() != null) {
            try {
                payOsClient.cancelPaymentLink(payment.getOrderCode(), "Booking cancelled");
            } catch (RuntimeException cancelFailure) {
                log.warn("Best-effort payOS cancel failed for orderCode={} on booking cancellation", payment.getOrderCode(), cancelFailure);
            }
        }
        payment.setStatus("CANCELLED");
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingManagementServiceTest`
Expected: exits 0, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java
git commit -m "feat: reconcile payment status and cancel PayOS link on booking cancellation"
```

---

## Task 8: Rate limiting on booking creation

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/controller/BookingController.java`
- Test: `Back-end/src/test/java/com/autowashpro/controller/BookingControllerRateLimitTest.java`

**Interfaces:**
- Consumes: existing `RateLimiter`/`RateLimiter.Scope.AUTHENTICATED_PRINCIPAL` (already a field in `BookingController`), existing `TooManyRequestsException`.

- [ ] **Step 1: Read the existing rate-limit test file to match its style**

Run: `cat Back-end/src/test/java/com/autowashpro/controller/BookingControllerRateLimitTest.java` and follow its exact `MockMvc`/`@WebMvcTest` (or equivalent) setup pattern for the new test below — this plan doesn't reproduce that boilerplate since it must match whatever harness that file already uses exactly (copy its `@BeforeEach`/mock wiring style verbatim, only the test body differs).

- [ ] **Step 2: Write the failing test** (append to that same file, matching its existing pattern for calling `POST /api/v1/bookings` and asserting on rate limiting — using the same style as its existing availability/lookup rate-limit tests, calling the endpoint `11` times with a fixed authenticated principal and asserting the 11th response is `429` with a `Retry-After` header)

The exact MockMvc invocation must mirror whatever this file already uses for its other endpoints (check its imports/setup before writing) — the test's assertions are:
```java
    @Test
    void bookingCreation_exceedingLimit_returns429() throws Exception {
        // Call POST /api/v1/bookings 11 times as the same authenticated customer;
        // the 11th call must return 429 with a Retry-After header, matching
        // this class's existing pattern for the availability/lookup limits.
        // (Mirror this file's existing MockMvc setup and request-building helper
        // exactly — do not introduce a second, differently-styled test harness.)
    }
```

- [ ] **Step 3: Run test to verify it fails**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingControllerRateLimitTest#bookingCreation_exceedingLimit_returns429`
Expected: FAIL — no rate limit exists on `create()` yet (expect 10 successful 201s then an 11th also succeeding instead of 429; actual failure mode depends on what the other 10 calls do to booking state — if the "one active booking" conflict guard fires first, adjust the test to use 11 distinct customer principals each attempting once via a loop that also asserts each of the first 10 succeeds at the rate-limit layer specifically, independent of downstream business-rule conflicts. Use judgment matching the existing file's approach — the important assertion is solely "attempt 11 within the window is 429", not the business outcome of the other 10.)

- [ ] **Step 4: Implement rate limiting in `BookingController`**

Add these constants near the existing `LOOKUP_*`/`AVAILABILITY_*` constants:
```java
    private static final int BOOKING_CREATE_MAX_ATTEMPTS = 10;
    private static final Duration BOOKING_CREATE_WINDOW = Duration.ofHours(1);
    private static final String BOOKING_CREATE_RATE_LIMIT_ERROR =
            "Too many booking attempts. Please try again later.";
```

Replace:
```java
    @PostMapping("/bookings") public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest r,@AuthenticationPrincipal String callerId) { r.setCustomerId(Long.valueOf(callerId)); return ResponseEntity.status(HttpStatus.CREATED).body(bookings.create(r)); }
```
with:
```java
    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody CreateBookingRequest r, @AuthenticationPrincipal String callerId) {
        enforceBookingCreationRateLimit(callerId);
        r.setCustomerId(Long.valueOf(callerId));
        return ResponseEntity.status(HttpStatus.CREATED).body(bookings.create(r));
    }
```

Add this private method near the other `enforce*RateLimit` methods:
```java
    private void enforceBookingCreationRateLimit(String principalId) {
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.AUTHENTICATED_PRINCIPAL,
                "booking-create:" + principalId,
                BOOKING_CREATE_MAX_ATTEMPTS, BOOKING_CREATE_WINDOW)) {
            throw new TooManyRequestsException(BOOKING_CREATE_RATE_LIMIT_ERROR, 3600);
        }
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=BookingControllerRateLimitTest`
Expected: exits 0, all tests in the file pass (including pre-existing ones — confirms no regression).

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/controller/BookingController.java Back-end/src/test/java/com/autowashpro/controller/BookingControllerRateLimitTest.java
git commit -m "feat: rate-limit booking creation against the live payment gateway"
```

---

## Task 9: `PaymentService.refreshStatus` replaces `confirmPayment`

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/service/PaymentService.java`
- Modify: `Back-end/src/main/java/com/autowashpro/service/impl/PaymentServiceImpl.java`
- Modify: `Back-end/src/main/java/com/autowashpro/controller/PaymentController.java`
- Modify: `Back-end/src/test/java/com/autowashpro/service/impl/PaymentServiceImplTest.java`

**Interfaces:**
- Consumes: `PayOsClient.getPaymentLinkInfo` (Task 2/3), `Payment.orderCode` (Task 4), existing `RateLimiter`, existing `BadRequestException`.
- Produces: `PaymentService.refreshStatus(Long paymentId, Long callerCustomerId): BookingResponse` — the old `confirmPayment` method is removed entirely.

- [ ] **Step 1: Write the failing tests** (replace the entire contents of `PaymentServiceImplTest.java`)

```java
package com.autowashpro.service.impl;

import com.autowashpro.dto.booking.BookingResponse;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Payment;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.PaymentRepository;
import com.autowashpro.service.BookingManagementService;
import com.autowashpro.service.PayOsClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private BookingManagementService bookingManagementService;
    @Mock private PayOsClient payOsClient;

    private Payment paymentFor(Long ownerCustomerId, Long orderCode) {
        Customer owner = new Customer();
        owner.setCustomerId(ownerCustomerId);
        Booking booking = new Booking();
        booking.setCustomer(owner);
        Payment payment = new Payment();
        payment.setPaymentId(10L);
        payment.setOrderCode(orderCode);
        payment.setBooking(booking);
        payment.setAmount(new BigDecimal("100000"));
        payment.setStatus("PENDING");
        return payment;
    }

    @Test
    void refreshStatus_missingPayment_throwsNotFound() {
        when(paymentRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new PaymentServiceImpl(paymentRepository, bookingManagementService, payOsClient)
                .refreshStatus(10L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void refreshStatus_notOwnedByCaller_throwsForbidden() {
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(paymentFor(1L, 10L)));

        assertThatThrownBy(() -> new PaymentServiceImpl(paymentRepository, bookingManagementService, payOsClient)
                .refreshStatus(10L, 2L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void refreshStatus_guestBookingNullCustomer_throwsForbiddenNotNpe() {
        Payment payment = paymentFor(1L, 10L);
        payment.getBooking().setCustomer(null);
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> new PaymentServiceImpl(paymentRepository, bookingManagementService, payOsClient)
                .refreshStatus(10L, 1L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void refreshStatus_nullOrderCode_throwsBadRequestWithoutCallingPayOs() {
        Payment payment = paymentFor(1L, null);
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> new PaymentServiceImpl(paymentRepository, bookingManagementService, payOsClient)
                .refreshStatus(10L, 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void refreshStatus_ownedWithOrderCode_updatesFromRealPayOsResponse() {
        Payment payment = paymentFor(1L, 10L);
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(payment));

        PayOsPaymentLinkStatus status = new PayOsPaymentLinkStatus();
        status.setStatus("PAID");
        status.setAmountPaid(100000);
        status.setCancellationReason(null);
        when(payOsClient.getPaymentLinkInfo(10L)).thenReturn(status);
        when(bookingManagementService.toResponse(payment.getBooking()))
                .thenReturn(BookingResponse.builder().paymentStatus("PAID").build());

        BookingResponse response = new PaymentServiceImpl(paymentRepository, bookingManagementService, payOsClient)
                .refreshStatus(10L, 1L);

        assertThat(payment.getStatus()).isEqualTo("PAID");
        assertThat(payment.getUpdatedAt()).isNotNull();
        assertThat(payment.getIpnPayload()).contains("PAID").contains("100000");
        assertThat(response.getPaymentStatus()).isEqualTo("PAID");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=PaymentServiceImplTest`
Expected: compile error — `PaymentServiceImpl`'s constructor doesn't accept a `PayOsClient` yet, and `refreshStatus` doesn't exist.

- [ ] **Step 3: Update `PaymentService` interface**

Replace the entire file `Back-end/src/main/java/com/autowashpro/service/PaymentService.java`:
```java
package com.autowashpro.service;

import com.autowashpro.dto.booking.BookingResponse;

/** Real payOS payment status refresh. There is no webhook receiver in this
 *  phase (see docs/superpowers/specs/2026-07-22-payos-real-payment-integration-design.md
 *  §3) — status is learned only by explicitly calling payOS's own
 *  get-payment-link-information API, never trusted from anything the
 *  frontend sends. */
public interface PaymentService {

    /** Loads the payment, verifies the caller owns its booking, then updates
     *  its status from payOS's real, current response. Only the owning
     *  customer may refresh their own payment. */
    BookingResponse refreshStatus(Long paymentId, Long callerCustomerId);
}
```

- [ ] **Step 4: Rewrite `PaymentServiceImpl`**

Replace the entire file `Back-end/src/main/java/com/autowashpro/service/impl/PaymentServiceImpl.java`:
```java
package com.autowashpro.service.impl;

import com.autowashpro.dto.booking.BookingResponse;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;
import com.autowashpro.entity.Payment;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.PaymentRepository;
import com.autowashpro.service.BookingManagementService;
import com.autowashpro.service.PayOsClient;
import com.autowashpro.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final PaymentRepository paymentRepository;
    private final BookingManagementService bookingManagementService;
    private final PayOsClient payOsClient;

    @Override
    public BookingResponse refreshStatus(Long paymentId, Long callerCustomerId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        Long ownerId = payment.getBooking().getCustomer() == null
                ? null : payment.getBooking().getCustomer().getCustomerId();
        if (!callerCustomerId.equals(ownerId)) {
            throw new ForbiddenException("Payment does not belong to caller");
        }
        if (payment.getOrderCode() == null) {
            throw new BadRequestException("This payment has no linked payment gateway record.");
        }

        PayOsPaymentLinkStatus status = payOsClient.getPaymentLinkInfo(payment.getOrderCode());
        payment.setStatus(status.getStatus());
        payment.setUpdatedAt(LocalDateTime.now());
        payment.setIpnPayload(serialize(status));
        paymentRepository.save(payment);
        return bookingManagementService.toResponse(payment.getBooking());
    }

    private String serialize(PayOsPaymentLinkStatus status) {
        try {
            return OBJECT_MAPPER.writeValueAsString(status);
        } catch (Exception ex) {
            return "{\"status\":\"" + status.getStatus() + "\"}";
        }
    }
}
```

- [ ] **Step 5: Update `PaymentController`**

Replace the entire file `Back-end/src/main/java/com/autowashpro/controller/PaymentController.java`:
```java
package com.autowashpro.controller;

import com.autowashpro.dto.booking.BookingResponse;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.service.PaymentService;
import com.autowashpro.service.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Real payOS payment status refresh — no webhook in this phase")
public class PaymentController {

    private static final int REFRESH_MAX_ATTEMPTS = 30;
    private static final Duration REFRESH_WINDOW = Duration.ofMinutes(1);
    private static final String REFRESH_RATE_LIMIT_ERROR = "Too many status checks. Please try again shortly.";

    private final PaymentService paymentService;
    private final RateLimiter rateLimiter;

    @Operation(
            summary = "Refresh a payment's status from payOS",
            description = "Calls payOS's real get-payment-link-information API server-side and "
                    + "updates the stored status from that response only. The request carries no "
                    + "status field — the server never trusts a client-supplied payment outcome.")
    @PostMapping("/{paymentId}/refresh-status")
    public BookingResponse refreshStatus(@PathVariable Long paymentId, @AuthenticationPrincipal String callerId) {
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.AUTHENTICATED_PRINCIPAL,
                "payment-refresh:" + callerId,
                REFRESH_MAX_ATTEMPTS, REFRESH_WINDOW)) {
            throw new TooManyRequestsException(REFRESH_RATE_LIMIT_ERROR, 60);
        }
        return paymentService.refreshStatus(paymentId, Long.valueOf(callerId));
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `mvn -f Back-end/pom.xml -q test -Dtest=PaymentServiceImplTest`
Expected: exits 0, all 5 tests pass.

- [ ] **Step 7: Add security matcher check and full compile**

`/api/v1/payments/**` is already `hasRole("CUSTOMER")` in `SecurityConfig.java` from the prior session — no change needed there. Run: `mvn -f Back-end/pom.xml -q compile` to confirm the whole module still compiles.

- [ ] **Step 8: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/service/PaymentService.java Back-end/src/main/java/com/autowashpro/service/impl/PaymentServiceImpl.java Back-end/src/main/java/com/autowashpro/controller/PaymentController.java Back-end/src/test/java/com/autowashpro/service/impl/PaymentServiceImplTest.java
git commit -m "feat: replace self-confirm payment endpoint with real PayOS status refresh"
```

---

## Task 10: Frontend API clients — `qrcode.react` dependency, `bookings.ts`, `payments.ts`

**Files:**
- Modify: `Front-end/package.json`
- Modify: `Front-end/src/lib/api/bookings.ts`
- Modify: `Front-end/src/lib/api/payments.ts`

**Interfaces:**
- Produces: `Booking.checkoutUrl: string | null`, `Booking.qrCode: string | null` (replacing `vietQrUrl`). `useRefreshPaymentStatus()` (replacing `useConfirmPayment`), returning `{ paymentStatus: string | null }`.

- [ ] **Step 1: Add the `qrcode.react` dependency**

In `Front-end/package.json`, add to `"dependencies"` (alphabetical, matching existing ordering):
```json
    "qrcode.react": "^4.2.0",
```
(insert after `"motion"` and before `"react"`, keeping the list alphabetically sorted as it already is)

Run: `npm --prefix Front-end install`
Expected: exits 0, `qrcode.react` appears in `package-lock.json`.

- [ ] **Step 2: Update `bookings.ts`** — remove `vietQrUrl`, add `checkoutUrl`/`qrCode`

Replace:
```ts
interface BookingApiResponse {
  id: number;
  bookingRef: string;
  branchId: number;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  vietQrUrl: string;
  paymentId: number | null;
  paymentReference: string | null;
  paymentStatus: string | null;
}

export interface Booking {
  id: string;
  bookingRef: string;
  branchId: string;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  vietQrUrl: string;
  paymentId: string | null;
  paymentReference: string | null;
  paymentStatus: string | null;
}

function mapBooking(b: BookingApiResponse): Booking {
  return {
    id: String(b.id),
    bookingRef: b.bookingRef,
    branchId: String(b.branchId),
    serviceNames: b.serviceNames,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime.slice(0, 5),
    totalPrice: b.totalPrice,
    status: b.status,
    vietQrUrl: b.vietQrUrl,
    paymentId: b.paymentId === null ? null : String(b.paymentId),
    paymentReference: b.paymentReference,
    paymentStatus: b.paymentStatus,
  };
}
```
with:
```ts
interface BookingApiResponse {
  id: number;
  bookingRef: string;
  branchId: number;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  paymentId: number | null;
  paymentReference: string | null;
  paymentStatus: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
}

export interface Booking {
  id: string;
  bookingRef: string;
  branchId: string;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  paymentId: string | null;
  paymentReference: string | null;
  paymentStatus: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
}

function mapBooking(b: BookingApiResponse): Booking {
  return {
    id: String(b.id),
    bookingRef: b.bookingRef,
    branchId: String(b.branchId),
    serviceNames: b.serviceNames,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime.slice(0, 5),
    totalPrice: b.totalPrice,
    status: b.status,
    paymentId: b.paymentId === null ? null : String(b.paymentId),
    paymentReference: b.paymentReference,
    paymentStatus: b.paymentStatus,
    checkoutUrl: b.checkoutUrl,
    qrCode: b.qrCode,
  };
}
```

- [ ] **Step 3: Rewrite `payments.ts`**

Replace the entire file:
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

interface RefreshPaymentStatusResponse {
  paymentStatus: string | null;
}

/** POST /api/v1/payments/{paymentId}/refresh-status — calls payOS's real
 *  get-payment-link-information API server-side and updates status from
 *  that response only. No request body: nothing the frontend sends can
 *  influence the outcome. */
export function useRefreshPaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) =>
      apiClient.post<RefreshPaymentStatusResponse>(`/payments/${paymentId}/refresh-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-bookings'] }),
  });
}
```

- [ ] **Step 4: Run typecheck to verify it fails where expected**

Run: `npm --prefix Front-end run typecheck`
Expected: **fails** — `BookingWizardPage.tsx` still imports `useConfirmPayment` and references `booking.vietQrUrl`. Task 11 fixes this; this step just confirms the removal took effect (a typecheck that still passed here would mean the old exports weren't really removed).

- [ ] **Step 5: Commit**

```bash
git add Front-end/package.json Front-end/package-lock.json Front-end/src/lib/api/bookings.ts Front-end/src/lib/api/payments.ts
git commit -m "feat: add qrcode.react and update booking/payment API clients for PayOS"
```

---

## Task 11: `BookingWizardPage.tsx` rewrite and i18n updates

**Files:**
- Modify: `Front-end/src/features/booking/BookingWizardPage.tsx`
- Modify: `Front-end/src/i18n/locales/vi/booking.json`
- Modify: `Front-end/src/i18n/locales/en/booking.json`

**Interfaces:**
- Consumes: `Booking.checkoutUrl/qrCode` (Task 10), `useRefreshPaymentStatus()` (Task 10).

- [ ] **Step 1: Update `vi/booking.json`'s `wizard.success.payment`/`statusPanel` keys**

Replace:
```json
      "payment": {
        "sectionTitle": "Thanh toán",
        "amountLabel": "Số tiền cần thanh toán",
        "transferContentLabel": "Nội dung chuyển khoản",
        "internalRefLabel": "Mã thanh toán nội bộ",
        "statusLabel": "Trạng thái",
        "statusPending": "Chờ thanh toán",
        "statusSuccess": "Đã thanh toán",
        "confirmButton": "Tôi đã thanh toán",
        "confirmButtonPending": "Đang xác nhận…",
        "confirmError": "Không thể xác nhận thanh toán. Vui lòng thử lại.",
        "demoNotice": "Đây là luồng thanh toán demo: khách tự xác nhận đã thanh toán. Hệ thống chưa kết nối webhook hoặc đối soát thật từ ngân hàng/VNPAY."
      },
```
with:
```json
      "payment": {
        "sectionTitle": "Thanh toán",
        "amountLabel": "Số tiền cần thanh toán",
        "transferContentLabel": "Nội dung chuyển khoản (có thể khác một chút trên sao kê ngân hàng)",
        "internalRefLabel": "Mã thanh toán nội bộ",
        "statusLabel": "Trạng thái",
        "statusPending": "Chờ thanh toán",
        "statusProcessing": "Đang xử lý",
        "statusPaid": "Đã thanh toán",
        "statusCancelled": "Đã hủy",
        "openPaymentPage": "Mở trang thanh toán payOS",
        "refreshButton": "Kiểm tra trạng thái",
        "refreshButtonPending": "Đang kiểm tra…",
        "refreshError": "Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại.",
        "realMoneyNotice": "Thanh toán được xử lý thật qua payOS vào tài khoản ngân hàng thật. Không có xác nhận giả."
      },
```

- [ ] **Step 2: Update `en/booking.json`'s `wizard.success.payment`/`statusPanel` keys**

Replace:
```json
      "payment": {
        "sectionTitle": "Payment",
        "amountLabel": "Amount due",
        "transferContentLabel": "Transfer content",
        "internalRefLabel": "Internal payment reference",
        "statusLabel": "Status",
        "statusPending": "Awaiting payment",
        "statusSuccess": "Paid",
        "confirmButton": "I've paid",
        "confirmButtonPending": "Confirming…",
        "confirmError": "Couldn't confirm the payment. Please try again.",
        "demoNotice": "This is a demo payment flow: the customer self-confirms payment. No real bank/VNPAY webhook or reconciliation is connected."
      },
```
with:
```json
      "payment": {
        "sectionTitle": "Payment",
        "amountLabel": "Amount due",
        "transferContentLabel": "Transfer content (may differ slightly on your bank statement)",
        "internalRefLabel": "Internal payment reference",
        "statusLabel": "Status",
        "statusPending": "Awaiting payment",
        "statusProcessing": "Processing",
        "statusPaid": "Paid",
        "statusCancelled": "Cancelled",
        "openPaymentPage": "Open payOS payment page",
        "refreshButton": "Check payment status",
        "refreshButtonPending": "Checking…",
        "refreshError": "Couldn't check payment status. Please try again.",
        "realMoneyNotice": "Payment is processed for real via payOS to a real bank account. There is no fake confirmation."
      },
```

- [ ] **Step 3: Rewrite `BookingWizardPage.tsx`'s `BookingSuccess` component**

Replace the imports:
```tsx
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, LanguageToggle, Stepper, ThemeToggle } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useCreateBooking, useCustomerBookings, type Booking } from '@/lib/api/bookings';
import { useConfirmPayment } from '@/lib/api/payments';
import { useAuth } from '@/features/auth/AuthContext';
```
with:
```tsx
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Droplets, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Badge, Button, LanguageToggle, Stepper, ThemeToggle } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useCreateBooking, useCustomerBookings, type Booking } from '@/lib/api/bookings';
import { useRefreshPaymentStatus } from '@/lib/api/payments';
import { useAuth } from '@/features/auth/AuthContext';

function isValidPayOsCheckoutUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('payos.vn');
  } catch {
    return false;
  }
}

const PAYMENT_STATUS_LABEL_KEY: Record<string, string> = {
  PENDING: 'wizard.success.payment.statusPending',
  PROCESSING: 'wizard.success.payment.statusProcessing',
  PAID: 'wizard.success.payment.statusPaid',
  CANCELLED: 'wizard.success.payment.statusCancelled',
};
```

Replace the whole `BookingSuccess` function body:
```tsx
function BookingSuccess({
  booking,
  onHome,
  onAgain,
}: {
  booking: Booking;
  onHome: () => void;
  onAgain: () => void;
}) {
  const { t } = useTranslation('booking');
  const { customer } = useAuth();
  const confirmPayment = useConfirmPayment();
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const paymentId = booking.paymentId;
  // Guards against a double-click firing two confirm calls before React
  // re-renders with isPending=true. The backend also rejects a second
  // confirm under a row lock, but this avoids a wasted/racy request.
  const hasSubmittedConfirm = useRef(false);

  const {
    data: myBookings,
    isFetching: isCheckingStatus,
    refetch: refetchStatus,
  } = useCustomerBookings(customer?.id);
  const bookingStatus = myBookings?.find((b) => b.bookingRef === booking.bookingRef)?.status ?? booking.status;

  const handleConfirmPayment = () => {
    if (hasSubmittedConfirm.current || !paymentId) return;
    hasSubmittedConfirm.current = true;
    confirmPayment.mutate(paymentId, {
      onSuccess: (res) => setPaymentStatus(res.paymentStatus),
      onSettled: () => {
        hasSubmittedConfirm.current = false;
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">
        {t('wizard.success.title')}
      </h1>
      <p className="text-text-secondary">{t('wizard.success.ref', { ref: booking.bookingRef })}</p>
      <img
        src={booking.vietQrUrl}
        alt="VietQR"
        className="my-6 w-56 rounded-2xl border border-border"
      />

      {booking.paymentId && (
        <div className="mb-6 w-full max-w-sm rounded-2xl border border-border bg-surface p-4 text-left">
          <p className="mb-3 text-center font-semibold text-text-primary">
            {t('wizard.success.payment.sectionTitle')}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.amountLabel')}</span>
            <span className="font-bold text-text-primary">{formatVND(booking.totalPrice)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.transferContentLabel')}</span>
            <span className="font-mono font-semibold text-text-primary">{booking.bookingRef}</span>
          </div>
          {booking.paymentReference && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">{t('wizard.success.payment.internalRefLabel')}</span>
              <span className="font-mono text-text-secondary">{booking.paymentReference}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.statusLabel')}</span>
            <Badge tone={paymentStatus === 'SUCCESS' ? 'success' : 'warning'}>
              {paymentStatus === 'SUCCESS'
                ? t('wizard.success.payment.statusSuccess')
                : t('wizard.success.payment.statusPending')}
            </Badge>
          </div>

          {paymentStatus !== 'SUCCESS' && (
            <Button className="mt-4 w-full" onClick={handleConfirmPayment} disabled={confirmPayment.isPending}>
              {confirmPayment.isPending
                ? t('wizard.success.payment.confirmButtonPending')
                : t('wizard.success.payment.confirmButton')}
            </Button>
          )}
          {confirmPayment.isError && (
            <p className="mt-2 text-sm text-danger">{t('wizard.success.payment.confirmError')}</p>
          )}
          <p className="mt-3 text-xs text-text-muted">{t('wizard.success.payment.demoNotice')}</p>
        </div>
      )}

      <div className="mb-6 flex w-full max-w-sm items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{t('wizard.success.statusPanel.label')}</span>
          <Badge tone={bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED' ? 'success' : 'neutral'}>
            {bookingStatus}
          </Badge>
        </div>
        <button
          onClick={() => void refetchStatus()}
          disabled={isCheckingStatus}
          className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
        >
          {isCheckingStatus ? t('wizard.success.statusPanel.refreshing') : t('wizard.success.statusPanel.refresh')}
        </button>
      </div>

      <p className="mb-8 max-w-sm text-text-secondary">{t('wizard.success.description')}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onHome}>
          {t('wizard.success.home')}
        </Button>
        <Button onClick={onAgain}>{t('wizard.success.again')}</Button>
      </div>
    </div>
  );
}
```
with:
```tsx
function BookingSuccess({
  booking,
  onHome,
  onAgain,
}: {
  booking: Booking;
  onHome: () => void;
  onAgain: () => void;
}) {
  const { t } = useTranslation('booking');
  const { customer } = useAuth();
  const refreshPayment = useRefreshPaymentStatus();
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const paymentId = booking.paymentId;
  // Guards against a double-click firing two refresh calls before React
  // re-renders with isPending=true — avoids a wasted/racy call to payOS's
  // live API. The refresh itself is idempotent, so this is belt-and-suspenders.
  const hasSubmittedRefresh = useRef(false);

  const {
    data: myBookings,
    isFetching: isCheckingStatus,
    refetch: refetchStatus,
  } = useCustomerBookings(customer?.id);
  const bookingStatus = myBookings?.find((b) => b.bookingRef === booking.bookingRef)?.status ?? booking.status;

  const handleRefreshPayment = () => {
    if (hasSubmittedRefresh.current || !paymentId) return;
    hasSubmittedRefresh.current = true;
    refreshPayment.mutate(paymentId, {
      onSuccess: (res) => setPaymentStatus(res.paymentStatus),
      onSettled: () => {
        hasSubmittedRefresh.current = false;
      },
    });
  };

  const isPending = paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING' || !paymentStatus;
  const checkoutUrl = isValidPayOsCheckoutUrl(booking.checkoutUrl) ? booking.checkoutUrl : null;
  const qrCode = booking.qrCode && booking.qrCode.length > 0 ? booking.qrCode : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">
        {t('wizard.success.title')}
      </h1>
      <p className="text-text-secondary">{t('wizard.success.ref', { ref: booking.bookingRef })}</p>

      {qrCode && (
        <div className="my-6 rounded-2xl border border-border bg-white p-4">
          <QRCodeSVG value={qrCode} size={240} level="M" />
        </div>
      )}

      {(qrCode || checkoutUrl || paymentId) && (
        <div className="mb-6 w-full max-w-sm rounded-2xl border border-border bg-surface p-4 text-left">
          <p className="mb-3 text-center font-semibold text-text-primary">
            {t('wizard.success.payment.sectionTitle')}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.amountLabel')}</span>
            <span className="font-bold text-text-primary">{formatVND(booking.totalPrice)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.transferContentLabel')}</span>
            <span className="font-mono font-semibold text-text-primary">{booking.bookingRef}</span>
          </div>
          {booking.paymentReference && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">{t('wizard.success.payment.internalRefLabel')}</span>
              <span className="font-mono text-text-secondary">{booking.paymentReference}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('wizard.success.payment.statusLabel')}</span>
            <Badge tone={paymentStatus === 'PAID' ? 'success' : paymentStatus === 'CANCELLED' ? 'danger' : 'warning'}>
              {t(PAYMENT_STATUS_LABEL_KEY[paymentStatus ?? 'PENDING'] ?? 'wizard.success.payment.statusPending')}
            </Badge>
          </div>

          {checkoutUrl && (
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4" />
              {t('wizard.success.payment.openPaymentPage')}
            </Button>
          )}

          {isPending && paymentId && (
            <Button className="mt-3 w-full" onClick={handleRefreshPayment} disabled={refreshPayment.isPending}>
              {refreshPayment.isPending
                ? t('wizard.success.payment.refreshButtonPending')
                : t('wizard.success.payment.refreshButton')}
            </Button>
          )}
          {refreshPayment.isError && (
            <p className="mt-2 text-sm text-danger">{t('wizard.success.payment.refreshError')}</p>
          )}
          <p className="mt-3 text-xs text-text-muted">{t('wizard.success.payment.realMoneyNotice')}</p>
        </div>
      )}

      <div className="mb-6 flex w-full max-w-sm items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{t('wizard.success.statusPanel.label')}</span>
          <Badge tone={bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED' ? 'success' : 'neutral'}>
            {bookingStatus}
          </Badge>
        </div>
        <button
          onClick={() => void refetchStatus()}
          disabled={isCheckingStatus}
          className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
        >
          {isCheckingStatus ? t('wizard.success.statusPanel.refreshing') : t('wizard.success.statusPanel.refresh')}
        </button>
      </div>

      <p className="mb-8 max-w-sm text-text-secondary">{t('wizard.success.description')}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onHome}>
          {t('wizard.success.home')}
        </Button>
        <Button onClick={onAgain}>{t('wizard.success.again')}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run: `npm --prefix Front-end run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Run build**

Run: `npm --prefix Front-end run build`
Expected: exits 0, clean production build.

- [ ] **Step 6: Manual verification (required gate — not automated)**

Start both dev servers (`mvn -f Back-end/pom.xml spring-boot:run` and `npm --prefix Front-end run dev`) and, as a real logged-in customer, walk through: (1) create a booking and confirm the QR renders and the "Open payment page" button opens a real `pay.payos.vn` URL in a new tab; (2) confirm the status badge shows "Awaiting payment"; (3) click "Check payment status" and confirm it calls the backend without erroring (status stays PENDING since nothing was actually paid — that's expected); (4) confirm rapid double-clicking the button only ever shows one in-flight "Checking…" state. Record the actual observed results in the AI log (Task 12) — do not claim this passed without watching it happen.

- [ ] **Step 7: Commit**

```bash
git add Front-end/src/features/booking/BookingWizardPage.tsx Front-end/src/i18n/locales/vi/booking.json Front-end/src/i18n/locales/en/booking.json
git commit -m "feat: render real PayOS QR/checkout link and status refresh in booking success screen"
```

---

## Task 12: Full validation and documentation

**Files:**
- Modify: `PROGRESS.md`
- Create: `docs/ai-logs/m1/2026-07-22-payos-real-payment-integration.md`

- [ ] **Step 1: Run the full backend test suite**

Run: `& Back-end/run-tests.ps1` (PowerShell)
Expected: all tests pass except the two pre-existing, already-documented unrelated failures (`AvailabilityRepositoryIntegrationTest`, `BookingConcurrencyPrimitivesIntegrationTest`) if they're still present and still unrelated to this work — confirm via `git status` that neither file was touched by this plan. Record the exact pass/fail counts.

- [ ] **Step 2: Run frontend typecheck and build one more time from a clean state**

Run: `npm --prefix Front-end run typecheck`
Run: `npm --prefix Front-end run build`
Expected: both exit 0.

- [ ] **Step 3: Update `PROGRESS.md`**

Add a new dated entry under `## Current state` (top of the list) summarizing: what was replaced (demo self-confirm VietQR → real payOS), that this uses the owner's live merchant account, the key correctness fixes from the adversarial spec review (legacy-row migration, compensating cancel, rate limiting, cancellation reconciliation), and the exact validation commands/results from Steps 1-2 plus the manual verification from Task 11 Step 6.

- [ ] **Step 4: Write the AI log**

Create `docs/ai-logs/m1/2026-07-22-payos-real-payment-integration.md` following this repo's existing AI log format (see any file under `docs/ai-logs/m1/` for the structure) — task, human validation, exact evidence, accepted/rejected changes (reference the 8 fixes applied after adversarial review and the 2 accepted residual risks from the spec's §8), and related files/commits.

- [ ] **Step 5: Final commit**

```bash
git add PROGRESS.md docs/ai-logs/m1/2026-07-22-payos-real-payment-integration.md
git commit -m "docs: record PayOS real payment integration completion"
```

---

## Self-Review Notes

**Spec coverage**: §4 (verified contract) → Tasks 2-3. §5.1-5.2 (config/client) → Tasks 1-3. §5.3 (migration) → Task 4. §5.4 (create/compensating cancel/rate limit) → Tasks 6, 8. §5.5 (cancellation reconciliation) → Task 7. §5.6 (refresh-status/rate limit) → Task 9. §6 (frontend) → Tasks 10-11. §7 (testing plan, including the manual gate and the exactness-guard test) → covered across Tasks 3, 6, 7, 8, 9, 11. §8 (rollout notes) → Task 12.

**Type/name consistency checked**: `PayOsClient.createPaymentLink(long, BigDecimal, String)` used identically in Task 3's implementation, Task 6's `BookingManagementService` call site, and Task 6's test mocks. `Payment.getOrderCode()`/`setOrderCode(Long)` used identically across Tasks 4, 6, 7, 9. `BookingResponse.getCheckoutUrl()`/`getQrCode()` used identically across Tasks 5, 6, 11.
