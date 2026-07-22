package com.autowashpro.controller;

import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.ServiceRepository;
import com.autowashpro.service.BookingLookupService;
import com.autowashpro.service.BookingManagementService;
import com.autowashpro.service.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingControllerRateLimitTest {

    @Test
    void blockedOrigin_doesNotContinueDrainingGlobalLookupQuota() {
        BookingLookupService lookup = mock(BookingLookupService.class);
        RateLimiter limiter = mock(RateLimiter.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        BookingController controller = new BookingController(
                mock(BookingManagementService.class), mock(BranchRepository.class),
                mock(ServiceRepository.class), lookup, limiter);
        AtomicInteger originAttempts = new AtomicInteger();

        when(request.getRemoteAddr()).thenReturn("192.0.2.55");
        when(limiter.tryConsume(eq(RateLimiter.Scope.REQUEST_ORIGIN), anyString(),
                eq(60), eq(Duration.ofMinutes(15))))
                .thenAnswer(ignored -> originAttempts.getAndIncrement() < 60);
        when(limiter.tryConsume(eq(RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL), anyString(),
                eq(5_000), eq(Duration.ofMinutes(1)))).thenReturn(true);
        when(lookup.lookup(anyString(), any(), any())).thenReturn(null);

        for (int i = 0; i < 60; i++) {
            assertThatCode(() -> controller.lookup("AWP-QZQZQZ", null, null, request))
                    .doesNotThrowAnyException();
        }
        for (int i = 0; i < 10; i++) {
            assertThatThrownBy(() -> controller.lookup("AWP-QZQZQZ", null, null, request))
                    .isInstanceOf(TooManyRequestsException.class);
        }

        verify(limiter, times(60)).tryConsume(
                eq(RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL), anyString(),
                eq(5_000), eq(Duration.ofMinutes(1)));
    }
}
