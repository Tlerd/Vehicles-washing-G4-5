package com.autowashpro.service;

import com.autowashpro.exception.custom.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AvailabilityRequestLimiter {

    private static final int PUBLIC_ORIGIN_ATTEMPTS_PER_MINUTE = 180;
    private static final int AUTHENTICATED_ATTEMPTS_PER_MINUTE = 300;
    private static final int GLOBAL_ATTEMPTS_PER_MINUTE = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final String MESSAGE = "Too many availability requests. Please try again later.";

    private final RateLimiter rateLimiter;

    public AvailabilityRequestLimiter(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    public void enforce(Authentication authentication, HttpServletRequest request) {
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            if (!rateLimiter.tryConsume(
                    RateLimiter.Scope.AUTHENTICATED_PRINCIPAL,
                    "availability:" + authentication.getName(),
                    AUTHENTICATED_ATTEMPTS_PER_MINUTE, WINDOW)) {
                throw new TooManyRequestsException(MESSAGE);
            }
            return;
        }

        String remoteAddress = request.getRemoteAddr();
        String originKey = "availability:"
                + (remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress);
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.REQUEST_ORIGIN, originKey,
                PUBLIC_ORIGIN_ATTEMPTS_PER_MINUTE, WINDOW)) {
            throw new TooManyRequestsException(MESSAGE);
        }
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL, "availability",
                GLOBAL_ATTEMPTS_PER_MINUTE, WINDOW)) {
            throw new TooManyRequestsException(MESSAGE);
        }
    }
}
