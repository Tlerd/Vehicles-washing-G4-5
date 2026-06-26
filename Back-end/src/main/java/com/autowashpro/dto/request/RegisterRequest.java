package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Customer full name", example = "John Doe")
    private String name;

    @NotBlank
    @Schema(description = "Phone number in E.164 format", example = "+84901234567")
    private String phone;

    @NotBlank
    @Size(min = 6, max = 100)
    @Schema(description = "Account password", example = "secret123")
    private String password;

    @Email
    @Size(max = 100)
    @Schema(description = "Optional email address", example = "john@example.com")
    private String email;
}
