package com.autowashpro.dto.booking;

import com.autowashpro.entity.VehicleSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GuestVehicleInput(
        @NotBlank @Size(max = 20) String licensePlate,
        @NotBlank @Size(max = 50) String brand,
        @NotNull VehicleSize vehicleSize) implements StrictBookingJsonInput {

    @Override
    public String toString() {
        return "GuestVehicleInput[REDACTED]";
    }
}
