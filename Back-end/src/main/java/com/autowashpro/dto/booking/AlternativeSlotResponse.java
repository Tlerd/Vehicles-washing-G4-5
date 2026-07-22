package com.autowashpro.dto.booking;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

public record AlternativeSlotResponse(
        @Schema(example = "2026-07-25T03:00:00Z") Instant startAt,
        @Schema(example = "2026-07-25T03:45:00Z") Instant endAt,
        @Schema(example = "2") int availableBayCount
) {
}
