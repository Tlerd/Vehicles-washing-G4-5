package com.autowashpro.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
        title = "AutoWash Pro API",
        version = "v1",
        description = "Backend contract for customer, guest, staff, and administrator workflows."))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "JWT returned by the phone-and-password login endpoint.")
@SecurityScheme(
        name = "guestVerificationProof",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.HEADER,
        paramName = "X-Guest-Verification-Proof",
        description = "Short-lived, single-use proof issued after backend-verified Firebase Phone OTP.")
public class OpenApiConfig {
}
