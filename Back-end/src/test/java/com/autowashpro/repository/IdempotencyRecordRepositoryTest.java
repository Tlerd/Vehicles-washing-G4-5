package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyRecord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class IdempotencyRecordRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private IdempotencyRecordRepository idempotencyRecordRepository;

    @Test
    void save_and_findById_roundTripsAllFields() {
        String rawKey = "test-key-001";
        String scopedKeyHash = "c".repeat(64);
        IdempotencyRecord record = new IdempotencyRecord();
        record.setScopedKeyHash(scopedKeyHash);
        record.setRequestPath("/api/v1/bookings");
        record.setCustomerId(1L);
        record.setRequestHash("a".repeat(64));
        record.setPrincipalScopeHash("b".repeat(64));
        record.setResponseStatus(201);
        record.setResponseBody("{\"bookingRef\":\"AWP-TESTD1\"}");
        record.setCreatedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusHours(24));

        idempotencyRecordRepository.saveAndFlush(record);

        IdempotencyRecord found = idempotencyRecordRepository.findById(scopedKeyHash).orElseThrow();
        assertThat(found.getRequestPath()).isEqualTo("/api/v1/bookings");
        assertThat(found.getRequestHash()).isEqualTo("a".repeat(64));
        assertThat(found.getPrincipalScopeHash()).isEqualTo("b".repeat(64));
        assertThat(found.getResponseStatus()).isEqualTo(201);
        assertThat(found.getResponseBody()).contains("AWP-TESTD1");
        assertThat(idempotencyRecordRepository.findById(rawKey)).isEmpty();
    }
}
