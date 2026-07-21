package com.autowashpro.exception.handler;

import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.TooManyRequestsException;
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
    }

    @Test
    void handleTooManyRequests_returnsHttp429() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleTooManyRequests(new TooManyRequestsException("Too many verification requests. Please try again later."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).containsEntry("success", false);
        assertThat(response.getBody()).containsEntry("error", "Too many verification requests. Please try again later.");
    }
}
