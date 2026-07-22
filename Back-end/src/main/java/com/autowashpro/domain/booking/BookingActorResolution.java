package com.autowashpro.domain.booking;

import java.util.Objects;

/** Result of the HTTP authentication XOR before guest proof inspection. */
public sealed interface BookingActorResolution
        permits BookingActorResolution.Member, BookingActorResolution.GuestCandidate {

    record Member(long customerId) implements BookingActorResolution {
        public Member {
            if (customerId <= 0) {
                throw new IllegalArgumentException("Customer ID must be positive.");
            }
        }

        public BookingActor.Member trustedActor() {
            return new BookingActor.Member(customerId);
        }
    }

    record GuestCandidate(SensitiveProofToken proof) implements BookingActorResolution {
        public GuestCandidate {
            Objects.requireNonNull(proof, "Guest proof is required.");
        }
    }
}
