package com.autowashpro.utils;

import com.autowashpro.exception.custom.BadRequestException;

public final class PhoneNormalizer {

    private PhoneNormalizer() {
    }

    public static String toE164(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BadRequestException("Phone number is required.");
        }

        String normalized = phone.replaceAll("[^0-9+]", "");

        if (normalized.startsWith("+84") && normalized.length() == 12) {
            return normalized;
        }

        if (normalized.startsWith("84") && normalized.length() == 11) {
            return "+" + normalized;
        }

        if (normalized.startsWith("0") && normalized.length() == 10) {
            return "+84" + normalized.substring(1);
        }

        throw new BadRequestException("Invalid phone number format.");
    }
}
