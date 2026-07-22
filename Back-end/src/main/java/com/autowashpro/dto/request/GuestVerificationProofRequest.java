package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Firebase-verified phone identity used to issue a short-lived guest proof.")
public record GuestVerificationProofRequest(
        @NotBlank(message = "Phone is required.")
        @Size(max = 25, message = "Phone is too long.")
        @Pattern(regexp = "^[+0-9][0-9\\s().-]{7,24}$", message = "Phone format is invalid.")
        @Schema(example = "0901234567")
        String phone,

        @NotBlank(message = "Firebase ID token is required.")
        @Size(max = 8192, message = "Firebase ID token is too long.")
        @Schema(description = "Firebase ID token returned after successful Phone OTP verification")
        String firebaseIdToken) {
}
