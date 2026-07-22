package com.autowashpro.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "autowash.cors.allowed-origins=https://app.example.test")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndCorsIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void unauthenticatedProtectedEndpoint_usesStableJson401() throws Exception {
        mvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.path").value("/api/v1/bookings"))
                .andExpect(jsonPath("$.violations").isArray());
    }

    @Test
    void authenticatedWrongRole_usesStableJson403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(999_001L, "+84900000001", "STAFF");

        mvc.perform(get("/api/v1/vehicles")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.path").value("/api/v1/vehicles"));
    }

    @Test
    void malformedBearerOnPublicEndpoint_isRejectedInsteadOfDowngradedToAnonymous() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer definitely-not-a-jwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"0901234567\",\"password\":\"irrelevant\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void configuredOrigin_preflightAllowsOnlyRequiredContract() throws Exception {
        mvc.perform(options("/api/v1/bookings")
                        .header(HttpHeaders.ORIGIN, "https://app.example.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "authorization,content-type,idempotency-key,x-guest-verification-proof"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://app.example.test"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        org.hamcrest.Matchers.containsStringIgnoringCase("authorization")))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        org.hamcrest.Matchers.containsStringIgnoringCase("idempotency-key")))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        org.hamcrest.Matchers.containsStringIgnoringCase("x-guest-verification-proof")));
    }

    @Test
    void hostileOrigin_preflightIsRejected() throws Exception {
        mvc.perform(options("/api/v1/bookings")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void futureAuthAndProofRoutes_areNotImplicitlyPublic() throws Exception {
        mvc.perform(post("/api/v1/auth/future-endpoint").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mvc.perform(post("/api/v1/guest-verification-proofs/future-endpoint")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
