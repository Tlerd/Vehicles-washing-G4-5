package com.autowashpro.service;

import com.autowashpro.entity.IdempotencyRecord;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Objects;

@Component
public class IdempotencyDecisionPolicy {

    public IdempotencyDecision decide(
            IdempotencyRecord existing, String requestHash, LocalDateTime now) {
        Objects.requireNonNull(requestHash, "Request hash is required.");
        Objects.requireNonNull(now, "Current time is required.");
        if (existing == null) {
            return new IdempotencyDecision(IdempotencyDecision.Type.CREATE, null);
        }
        if (!existing.getExpiresAt().isAfter(now)) {
            return new IdempotencyDecision(IdempotencyDecision.Type.REPLACE_EXPIRED, null);
        }
        if (!constantTimeEquals(existing.getRequestHash(), requestHash)) {
            return new IdempotencyDecision(IdempotencyDecision.Type.CONFLICT, null);
        }
        StoredBookingCreateResponse response = new StoredBookingCreateResponse(
                existing.getResponseStatus(), existing.getResponseLocation(),
                existing.getResponseCacheControl(), existing.getResponseBody());
        return new IdempotencyDecision(IdempotencyDecision.Type.REPLAY, response);
    }

    private boolean constantTimeEquals(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return java.security.MessageDigest.isEqual(
                left.getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                right.getBytes(java.nio.charset.StandardCharsets.US_ASCII));
    }
}
