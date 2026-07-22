package com.autowashpro.service;

import java.util.Objects;

/** Immutable minimized HTTP envelope stored for exact idempotent replay. */
public record StoredBookingCreateResponse(
        int status,
        String location,
        String cacheControl,
        String body) {

    public StoredBookingCreateResponse {
        if (status != 201) {
            throw new IllegalArgumentException("Stored booking-create response must be 201.");
        }
        Objects.requireNonNull(location, "Stored response Location is required.");
        Objects.requireNonNull(cacheControl, "Stored response Cache-Control is required.");
        Objects.requireNonNull(body, "Stored response body is required.");
        if (!location.matches("^/api/v1/bookings/AWP-[A-Z0-9]{6,8}$")) {
            throw new IllegalArgumentException("Stored booking-create Location is invalid.");
        }
        if (!"no-store".equals(cacheControl)) {
            throw new IllegalArgumentException(
                    "Stored booking-create Cache-Control must be no-store.");
        }
    }
}
