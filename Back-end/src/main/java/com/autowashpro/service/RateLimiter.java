package com.autowashpro.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Deterministic, single-instance, in-memory fixed-window rate limiter. Not backed by Redis or
 * any external store — this application runs as a single Spring Boot instance, and correctness
 * of rate limiting (unlike proof single-use) does not need to survive a restart: a reset counter
 * after a restart only ever makes limits momentarily more permissive, never a security hole.
 */
@Component
public class RateLimiter {

    private final Clock clock;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimiter() {
        this(Clock.systemUTC());
    }

    RateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean tryConsume(String key, int maxAttempts, Duration window) {
        Instant now = clock.instant();
        Window result = windows.compute(key, (k, existing) -> {
            if (existing == null || now.isAfter(existing.windowStart().plus(window))) {
                return new Window(now, 1);
            }
            return new Window(existing.windowStart(), existing.count() + 1);
        });
        return result.count() <= maxAttempts;
    }

    private record Window(Instant windowStart, int count) {
    }
}
