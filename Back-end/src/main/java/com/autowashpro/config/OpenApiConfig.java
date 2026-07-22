package com.autowashpro.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springdoc.core.customizers.OpenApiCustomizer;

import java.util.List;

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

    @Bean
    OpenApiCustomizer optionalAvailabilityAuthentication() {
        return openApi -> List.of(
                        "/api/v1/branches",
                        "/api/v1/branches/{branchId}/slots",
                        "/api/v1/bookings/availability")
                .forEach(path -> {
                    io.swagger.v3.oas.models.PathItem item = openApi.getPaths().get(path);
                    if (item != null && item.getGet() != null) {
                        item.getGet().setSecurity(List.of(
                                new io.swagger.v3.oas.models.security.SecurityRequirement(),
                                new io.swagger.v3.oas.models.security.SecurityRequirement()
                                        .addList("bearerAuth")));
                    }
                });
    }
}
