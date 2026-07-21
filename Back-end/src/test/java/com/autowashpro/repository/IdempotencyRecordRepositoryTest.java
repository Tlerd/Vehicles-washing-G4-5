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
    }
}
