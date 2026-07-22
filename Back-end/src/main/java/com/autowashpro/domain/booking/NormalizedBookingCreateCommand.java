package com.autowashpro.domain.booking;

import com.autowashpro.entity.VehicleSize;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public record NormalizedBookingCreateCommand(
        BookingActor actor,
        long branchId,
        Instant startAt,
        List<Item> items,
        Long vehicleId,
        Vehicle newVehicle,
        GuestContact guest,
        Vehicle guestVehicle,
        Long voucherId,
        String note) {

    public NormalizedBookingCreateCommand {
        Objects.requireNonNull(actor, "Actor is required.");
        Objects.requireNonNull(startAt, "Start instant is required.");
        items = items == null ? List.of() : items.stream()
                .sorted(Comparator.comparingLong(Item::serviceId))
                .toList();
    }

    @Override
    public String toString() {
        return "NormalizedBookingCreateCommand[branchId=" + branchId
                + ", startAt=" + startAt + ", itemCount=" + items.size()
                + ", sensitiveFields=REDACTED]";
    }

    public record Item(long serviceId, int quantity) {
    }

    public record Vehicle(String licensePlate, String brand, VehicleSize vehicleSize) {
        @Override
        public String toString() {
            return "Vehicle[REDACTED]";
        }
    }

    public record GuestContact(String fullName, String phone, String email) {
        @Override
        public String toString() {
            return "GuestContact[REDACTED]";
        }
    }
}
