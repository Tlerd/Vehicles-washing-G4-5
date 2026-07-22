package com.autowashpro.service;

import com.autowashpro.domain.booking.NormalizedBookingCreateCommand;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.utils.PhoneNormalizer;
import com.autowashpro.utils.ProofTokenCodec;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class BookingIdempotencyCodec {

    private static final int MIN_KEY_LENGTH = 8;
    private static final int MAX_KEY_LENGTH = 128;

    public String clientKeyHash(String rawKey) {
        if (rawKey == null || rawKey.length() < MIN_KEY_LENGTH
                || rawKey.length() > MAX_KEY_LENGTH) {
            throw invalidKey();
        }
        for (int index = 0; index < rawKey.length(); index++) {
            char character = rawKey.charAt(index);
            if (character < 0x21 || character > 0x7e) {
                throw invalidKey();
            }
        }
        return digest("IDEMPOTENCY_KEY:" + rawKey);
    }

    public String guestProofHash(String rawProof) {
        if (!ProofTokenCodec.isValid(rawProof)) {
            throw new BadRequestException("Invalid or expired verification proof.");
        }
        return digest("GUEST_BOOKING:" + rawProof);
    }

    public String memberPrincipalScopeHash(long customerId) {
        if (customerId <= 0) {
            throw new IllegalArgumentException("Customer ID must be positive.");
        }
        return digest("CUSTOMER|" + customerId);
    }

    public String guestPrincipalScopeHash(String normalizedPhone) {
        String verified;
        try {
            verified = PhoneNormalizer.toE164(normalizedPhone);
        } catch (BadRequestException ex) {
            throw new IllegalArgumentException("Guest phone must be normalized.", ex);
        }
        if (!verified.equals(normalizedPhone)) {
            throw new IllegalArgumentException("Guest phone must be normalized.");
        }
        return digest("GUEST|" + verified);
    }

    public String scopedKeyHash(
            String requestPath, String principalScopeHash, String clientKeyHash) {
        if (requestPath == null || requestPath.isBlank() || requestPath.length() > 200
                || !isDigest(principalScopeHash) || !isDigest(clientKeyHash)) {
            throw new IllegalArgumentException("Idempotency scope is invalid.");
        }
        return digest("SCOPED_KEY:" + requestPath + '|' + principalScopeHash + '|' + clientKeyHash);
    }

    public String requestHash(NormalizedBookingCreateCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("Booking command is required.");
        }
        StringBuilder canonical = new StringBuilder("BOOKING_REQUEST_V1;");
        append(canonical, "branchId", Long.toString(command.branchId()));
        append(canonical, "startAt", command.startAt().toString());
        canonical.append("items=").append(command.items().size()).append(';');
        for (NormalizedBookingCreateCommand.Item item : command.items()) {
            append(canonical, "serviceId", Long.toString(item.serviceId()));
            append(canonical, "quantity", Integer.toString(item.quantity()));
        }
        append(canonical, "vehicleId", value(command.vehicleId()));
        appendVehicle(canonical, "newVehicle", command.newVehicle());
        if (command.guest() == null) {
            append(canonical, "guest", null);
        } else {
            append(canonical, "guestName", command.guest().fullName());
            append(canonical, "guestPhone", command.guest().phone());
            append(canonical, "guestEmail", command.guest().email());
        }
        appendVehicle(canonical, "guestVehicle", command.guestVehicle());
        append(canonical, "voucherId", value(command.voucherId()));
        append(canonical, "note", command.note());
        return digest(canonical.toString());
    }

    private void appendVehicle(
            StringBuilder canonical, String prefix,
            NormalizedBookingCreateCommand.Vehicle vehicle) {
        if (vehicle == null) {
            append(canonical, prefix, null);
            return;
        }
        append(canonical, prefix + "Plate", vehicle.licensePlate());
        append(canonical, prefix + "Brand", vehicle.brand());
        append(canonical, prefix + "Size", vehicle.vehicleSize().name());
    }

    private void append(StringBuilder target, String name, String value) {
        target.append(name).append('=');
        if (value == null) {
            target.append("-1:;");
            return;
        }
        target.append(value.getBytes(StandardCharsets.UTF_8).length)
                .append(':').append(value).append(';');
    }

    private String value(Long value) {
        return value == null ? null : value.toString();
    }

    private boolean isDigest(String value) {
        return value != null && value.matches("[0-9a-f]{64}");
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable.", impossible);
        }
    }

    private BadRequestException invalidKey() {
        return new BadRequestException(
                "Idempotency-Key must contain 8 to 128 visible ASCII characters.");
    }
}
