package com.autowashpro.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuestContactInput(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Size(max = 30) String phone,
        @Size(max = 150) String email) implements StrictBookingJsonInput {

    @Override
    public String toString() {
        return "GuestContactInput[REDACTED]";
    }
}
