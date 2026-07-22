package com.autowashpro.service;

import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** Bounded maintenance for short-lived proof rows; one batch is removed per run. */
@Component
public class PhoneVerificationProofCleanupJob {

    private final PhoneVerificationProofRepository repository;
    private final int batchSize;

    @Autowired
    public PhoneVerificationProofCleanupJob(
            PhoneVerificationProofRepository repository,
            @Value("${autowash.verification-proof.cleanup-batch-size:1000}") int batchSize) {
        if (batchSize <= 0 || batchSize > 10_000) {
            throw new IllegalArgumentException("Proof cleanup batch size must be between 1 and 10000.");
        }
        this.repository = repository;
        this.batchSize = batchSize;
    }

    @Scheduled(
            initialDelayString = "${autowash.verification-proof.cleanup-initial-delay-ms:60000}",
            fixedDelayString = "${autowash.verification-proof.cleanup-delay-ms:600000}")
    public void cleanup() {
        runOnce();
    }

    int runOnce() {
        return repository.deleteExpiredBatch(LocalDateTime.now(), batchSize);
    }
}
