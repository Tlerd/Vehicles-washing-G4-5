package com.autowashpro.service;

import com.autowashpro.entity.IdempotencyRecord;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdempotencyDecisionPolicyTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 22, 12, 0);
    private final IdempotencyDecisionPolicy policy = new IdempotencyDecisionPolicy();

    @Test
    void missingRecordCreatesAndExactExpiryBoundaryReplaces() {
        assertThat(policy.decide(null, "a".repeat(64), NOW).type())
                .isEqualTo(IdempotencyDecision.Type.CREATE);

        IdempotencyRecord expired = record("a".repeat(64), NOW);
        assertThat(policy.decide(expired, "a".repeat(64), NOW).type())
                .isEqualTo(IdempotencyDecision.Type.REPLACE_EXPIRED);
    }

    @Test
    void unexpiredSameRequestReplaysExactStoredEnvelope() {
        IdempotencyRecord record = record("a".repeat(64), NOW.plusHours(1));

        IdempotencyDecision decision = policy.decide(record, "a".repeat(64), NOW);

        assertThat(decision.type()).isEqualTo(IdempotencyDecision.Type.REPLAY);
        assertThat(decision.response()).isEqualTo(new StoredBookingCreateResponse(
                201, "/api/v1/bookings/AWP-ABC123", "no-store", "{\"bookingRef\":\"AWP-ABC123\"}"));
    }

    @Test
    void unexpiredDifferentRequestConflictsWithoutReturningStoredBody() {
        IdempotencyDecision decision = policy.decide(
                record("a".repeat(64), NOW.plusHours(1)), "b".repeat(64), NOW);

        assertThat(decision.type()).isEqualTo(IdempotencyDecision.Type.CONFLICT);
        assertThat(decision.response()).isNull();
    }

    @Test
    void storedBookingEnvelopeRejectsHeaderOrStatusInjection() {
        assertThatThrownBy(() -> new StoredBookingCreateResponse(
                302, "/api/v1/bookings/AWP-ABC123", "no-store", "{}"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new StoredBookingCreateResponse(
                201, "https://attacker.invalid", "no-store", "{}"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new StoredBookingCreateResponse(
                201, "/api/v1/bookings/AWP-ABC123", "public", "{}"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private IdempotencyRecord record(String requestHash, LocalDateTime expiresAt) {
        IdempotencyRecord record = new IdempotencyRecord();
        record.setRequestHash(requestHash);
        record.setResponseStatus(201);
        record.setResponseLocation("/api/v1/bookings/AWP-ABC123");
        record.setResponseCacheControl("no-store");
        record.setResponseBody("{\"bookingRef\":\"AWP-ABC123\"}");
        record.setExpiresAt(expiresAt);
        return record;
    }
}
