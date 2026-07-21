package com.autowashpro.utils;

import java.security.SecureRandom;
import java.util.Base64;

public final class ProofTokenGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private ProofTokenGenerator() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return "gvp_" + ENCODER.encodeToString(bytes);
    }
}
