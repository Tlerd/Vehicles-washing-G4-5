package com.autowashpro.domain.booking;

import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.utils.ProofTokenCodec;

/** Raw proof wrapper whose diagnostic representation is always redacted. */
public final class SensitiveProofToken {

    private static final String GENERIC_ERROR = "Invalid or expired verification proof.";
    private final String value;

    private SensitiveProofToken(String value) {
        this.value = value;
    }

    public static SensitiveProofToken of(String value) {
        if (!ProofTokenCodec.isValid(value)) {
            throw new BadRequestException(GENERIC_ERROR);
        }
        return new SensitiveProofToken(value);
    }

    public String reveal() {
        return value;
    }

    @Override
    public String toString() {
        return "SensitiveProofToken[REDACTED]";
    }
}
