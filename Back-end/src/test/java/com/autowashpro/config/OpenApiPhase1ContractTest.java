package com.autowashpro.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiPhase1ContractTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void openApi_documentsGuestProofAndLookupSecurityContracts() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type").value("http"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.components.securitySchemes.guestVerificationProof.type").value("apiKey"))
                .andExpect(jsonPath("$.components.securitySchemes.guestVerificationProof.name")
                        .value("X-Guest-Verification-Proof"))
                .andExpect(jsonPath("$.paths['/api/v1/guest-verification-proofs/booking'].post.responses['201']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/guest-verification-proofs/booking-lookup'].post.responses['201']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/guest-verification-proofs/booking-lookup'].post.responses['400']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/guest-verification-proofs/booking-lookup'].post.responses['429']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.responses['200']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.responses['400']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.responses['401']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.responses['403']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.responses['404']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/{bookingRef}'].get.security.length()").value(2))
                .andExpect(jsonPath("$.components.schemas.ApiErrorResponse.properties.code").exists())
                .andExpect(jsonPath("$.components.schemas.ApiErrorResponse.properties.path").exists())
                .andExpect(jsonPath("$.components.schemas.ApiErrorResponse.properties.violations").exists());
    }
}
