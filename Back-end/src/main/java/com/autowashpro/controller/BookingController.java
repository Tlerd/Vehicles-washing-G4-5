package com.autowashpro.controller;

import com.autowashpro.dto.booking.*;
import com.autowashpro.entity.*;
import com.autowashpro.repository.*;
import com.autowashpro.service.BookingManagementService;
import com.autowashpro.service.BookingLookupService;
import com.autowashpro.service.BookingAvailabilityService;
import com.autowashpro.service.RateLimiter;
import com.autowashpro.dto.response.BookingLookupResponse;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import com.autowashpro.dto.response.ApiErrorResponse;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor
public class BookingController {
    private static final int LOOKUP_ORIGIN_MAX_ATTEMPTS = 60;
    private static final Duration LOOKUP_ORIGIN_WINDOW = Duration.ofMinutes(15);
    private static final int LOOKUP_GLOBAL_MAX_ATTEMPTS = 5_000;
    private static final Duration LOOKUP_GLOBAL_WINDOW = Duration.ofMinutes(1);
    private static final int LOOKUP_CUSTOMER_MAX_ATTEMPTS = 60;
    private static final Duration LOOKUP_CUSTOMER_WINDOW = Duration.ofMinutes(15);
    private static final String LOOKUP_RATE_LIMIT_ERROR =
            "Too many verification requests. Please try again later.";
    private static final int AVAILABILITY_ORIGIN_MAX_ATTEMPTS = 180;
    private static final int AVAILABILITY_PRINCIPAL_MAX_ATTEMPTS = 300;
    private static final int AVAILABILITY_GLOBAL_MAX_ATTEMPTS = 10_000;
    private static final Duration AVAILABILITY_WINDOW = Duration.ofMinutes(1);
    private static final String AVAILABILITY_RATE_LIMIT_ERROR =
            "Too many availability requests. Please try again later.";

    private final BookingManagementService bookings;
    private final BranchRepository branches;
    private final ServiceRepository services;
    private final BookingLookupService bookingLookupService;
    private final BookingAvailabilityService availabilityService;
    private final RateLimiter rateLimiter;

