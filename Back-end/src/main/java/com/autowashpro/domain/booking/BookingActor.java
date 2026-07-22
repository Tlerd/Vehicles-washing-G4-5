package com.autowashpro.domain.booking;

import java.util.Objects;

/** Trusted actor data derived from a JWT subject or an inspected guest proof. */
public sealed interface BookingActor permits BookingActor.Member, BookingActor.Guest {

    record Member(long customerId) implements BookingActor {
        public Member {
            if (customerId <= 0) {
                throw new IllegalArgumentException("Customer ID must be positive.");
            }
        }
    }

    record Guest(String verifiedPhone, String proofReplayHash) implements BookingActor {
        public Guest {
            Objects.requireNonNull(verifiedPhone, "Verified phone is required.");
            if (!verifiedPhone.matches("\\+84[0-9]{9}")) {
                throw new IllegalArgumentException("Verified phone must be normalized.");
            }
            if (proofReplayHash == null || !proofReplayHash.matches("[0-9a-f]{64}")) {
                throw new IllegalArgumentException("Proof replay hash is invalid.");
            }
        }

        @Override
        public String toString() {
            return "Guest[verifiedPhone=REDACTED, proofReplayHash=REDACTED]";
        }
    }
}
