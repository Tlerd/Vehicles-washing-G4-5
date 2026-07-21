package com.autowashpro.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

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
        RateLimiter limiter = new RateLimiter(clock);

        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
        assertThat(limiter.tryConsume("key-a", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_overThreshold_blocksFurtherAttempts() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));
        limiter.tryConsume("key-b", 3, Duration.ofMinutes(15));

        assertThat(limiter.tryConsume("key-b", 3, Duration.ofMinutes(15))).isFalse();
    }

    @Test
    void tryConsume_afterWindowElapses_resetsCount() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        for (int i = 0; i < 3; i++) {
            limiter.tryConsume("key-c", 3, Duration.ofMinutes(15));
        }
        assertThat(limiter.tryConsume("key-c", 3, Duration.ofMinutes(15))).isFalse();

        clock.advance(Duration.ofMinutes(16));

        assertThat(limiter.tryConsume("key-c", 3, Duration.ofMinutes(15))).isTrue();
    }

    @Test
    void tryConsume_differentKeys_haveIndependentQuotas() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        RateLimiter limiter = new RateLimiter(clock);

        limiter.tryConsume("key-d1", 1, Duration.ofMinutes(15));
        assertThat(limiter.tryConsume("key-d1", 1, Duration.ofMinutes(15))).isFalse();

        assertThat(limiter.tryConsume("key-d2", 1, Duration.ofMinutes(15))).isTrue();
    }
}
