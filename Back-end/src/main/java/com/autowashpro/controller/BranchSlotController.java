package com.autowashpro.controller;

import com.autowashpro.dto.booking.SlotAvailabilityResponse;
import com.autowashpro.dto.response.ApiErrorResponse;
import com.autowashpro.service.BookingAvailabilityService;
import com.autowashpro.service.AvailabilityRequestLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@Validated
public class BranchSlotController {

    private final BookingAvailabilityService availability;
    private final AvailabilityRequestLimiter requestLimiter;

    public BranchSlotController(
            BookingAvailabilityService availability,
            AvailabilityRequestLimiter requestLimiter) {
        this.availability = availability;
        this.requestLimiter = requestLimiter;
    }

    @GetMapping("/{branchId}/slots")
    @Operation(
            summary = "Read 15-minute branch availability",
            description = "Public guest access uses a seven-day window. A valid customer JWT " +
                    "optionally extends the window from the server-owned tier. When serviceIds " +
                    "are present, duration is recalculated from trusted catalog values and the " +
                    "deprecated duration parameter is ignored. Timestamps are ISO 8601 UTC.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "All branch cells and derived capacity",
                    content = @Content(schema = @Schema(implementation = SlotAvailabilityResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid catalog selection, date, quantity, or duration",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "An explicitly supplied bearer token is invalid",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Active branch not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Availability polling quota exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public SlotAvailabilityResponse slots(
            @PathVariable Long branchId,
            @RequestParam LocalDate date,
            @Parameter(description = "Repeated or comma-separated service identifiers. Preferred over duration.")
            @RequestParam(required = false) List<Long> serviceIds,
            @Parameter(description = "Quantities positionally matched to serviceIds; defaults to one.")
            @RequestParam(required = false) List<Integer> quantities,
            @Parameter(description = "Deprecated compatibility duration. Used only when serviceIds are absent.",
                    deprecated = true)
            @RequestParam(required = false) Integer duration,
            @Parameter(description = "Optional UTC slot being evaluated; unavailable selections return later alternatives.")
            @RequestParam(required = false) Instant startAt,
            Authentication authentication,
            HttpServletRequest request) {
        requestLimiter.enforce(authentication, request);
        return availability.findByServiceIds(
                branchId, date, serviceIds, quantities, duration, startAt,
                authenticatedCustomerId(authentication));
    }

    static Long authenticatedCustomerId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getAuthorities().stream().noneMatch(
                authority -> "ROLE_CUSTOMER".equals(authority.getAuthority()))) {
            return null;
        }
        return Long.valueOf(authentication.getName());
    }
}
