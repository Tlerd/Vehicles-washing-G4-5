package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyRecord;
<<<<<<< HEAD
import com.autowashpro.entity.IdempotencyGuestProof;
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class IdempotencyRecordRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private IdempotencyRecordRepository idempotencyRecordRepository;

<<<<<<< HEAD
    @Autowired
    private IdempotencyGuestProofRepository guestProofRepository;

    @Test
    void save_and_findById_roundTripsAllFields() {
        String rawKey = "test-key-001";
        String scopedKeyHash = "c".repeat(64);
        LocalDateTime now = LocalDateTime.now();
        IdempotencyRecord record = new IdempotencyRecord();
        record.setScopedKeyHash(scopedKeyHash);
        record.setRequestPath("/api/v1/bookings");
        record.setCustomerId(1L);
        record.setRequestHash("a".repeat(64));
        record.setPrincipalScopeHash("b".repeat(64));
        record.setClientKeyHash("d".repeat(64));
        record.setResponseStatus(201);
        record.setResponseBody("{\"bookingRef\":\"AWP-TESTD1\"}");
        record.setResponseLocation("/api/v1/bookings/AWP-TESTD1");
        record.setResponseCacheControl("no-store");
        record.setCreatedAt(now);
        record.setExpiresAt(now.plusHours(24));

        idempotencyRecordRepository.saveAndFlush(record);

        IdempotencyRecord found = idempotencyRecordRepository.findById(scopedKeyHash).orElseThrow();
        assertThat(found.getRequestPath()).isEqualTo("/api/v1/bookings");
        assertThat(found.getRequestHash()).isEqualTo("a".repeat(64));
        assertThat(found.getPrincipalScopeHash()).isEqualTo("b".repeat(64));
        assertThat(found.getClientKeyHash()).isEqualTo("d".repeat(64));
        assertThat(found.getResponseStatus()).isEqualTo(201);
        assertThat(found.getResponseBody()).contains("AWP-TESTD1");
        assertThat(found.getResponseLocation()).isEqualTo("/api/v1/bookings/AWP-TESTD1");
        assertThat(found.getResponseCacheControl()).isEqualTo("no-store");
        assertThat(idempotencyRecordRepository.findById(rawKey)).isEmpty();
    }

    @Test
    void save_guestRecord_roundTripsProofBindingWithoutRawProof() {
        LocalDateTime now = LocalDateTime.now();
        IdempotencyRecord record = new IdempotencyRecord();
        record.setScopedKeyHash("1".repeat(64));
        record.setRequestPath("/api/v1/bookings");
        record.setGuestPhone("+84901112233");
        record.setRequestHash("2".repeat(64));
        record.setPrincipalScopeHash("3".repeat(64));
        record.setClientKeyHash("4".repeat(64));
        record.setGuestProofHash("5".repeat(64));
        record.setResponseStatus(201);
        record.setResponseBody("{\"bookingRef\":\"AWP-GUEST1\"}");
        record.setResponseLocation("/api/v1/bookings/AWP-GUEST1");
        record.setResponseCacheControl("no-store");
        record.setCreatedAt(now);
        record.setExpiresAt(now.plusHours(24));

        idempotencyRecordRepository.saveAndFlush(record);

        IdempotencyRecord found = idempotencyRecordRepository.findById("1".repeat(64)).orElseThrow();
        assertThat(found.getGuestPhone()).isEqualTo("+84901112233");
        assertThat(found.getGuestProofHash()).isEqualTo("5".repeat(64));
        assertThat(found.getGuestProofHash()).doesNotContain("gvp_");

        IdempotencyGuestProof proof = new IdempotencyGuestProof();
        proof.setProofHash(found.getGuestProofHash());
        proof.setRecord(found);
        proof.setCreatedAt(now);
        guestProofRepository.saveAndFlush(proof);

        assertThat(guestProofRepository.findReplayRecord(
                "5".repeat(64), "4".repeat(64), "/api/v1/bookings"))
                .map(IdempotencyRecord::getScopedKeyHash)
                .contains("1".repeat(64));
=======
    @Test
    void save_and_findById_roundTripsAllFields() {
        IdempotencyRecord record = new IdempotencyRecord();
        record.setIdempotencyKey("test-key-001");
        record.setRequestPath("/api/v1/bookings");
        record.setCustomerId(1L);
        record.setResponseStatus(201);
        record.setResponseBody("{\"bookingRef\":\"AWP-TESTD1\"}");
        record.setCreatedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusHours(24));

        idempotencyRecordRepository.saveAndFlush(record);

        IdempotencyRecord found = idempotencyRecordRepository.findById("test-key-001").orElseThrow();
        assertThat(found.getRequestPath()).isEqualTo("/api/v1/bookings");
        assertThat(found.getResponseStatus()).isEqualTo(201);
        assertThat(found.getResponseBody()).contains("AWP-TESTD1");
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
    }
}
