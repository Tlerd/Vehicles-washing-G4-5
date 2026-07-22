package com.autowashpro.dto.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/**
 * Canonical booking-create body. Authentication, state, duration, price, and
 * payment fields are intentionally absent because the server owns them.
 */
public record CreateBookingV2Request(
        @NotNull @Positive Long branchId,
        @NotNull Instant startAt,
        @NotEmpty @Size(max = 20) List<@NotNull @Valid BookingItemSelection> items,
        @Positive Long vehicleId,
        @Valid NewVehicleInput newVehicle,
        @Valid GuestContactInput guest,
        @Valid GuestVehicleInput guestVehicle,
        @Positive Long voucherId,
        @Size(max = 500) String note) implements StrictBookingJsonInput {

    public CreateBookingV2Request {
        items = items == null ? null : List.copyOf(items);
    }

    @Override
    public String toString() {
        return "CreateBookingV2Request[branchId=" + branchId
                + ", startAt=" + startAt
                + ", itemCount=" + (items == null ? 0 : items.size())
                + ", sensitiveFields=REDACTED]";
    }
}
