package com.autowashpro.dto.booking;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

public record SlotOptionResponse(
        @Schema(example = "2026-07-25T03:00:00Z") Instant startAt,
        @Schema(example = "2026-07-25T03:45:00Z") Instant endAt,
        @Schema(description = "AVAILABLE, LIMITED, FULL, or UNAVAILABLE", example = "AVAILABLE") String state,
        @Schema(nullable = true, example = "CAPACITY_FULL") String reason,
        boolean available,
        @Schema(description = "Compatible bays free for every required consecutive slot.", example = "2")
        int availableBayCount
) {
}