    @GetMapping("/catalog/branches") public List<Branch> branches() { return branches.findByStatusIgnoreCase("ACTIVE"); }
    @GetMapping("/catalog/services") public List<com.autowashpro.entity.Service> services() { return services.findByStatusIgnoreCase("ACTIVE"); }
    @PostMapping("/bookings") public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest r,@AuthenticationPrincipal String callerId) { r.setCustomerId(Long.valueOf(callerId)); return ResponseEntity.status(HttpStatus.CREATED).body(bookings.create(r)); }
    @GetMapping("/bookings/{bookingRef:AWP-[A-Z0-9]{6,8}}")
    @Operation(
            summary = "Look up an owner-visible booking",
            description = "Use either a customer JWT or a single-use guest verification proof. Guest lookup consumes the proof even when the reference is absent or belongs to another guest.",
            security = {
                    @SecurityRequirement(name = "bearerAuth"),
                    @SecurityRequirement(name = "guestVerificationProof")
            })
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Owner-safe booking summary"),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, wrong-purpose, or replayed proof",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Bearer token or proof is required or invalid",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "The authenticated identity does not own the booking",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Booking reference not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Proof-consumption rate limit exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<BookingLookupResponse> lookup(
            @PathVariable String bookingRef,
            @RequestHeader(value = "X-Guest-Verification-Proof", required = false) String guestProof,
            Authentication authentication,
            HttpServletRequest request) {
        if (isCustomer(authentication)) {
            enforceCustomerLookupRateLimit(authentication.getName());
        } else if (!isAuthenticatedBearer(authentication)) {
            enforcePublicLookupRateLimits(request.getRemoteAddr());
        }
        return ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(bookingLookupService.lookup(bookingRef, authentication, guestProof));
    }
    @GetMapping("/bookings/availability")
    @Operation(
            summary = "Deprecated service-code availability adapter",
            description = "Delegates to the trusted 15-minute bay-capacity engine. New clients use " +
                    "GET /api/v1/branches/{branchId}/slots.",
            deprecated = true)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compatibility slot list"),
            @ApiResponse(responseCode = "400", description = "Invalid service selection",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Active branch not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Availability polling quota exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<LegacyAvailabilitySlotResponse> availability(
            @RequestParam Long branchId,
            @RequestParam LocalDate date,
            @RequestParam List<String> serviceCodes,
            Authentication authentication,
            HttpServletRequest request) {
        enforceAvailabilityRateLimit(authentication, request);
        SlotAvailabilityResponse response = availabilityService.findByServiceCodes(
                branchId, date, serviceCodes, null,
                BranchSlotController.authenticatedCustomerId(authentication));
        return response.slots().stream()
                .map(slot -> new LegacyAvailabilitySlotResponse(
                        LocalDateTime.ofInstant(slot.startAt(), BookingAvailabilityService.BUSINESS_ZONE).toLocalTime(),
                        LocalDateTime.ofInstant(slot.endAt(), BookingAvailabilityService.BUSINESS_ZONE).toLocalTime(),
                        response.reservedMinutes(), slot.available()))
                .toList();
    }
    @GetMapping("/bookings/customer/{customerId}") public List<BookingResponse> customer(@PathVariable Long customerId,@AuthenticationPrincipal String callerId) { return bookings.customerBookings(Long.valueOf(callerId)); }
    @GetMapping("/washing-counter/queue") public List<BookingResponse> queue(@RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}") LocalDate date) { return bookings.queue(date); }
    @PatchMapping("/washing-counter/bookings/{id}/status") public BookingResponse status(@PathVariable Long id, @Valid @RequestBody StatusRequest r) { return bookings.transition(id, r.getStatus()); }

    private boolean isAuthenticatedBearer(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }

    private boolean isCustomer(Authentication authentication) {
        return isAuthenticatedBearer(authentication)
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_CUSTOMER".equals(authority.getAuthority()));
    }

    private void enforceAvailabilityRateLimit(
            Authentication authentication, HttpServletRequest request) {
        if (isAuthenticatedBearer(authentication)) {
            if (!rateLimiter.tryConsume(
                    RateLimiter.Scope.AUTHENTICATED_PRINCIPAL,
                    "availability:" + authentication.getName(),
                    AVAILABILITY_PRINCIPAL_MAX_ATTEMPTS, AVAILABILITY_WINDOW)) {
                throw new TooManyRequestsException(AVAILABILITY_RATE_LIMIT_ERROR);
            }
            return;
        }
        String remoteAddress = request.getRemoteAddr();
        String key = "availability:"
                + (remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress);
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.REQUEST_ORIGIN, key,
                AVAILABILITY_ORIGIN_MAX_ATTEMPTS, AVAILABILITY_WINDOW)) {
            throw new TooManyRequestsException(AVAILABILITY_RATE_LIMIT_ERROR);
        }
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL, "availability",
                AVAILABILITY_GLOBAL_MAX_ATTEMPTS, AVAILABILITY_WINDOW)) {
            throw new TooManyRequestsException(AVAILABILITY_RATE_LIMIT_ERROR);
        }
    }

    private void enforcePublicLookupRateLimits(String remoteAddress) {
        boolean originAllowed = rateLimiter.tryConsume(
                RateLimiter.Scope.REQUEST_ORIGIN,
                "guest-booking-lookup|" + remoteAddress,
                LOOKUP_ORIGIN_MAX_ATTEMPTS,
                LOOKUP_ORIGIN_WINDOW);
        if (!originAllowed) {
            throw new TooManyRequestsException(LOOKUP_RATE_LIMIT_ERROR, 900);
        }
        boolean globallyAllowed = rateLimiter.tryConsume(
                RateLimiter.Scope.PUBLIC_ENDPOINT_GLOBAL,
                "guest-booking-lookup",
                LOOKUP_GLOBAL_MAX_ATTEMPTS,
                LOOKUP_GLOBAL_WINDOW);
        if (!globallyAllowed) {
            throw new TooManyRequestsException(LOOKUP_RATE_LIMIT_ERROR, 60);
        }
    }

    private void enforceCustomerLookupRateLimit(String principalId) {
        if (!rateLimiter.tryConsume(
                RateLimiter.Scope.AUTHENTICATED_PRINCIPAL,
                "customer-booking-lookup|" + principalId,
                LOOKUP_CUSTOMER_MAX_ATTEMPTS,
                LOOKUP_CUSTOMER_WINDOW)) {
            throw new TooManyRequestsException(LOOKUP_RATE_LIMIT_ERROR, 900);
        }
    }
}
