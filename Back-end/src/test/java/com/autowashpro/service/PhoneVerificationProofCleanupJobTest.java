package com.autowashpro.service;

import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

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
        when(repository.deleteExpiredBatch(any(LocalDateTime.class), eq(250))).thenReturn(250);
        PhoneVerificationProofCleanupJob job = new PhoneVerificationProofCleanupJob(repository, 250);

        int deleted = job.runOnce();

        assertThat(deleted).isEqualTo(250);
        verify(repository).deleteExpiredBatch(any(LocalDateTime.class), eq(250));
    }
}
