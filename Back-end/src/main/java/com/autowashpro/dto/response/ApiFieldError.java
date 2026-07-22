package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "One validation violation. Rejected input values are intentionally omitted.")
public record ApiFieldError(
        @Schema(example = "phone") String field,
        @Schema(example = "Phone is required.") String message) {
}
