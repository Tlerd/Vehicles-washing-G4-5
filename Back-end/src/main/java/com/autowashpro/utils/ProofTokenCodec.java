package com.autowashpro.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.regex.Pattern;

/** Validates externally supplied proof tokens and derives their irreversible storage key. */
public final class ProofTokenCodec {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("^gvp_[A-Za-z0-9_-]{43}$");

    private ProofTokenCodec() {
    }

    public static boolean isValid(String rawToken) {
        return rawToken != null && TOKEN_PATTERN.matcher(rawToken).matches();
    }

    public static String digest(String rawToken) {
        if (!isValid(rawToken)) {
            throw new IllegalArgumentException("Invalid proof-token format.");
        }
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable.", impossible);
        }
    }
}
