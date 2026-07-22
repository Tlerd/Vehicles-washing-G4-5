package com.autowashpro.dto.booking;

import com.fasterxml.jackson.annotation.JsonAnySetter;

/** Rejects authority or legacy fields even when the application mapper is permissive. */
public interface StrictBookingJsonInput {

    @JsonAnySetter
    default void rejectUnknownBookingField(String field, Object ignoredValue) {
        throw new IllegalArgumentException("Unknown booking field: " + field);
    }
}
