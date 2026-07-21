package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class VerificationProofResponse {

    @Schema(description = "Opaque, single-use verification proof token")
    private String proofToken;

    @Schema(description = "Timestamp after which the proof is no longer valid")
    private LocalDateTime expiresAt;
}
