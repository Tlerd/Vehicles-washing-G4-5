package com.autowashpro.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

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
        RateLimiter limiter = new RateLimiter(clock, 100);

        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-a", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_overThreshold_blocksFurtherAttempts() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 100);

        limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-b", 3, Duration.ofMinutes(15));

        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-b", 3, Duration.ofMinutes(15))).isFalse();
    }

    @Test
    void tryConsume_afterWindowElapses_resetsCount() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 100);

        for (int i = 0; i < 3; i++) {
            limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-c", 3, Duration.ofMinutes(15));
        }
        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-c", 3, Duration.ofMinutes(15))).isFalse();

        clock.advance(Duration.ofMinutes(16));

        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-c", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_differentKeys_haveIndependentQuotas() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 100);

        limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-d1", 1, Duration.ofMinutes(15));
        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-d1", 1, Duration.ofMinutes(15))).isFalse();

        assertThat(limiter.tryConsume(RateLimiter.Scope.VERIFIED_ISSUANCE, "key-d2", 1, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void attackerControlledKeys_neverExceedConfiguredCapacity() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 8);

        for (int i = 0; i < 1_000; i++) {
            limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, "garbage-token-" + i, 10, Duration.ofMinutes(15));
        }

        assertThat(limiter.entryCount(RateLimiter.Scope.PROOF_CONSUMPTION)).isLessThanOrEqualTo(8);
        assertThat(limiter.entryCount(RateLimiter.Scope.VERIFIED_ISSUANCE)).isZero();
    }

    @Test
    void expiredWindows_areRemovedBeforeCapacityEviction() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 3);
        Duration window = Duration.ofMinutes(1);
        limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, "one", 1, window);
        limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, "two", 1, window);
        limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, "three", 1, window);

        clock.advance(window);
        limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, "four", 1, window);

        assertThat(limiter.entryCount(RateLimiter.Scope.PROOF_CONSUMPTION)).isEqualTo(1);
    }

    @Test
    void exactExpiryBoundary_startsNewWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 10);
        Duration window = Duration.ofMinutes(1);
        assertThat(limiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN, "origin", 1, window)).isTrue();
        assertThat(limiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN, "origin", 1, window)).isFalse();

        clock.advance(window);

        assertThat(limiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN, "origin", 1, window)).isTrue();
    }

    @Test
    void retainedKeys_areDigestsRatherThanRawSecrets() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 10);
        String rawSecret = "gvp_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";

        limiter.tryConsume(RateLimiter.Scope.PROOF_CONSUMPTION, rawSecret, 1, Duration.ofMinutes(1));

        assertThat(limiter.containsRetainedRawKey(rawSecret)).isFalse();
    }

    @Test
    void concurrentCalls_allowExactlyConfiguredMaximum() throws Exception {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 10);
        int workers = 20;
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        try {
            for (int i = 0; i < workers; i++) {
                results.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return limiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN, "same-origin", 5, Duration.ofMinutes(1));
                }));
            }
            ready.await();
            start.countDown();

            long allowed = 0;
            for (Future<Boolean> result : results) {
                if (result.get()) {
                    allowed++;
                }
            }
            assertThat(allowed).isEqualTo(5);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void originKeyChurn_cannotEvictGlobalEndpointQuota() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock, 4);
        Duration window = Duration.ofMinutes(15);
        assertThat(limiter.tryConsume(RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL,
                "guest-lookup", 1, window)).isTrue();
        assertThat(limiter.tryConsume(RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL,
                "guest-lookup", 1, window)).isFalse();

        for (int i = 0; i < 100; i++) {
            limiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN, "origin-" + i, 1, window);
        }

        assertThat(limiter.tryConsume(RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL,
                "guest-lookup", 1, window)).isFalse();
    }
}
