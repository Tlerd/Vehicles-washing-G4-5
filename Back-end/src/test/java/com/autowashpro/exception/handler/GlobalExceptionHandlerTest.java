package com.autowashpro.exception.handler;

import com.autowashpro.exception.custom.ForbiddenException;
<<<<<<< HEAD
import com.autowashpro.exception.custom.TooManyRequestsException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ErrorProbeController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void forbidden_usesStableErrorContract() throws Exception {
        mvc.perform(get("/test-errors/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("You cannot access this resource."))
                .andExpect(jsonPath("$.path").value("/test-errors/forbidden"))
                .andExpect(jsonPath("$.violations").isArray());
    }

    @Test
    void validation_returnsEveryFieldWithoutRejectedValues() throws Exception {
        mvc.perform(post("/test-errors/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"phone\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.violations.length()").value(2))
                .andExpect(jsonPath("$.violations[*].field").exists())
                .andExpect(jsonPath("$.violations[*].message").exists())
                .andExpect(jsonPath("$.violations[*].rejectedValue").doesNotExist());
    }

    @Test
    void malformedJson_isSafeBadRequest() throws Exception {
        mvc.perform(post("/test-errors/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.message").value("The request body is malformed."));
    }

    @Test
    void tooManyRequests_setsRetryAfter() throws Exception {
        mvc.perform(get("/test-errors/rate-limit"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void tooManyRequests_usesTheApplicableRetryWindow() throws Exception {
        mvc.perform(get("/test-errors/rate-limit-long"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "900"));
    }

    @Test
    void unexpectedFailure_doesNotExposeInternalMessage() throws Exception {
        mvc.perform(get("/test-errors/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred. Please try again later."))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("database-password"))));
    }

    @RestController
    @RequestMapping("/test-errors")
    static class ErrorProbeController {
        @GetMapping("/forbidden")
        void forbidden() {
            throw new ForbiddenException("You cannot access this resource.");
        }

        @PostMapping("/validate")
        void validate(@Valid @RequestBody ValidationProbe request) {
        }

        @GetMapping("/rate-limit")
        void rateLimit() {
            throw new TooManyRequestsException("Too many requests.");
        }

        @GetMapping("/rate-limit-long")
        void longRateLimit() {
            throw new TooManyRequestsException("Too many requests.", 900);
        }

        @GetMapping("/unexpected")
        void unexpected() {
            throw new IllegalStateException("database-password should never be exposed");
        }
    }

    record ValidationProbe(@NotBlank(message = "Name is required.") String name,
                           @NotBlank(message = "Phone is required.") String phone) {
=======
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleForbidden_returnsHttp403() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleForbidden(new ForbiddenException("Unauthorized vehicle access or vehicle not found."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
    }
}
