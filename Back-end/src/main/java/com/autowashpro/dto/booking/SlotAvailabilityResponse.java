package com.autowashpro.dto.booking;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Server-derived 15-minute capacity for one branch business day.")
public record SlotAvailabilityResponse(
        Long branchId,
        LocalDate date,
        @Schema(example = "Asia/Ho_Chi_Minh") String timeZone,
        @Schema(example = "15") int slotMinutes,
        @Schema(example = "SLOT") String bookingMode,
        int workMinutes,
        int bufferMinutes,
        int occupiedMinutes,
        int requiredSlots,
        int reservedMinutes,
        int minimumAdvanceMinutes,
        int bookingWindowDays,
        boolean bookingEnabled,
        String bookingNotice,
        boolean durationDerivedFromCatalog,
        List<SlotOptionResponse> slots,
        List<AlternativeSlotResponse> alternatives
) {
    public SlotAvailabilityResponse {
        slots = slots == null ? List.of() : List.copyOf(slots);
        alternatives = alternatives == null ? List.of() : List.copyOf(alternatives);
    }
}
