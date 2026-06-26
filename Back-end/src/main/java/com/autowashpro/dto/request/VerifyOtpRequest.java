package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpRequest {

    @NotBlank
    @Schema(description = "Phone number in E.164 format", example = "+84901234567")
    private String phoneNumber;

    @NotBlank
    @Size(min = 6, max = 6)
    @Pattern(regexp = "^[0-9]{6}$")
    @Schema(description = "Six-digit OTP code", example = "123456")
    private String code;
}
