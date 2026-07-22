package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Stable error response used by controllers and Spring Security.")
public record ApiErrorResponse(
        @Schema(example = "2026-07-22T01:00:00Z") Instant timestamp,
        @Schema(example = "403") int status,
        @Schema(example = "FORBIDDEN") String code,
        @Schema(example = "Forbidden") String error,
        @Schema(example = "You do not have permission to access this resource.") String message,
        @Schema(example = "/api/v1/bookings/AWP-1234ABCD") String path,
        List<ApiFieldError> violations) {

    public ApiErrorResponse {
        violations = violations == null ? List.of() : List.copyOf(violations);
    }
}
