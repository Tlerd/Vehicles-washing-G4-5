package com.autowashpro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Set;
import java.util.TreeMap;

/**
 * Single-instance fixed-window limiter with bounded, independently-evicted scopes.
 *
 * <p>Rate limiting is defence in depth; SQL Server remains authoritative for proof
 * single-use and booking conflicts. Keys are SHA-256 digests so bearer secrets and
 * phone numbers are not retained in heap. Separate scopes prevent attacker-controlled
 * proof-token churn from evicting verified-phone issuance quotas.</p>
 */
@Component
public class RateLimiter {

    public enum Scope {
        VERIFIED_ISSUANCE,
        PROOF_CONSUMPTION,
        REQUEST_ORIGIN,
        PUBLIC_ENDPOINT_GLOBAL,
        AUTHENTICATED_PRINCIPAL
    }

    private static final int DEFAULT_MAX_ENTRIES_PER_SCOPE = 10_000;

    private final Clock clock;
    private final EnumMap<Scope, ScopedWindows> scopes = new EnumMap<>(Scope.class);

    @Autowired
    public RateLimiter(
            @Value("${autowash.rate-limit.max-entries-per-scope:" + DEFAULT_MAX_ENTRIES_PER_SCOPE + "}")
            int maxEntriesPerScope) {
        this(Clock.systemUTC(), maxEntriesPerScope);
    }

    RateLimiter(Clock clock, int maxEntriesPerScope) {
        if (clock == null) {
            throw new IllegalArgumentException("Clock is required.");
        }
        if (maxEntriesPerScope <= 0) {
            throw new IllegalArgumentException("Rate-limit capacity must be positive.");
        }
        this.clock = clock;
        for (Scope scope : Scope.values()) {
            scopes.put(scope, new ScopedWindows(maxEntriesPerScope));
        }
    }

    public boolean tryConsume(Scope scope, String key, int maxAttempts, Duration window) {
        if (scope == null || key == null || key.isBlank()) {
            throw new IllegalArgumentException("Rate-limit scope and key are required.");
        }
        if (maxAttempts <= 0 || window == null || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("Rate-limit attempts and window must be positive.");
        }
        return scopes.get(scope).tryConsume(digest(scope, key), maxAttempts, window, clock.instant());
    }

    int entryCount(Scope scope) {
        return scopes.get(scope).size(clock.instant());
    }

    boolean containsRetainedRawKey(String rawKey) {
        return scopes.values().stream().anyMatch(scope -> scope.containsKey(rawKey));
    }

    private String digest(Scope scope, String key) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = messageDigest.digest((scope.name() + '\0' + key)
                    .getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable.", impossible);
        }
    }

    private static final class ScopedWindows {
        private final int capacity;
        private final LinkedHashMap<String, Window> windows = new LinkedHashMap<>(16, 0.75f, true);
        private final NavigableMap<Instant, Set<String>> expirations = new TreeMap<>();

        private ScopedWindows(int capacity) {
            this.capacity = capacity;
        }

        private synchronized boolean tryConsume(String key, int maxAttempts, Duration duration, Instant now) {
            purgeExpired(now);
            Window existing = windows.get(key);
            if (existing == null || !now.isBefore(existing.expiresAt())) {
                if (existing != null) {
                    removeExpiration(key, existing.expiresAt());
                }
                ensureCapacityForInsert();
                Window created = new Window(now.plus(duration), 1);
                windows.put(key, created);
                expirations.computeIfAbsent(created.expiresAt(), ignored -> new LinkedHashSet<>()).add(key);
                return true;
            }

            Window incremented = new Window(existing.expiresAt(), existing.count() + 1);
            windows.put(key, incremented);
            return incremented.count() <= maxAttempts;
        }

        private void purgeExpired(Instant now) {
            while (!expirations.isEmpty() && !expirations.firstKey().isAfter(now)) {
                Map.Entry<Instant, Set<String>> bucket = expirations.pollFirstEntry();
                for (String key : bucket.getValue()) {
                    Window current = windows.get(key);
                    if (current != null && current.expiresAt().equals(bucket.getKey())) {
                        windows.remove(key);
                    }
                }
            }
        }

        private void ensureCapacityForInsert() {
            if (windows.size() < capacity) {
                return;
            }
            Iterator<Map.Entry<String, Window>> iterator = windows.entrySet().iterator();
            if (iterator.hasNext()) {
                Map.Entry<String, Window> eldest = iterator.next();
                iterator.remove();
                removeExpiration(eldest.getKey(), eldest.getValue().expiresAt());
            }
        }

        private void removeExpiration(String key, Instant expiresAt) {
            Set<String> keys = expirations.get(expiresAt);
            if (keys == null) {
                return;
            }
            keys.remove(key);
            if (keys.isEmpty()) {
                expirations.remove(expiresAt);
            }
        }

        private synchronized int size(Instant now) {
            purgeExpired(now);
            return windows.size();
        }

        private synchronized boolean containsKey(String key) {
            return windows.containsKey(key);
        }
    }

    private record Window(Instant expiresAt, int count) {
    }
}
