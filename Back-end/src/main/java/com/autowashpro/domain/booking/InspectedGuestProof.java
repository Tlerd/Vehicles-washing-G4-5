package com.autowashpro.domain.booking;

import java.util.Objects;

/** Non-consuming proof inspection result. Hashes and PII stay redacted in logs. */
public record InspectedGuestProof(BookingActor.Guest actor, String storageDigest) {

    public InspectedGuestProof {
        Objects.requireNonNull(actor, "Guest actor is required.");
        if (storageDigest == null || !storageDigest.matches("[0-9a-f]{64}")) {
            throw new IllegalArgumentException("Proof storage digest is invalid.");
        }
    }

    @Override
    public String toString() {
        return "InspectedGuestProof[actor=REDACTED, storageDigest=REDACTED]";
    }
}
