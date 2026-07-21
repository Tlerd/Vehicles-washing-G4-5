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
