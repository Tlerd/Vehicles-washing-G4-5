package com.autowashpro.exception.handler;

import com.autowashpro.exception.custom.ForbiddenException;
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
}
