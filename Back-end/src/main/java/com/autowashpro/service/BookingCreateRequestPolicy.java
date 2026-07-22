package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActor;
import com.autowashpro.domain.booking.NormalizedBookingCreateCommand;
import com.autowashpro.dto.booking.BookingItemSelection;
import com.autowashpro.dto.booking.CreateBookingV2Request;
import com.autowashpro.dto.booking.GuestContactInput;
import com.autowashpro.dto.booking.GuestVehicleInput;
import com.autowashpro.dto.booking.NewVehicleInput;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.utils.PhoneNormalizer;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class BookingCreateRequestPolicy {

    private static final int MAX_ITEMS = 20;
    private static final String INVALID_REQUEST = "Invalid booking request.";
    private static final String PLATE_PATTERN = "^[0-9]{2}[A-Z]-[0-9]{3}\\.?[0-9]{2}$";

    public NormalizedBookingCreateCommand normalize(
            CreateBookingV2Request request, BookingActor actor) {
        if (request == null || actor == null || request.branchId() == null
                || request.branchId() <= 0 || request.startAt() == null) {
            throw invalid();
        }

        List<NormalizedBookingCreateCommand.Item> items = normalizeItems(request.items());
        String note = optionalText(request.note(), 500, false);

        if (actor instanceof BookingActor.Member) {
            boolean hasSavedVehicle = request.vehicleId() != null;
            boolean hasNewVehicle = request.newVehicle() != null;
            if (hasSavedVehicle == hasNewVehicle || request.guest() != null
                    || request.guestVehicle() != null
                    || hasSavedVehicle && request.vehicleId() <= 0
                    || request.voucherId() != null && request.voucherId() <= 0) {
                throw invalid();
            }
            NormalizedBookingCreateCommand.Vehicle vehicle = hasNewVehicle
                    ? normalizeVehicle(request.newVehicle()) : null;
            return new NormalizedBookingCreateCommand(
                    actor, request.branchId(), request.startAt(), items,
                    request.vehicleId(), vehicle, null, null, request.voucherId(), note);
        }

        if (!(actor instanceof BookingActor.Guest guestActor)
                || request.vehicleId() != null || request.newVehicle() != null
                || request.voucherId() != null || request.guest() == null
                || request.guestVehicle() == null) {
            throw invalid();
        }

        NormalizedBookingCreateCommand.GuestContact guest = normalizeGuest(request.guest());
        if (!constantTimeEquals(guest.phone(), guestActor.verifiedPhone())) {
            throw invalid();
        }
        return new NormalizedBookingCreateCommand(
                actor, request.branchId(), request.startAt(), items, null, null,
                guest, normalizeVehicle(request.guestVehicle()), null, note);
    }

    private List<NormalizedBookingCreateCommand.Item> normalizeItems(
            List<BookingItemSelection> items) {
        if (items == null || items.isEmpty() || items.size() > MAX_ITEMS) {
            throw invalid();
        }
        Set<Long> identifiers = new HashSet<>();
        return items.stream().map(item -> {
            if (item == null || item.serviceId() == null || item.serviceId() <= 0
                    || item.quantity() == null || item.quantity() < 1 || item.quantity() > 20
                    || !identifiers.add(item.serviceId())) {
                throw invalid();
            }
            return new NormalizedBookingCreateCommand.Item(item.serviceId(), item.quantity());
        }).toList();
    }

    private NormalizedBookingCreateCommand.GuestContact normalizeGuest(GuestContactInput input) {
        String fullName = requiredText(input.fullName(), 100, false);
        if (input.phone() == null || !input.phone().matches("[+0-9() .-]+")) {
            throw invalid();
        }
        String phone;
        try {
            phone = PhoneNormalizer.toE164(input.phone());
        } catch (BadRequestException ex) {
            throw invalid();
        }
        String email = optionalText(input.email(), 150, true);
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw invalid();
        }
        return new NormalizedBookingCreateCommand.GuestContact(fullName, phone, email);
    }

    private NormalizedBookingCreateCommand.Vehicle normalizeVehicle(NewVehicleInput input) {
        if (input == null) {
            throw invalid();
        }
        return normalizeVehicle(input.licensePlate(), input.brand(), input.vehicleSize());
    }

    private NormalizedBookingCreateCommand.Vehicle normalizeVehicle(GuestVehicleInput input) {
        if (input == null) {
            throw invalid();
        }
        return normalizeVehicle(input.licensePlate(), input.brand(), input.vehicleSize());
    }

    private NormalizedBookingCreateCommand.Vehicle normalizeVehicle(
            String rawPlate, String rawBrand, com.autowashpro.entity.VehicleSize size) {
        String plate = requiredText(rawPlate, 20, false)
                .toUpperCase(Locale.ROOT).replaceAll("\\s+", "");
        String brand = requiredText(rawBrand, 50, false);
        if (!plate.matches(PLATE_PATTERN) || size == null) {
            throw invalid();
        }
        return new NormalizedBookingCreateCommand.Vehicle(plate, brand, size);
    }

    private String requiredText(String value, int maxLength, boolean lowerCase) {
        String normalized = optionalText(value, maxLength, lowerCase);
        if (normalized == null) {
            throw invalid();
        }
        return normalized;
    }

    private String optionalText(String value, int maxLength, boolean lowerCase) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (Character.isISOControl(character)
                    && character != '\t' && character != '\r' && character != '\n') {
                throw invalid();
            }
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFC)
                .trim().replaceAll("\\s+", " ");
        if (lowerCase) {
            normalized = normalized.toLowerCase(Locale.ROOT);
        }
        if (normalized.isEmpty() || normalized.length() > maxLength) {
            throw invalid();
        }
        return normalized;
    }

    private boolean constantTimeEquals(String left, String right) {
        byte[] leftBytes = left.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] rightBytes = right.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return java.security.MessageDigest.isEqual(leftBytes, rightBytes);
    }

    private BadRequestException invalid() {
        return new BadRequestException(INVALID_REQUEST);
    }
}
