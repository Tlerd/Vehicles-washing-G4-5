package com.autowashpro.service;

import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PhoneVerificationProofCleanupJobTest {

    @Test
    void runOnce_deletesOnlyOneBoundedBatch() {
        PhoneVerificationProofRepository repository = mock(PhoneVerificationProofRepository.class);
        LocalDateTime vietnamNow = LocalDateTime.of(2026, 7, 22, 12, 0);
        when(repository.deleteExpiredBatch(vietnamNow, 250)).thenReturn(250);
        PhoneVerificationProofCleanupJob job = new PhoneVerificationProofCleanupJob(
                repository, 250,
                Clock.fixed(Instant.parse("2026-07-22T05:00:00Z"), ZoneOffset.UTC));

        int deleted = job.runOnce();

        assertThat(deleted).isEqualTo(250);
        verify(repository).deleteExpiredBatch(vietnamNow, 250);
    }
}
