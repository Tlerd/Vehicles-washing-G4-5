package com.autowashpro.service;

public record IdempotencyDecision(Type type, StoredBookingCreateResponse response) {

    public enum Type {
        CREATE,
        REPLAY,
        REPLACE_EXPIRED,
        CONFLICT
    }
}
