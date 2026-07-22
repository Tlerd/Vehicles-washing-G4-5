package com.autowashpro.controller;

import com.autowashpro.dto.request.GuestVerificationProofRequest;
import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.service.GuestVerificationService;
import com.autowashpro.service.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.autowashpro.dto.response.ApiErrorResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/guest-verification-proofs")
@Tag(name = "Guest verification", description = "Server-verified, short-lived proofs for guest operations")
public class GuestVerificationProofController {

    private static final int ORIGIN_MAX_ATTEMPTS = 30;
    private static final Duration ORIGIN_WINDOW = Duration.ofMinutes(15);
    private static final String RATE_LIMIT_MESSAGE =
            "Too many verification requests. Please try again later.";

    private final GuestVerificationService guestVerificationService;
    private final RateLimiter rateLimiter;

    public GuestVerificationProofController(
            GuestVerificationService guestVerificationService, RateLimiter rateLimiter) {
        this.guestVerificationService = guestVerificationService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/booking")
    @Operation(summary = "Issue a guest-booking proof",
            description = "Verifies the Firebase Phone OTP identity on the server and returns a five-minute, single-use proof.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Proof issued"),
            @ApiResponse(responseCode = "400", description = "Invalid phone, request, or Firebase identity",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Verification rate limit exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<VerificationProofResponse> issueBookingProof(
            @Valid @RequestBody GuestVerificationProofRequest request,
            HttpServletRequest httpRequest) {
        return issue(request, httpRequest, VerificationPurpose.GUEST_BOOKING);
    }

    @PostMapping("/booking-lookup")
    @Operation(summary = "Issue a guest booking-lookup proof",
            description = "Verifies the Firebase Phone OTP identity on the server and returns a five-minute, single-use lookup proof.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Proof issued"),
            @ApiResponse(responseCode = "400", description = "Invalid phone, request, or Firebase identity",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Verification rate limit exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<VerificationProofResponse> issueLookupProof(
            @Valid @RequestBody GuestVerificationProofRequest request,
            HttpServletRequest httpRequest) {
        return issue(request, httpRequest, VerificationPurpose.GUEST_BOOKING_LOOKUP);
    }

    private ResponseEntity<VerificationProofResponse> issue(
            GuestVerificationProofRequest request, HttpServletRequest httpRequest,
            VerificationPurpose purpose) {
        String source = httpRequest.getRemoteAddr() == null ? "unknown" : httpRequest.getRemoteAddr();
        if (!rateLimiter.tryConsume(RateLimiter.Scope.REQUEST_ORIGIN,
                "guest-proof|" + purpose + "|" + source, ORIGIN_MAX_ATTEMPTS, ORIGIN_WINDOW)) {
            throw new TooManyRequestsException(RATE_LIMIT_MESSAGE, 900);
        }
        VerificationProofResponse response = guestVerificationService.issueProof(
                request.phone(), request.firebaseIdToken(), purpose);
        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(response);
    }
}
