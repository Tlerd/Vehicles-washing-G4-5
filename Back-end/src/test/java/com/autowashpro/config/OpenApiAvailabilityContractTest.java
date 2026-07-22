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
class OpenApiAvailabilityContractTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void openApi_documentsCanonicalAndDeprecatedAvailabilityContracts() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.responses['200']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.responses['400']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.responses['404']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.responses['429']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.security.length()").value(2))
                .andExpect(jsonPath("$.paths['/api/v1/branches/{branchId}/slots'].get.security[1].bearerAuth").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches'].get.responses['200']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/branches'].get.responses['429']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/bookings/availability'].get.deprecated").value(true))
                .andExpect(jsonPath("$.components.schemas.SlotAvailabilityResponse.properties.slots").exists())
                .andExpect(jsonPath("$.components.schemas.SlotOptionResponse.properties.availableBayCount").exists());
    }
}
