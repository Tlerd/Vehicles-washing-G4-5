package com.autowashpro.controller;

import com.autowashpro.dto.booking.BranchSummaryResponse;
import com.autowashpro.dto.response.ApiErrorResponse;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.service.AvailabilityRequestLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
public class BranchCatalogController {

    private final BranchRepository branches;
    private final AvailabilityRequestLimiter requestLimiter;

    public BranchCatalogController(
            BranchRepository branches, AvailabilityRequestLimiter requestLimiter) {
        this.branches = branches;
        this.requestLimiter = requestLimiter;
    }

    @GetMapping
    @Operation(summary = "List active booking branches",
            description = "Returns public branch schedules and booking notices without JPA entities.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Active branch summaries"),
            @ApiResponse(responseCode = "401", description = "An explicitly supplied bearer token is invalid",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Availability polling quota exceeded",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<BranchSummaryResponse> branches(
            Authentication authentication, HttpServletRequest request) {
        requestLimiter.enforce(authentication, request);
        return branches.findByStatusIgnoreCaseOrderByBranchNameAsc("ACTIVE").stream()
                .map(BranchSummaryResponse::from)
                .toList();
    }
}
