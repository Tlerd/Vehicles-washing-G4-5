package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank
    @Schema(description = "Phone number in E.164 format", example = "+84901234567")
    private String phone;

    @NotBlank
    @Size(min = 6, max = 100)
    @Schema(description = "Account password", format = "password")
    private String password;
}
