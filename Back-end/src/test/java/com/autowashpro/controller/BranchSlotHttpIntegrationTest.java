package com.autowashpro.controller;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.booking.AlternativeSlotResponse;
import com.autowashpro.dto.booking.SlotAvailabilityResponse;
import com.autowashpro.dto.booking.SlotOptionResponse;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.service.BookingAvailabilityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BranchSlotHttpIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private BookingAvailabilityService availability;

    @MockitoBean
    private BranchRepository branches;

    @Test
    void canonicalEndpoint_isPublicAndReturnsStableUtcContract() throws Exception {
        when(availability.findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), eq(List.of(7L)), eq(List.of(4)),
                eq(999), eq(Instant.parse("2026-07-25T03:00:00Z")), eq(null)))
                .thenReturn(response());

        mvc.perform(get("/api/v1/branches/41/slots")
                        .param("date", "2026-07-25")
                        .param("serviceIds", "7")
                        .param("quantities", "4")
                        .param("duration", "999")
                        .param("startAt", "2026-07-25T03:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeZone").value("Asia/Ho_Chi_Minh"))
                .andExpect(jsonPath("$.slotMinutes").value(15))
                .andExpect(jsonPath("$.durationDerivedFromCatalog").value(true))
                .andExpect(jsonPath("$.slots[0].startAt").value("2026-07-25T03:00:00Z"))
                .andExpect(jsonPath("$.slots[0].state").value("FULL"))
                .andExpect(jsonPath("$.alternatives.length()").value(3))
                .andExpect(jsonPath("$.branch.branchName").doesNotExist())
                .andExpect(jsonPath("$.slots[0].bayId").doesNotExist());
    }

    @Test
    void invalidCatalogSelection_usesUnifiedErrorShape() throws Exception {
        when(availability.findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(), eq(null)))
                .thenThrow(new BadRequestException("One or more services are invalid."));

        mvc.perform(get("/api/v1/branches/41/slots")
                        .param("date", "2026-07-25")
                        .param("serviceIds", "999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.path").value("/api/v1/branches/41/slots"));
    }

    @Test
    void customerBearer_derivesTierIdentityFromSignedSubject() throws Exception {
        String token = jwtTokenProvider.generateToken(42_001L, "+84900042001", "CUSTOMER");
        when(availability.findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(),
                eq(42_001L))).thenReturn(response());

        mvc.perform(get("/api/v1/branches/41/slots")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("date", "2026-07-25")
                        .param("serviceIds", "7"))
                .andExpect(status().isOk());

        verify(availability).findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(),
                eq(42_001L));
    }

    @Test
    void staffAndAdminBearer_receiveGuestBookingWindowPolicy() throws Exception {
        when(availability.findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(),
                eq(null))).thenReturn(response());

        for (String role : List.of("STAFF", "ADMIN")) {
            String token = jwtTokenProvider.generateToken(
                    "STAFF".equals(role) ? 43_001L : 43_002L,
                    "+8490004300" + ("STAFF".equals(role) ? "1" : "2"), role);
            mvc.perform(get("/api/v1/branches/41/slots")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .param("date", "2026-07-25")
                            .param("serviceIds", "7"))
                    .andExpect(status().isOk());
        }

        verify(availability, times(2)).findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(),
                eq(null));
    }

    @Test
    void malformedBearer_isRejectedInsteadOfDowngradedToGuestPolicy() throws Exception {
        mvc.perform(get("/api/v1/branches/41/slots")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                        .param("date", "2026-07-25")
                        .param("serviceIds", "7"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        verify(availability, never()).findByServiceIds(
                any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void branchCollection_isPublicMinimizedAndIncludesBookingNotice() throws Exception {
        Branch branch = new Branch();
        branch.setBranchId(41L);
        branch.setBranchName("Tân Phú");
        branch.setAddress("87 Tân Thắng");
        branch.setPhone("0280000000");
        branch.setOpenTime(java.time.LocalTime.of(7, 0));
        branch.setCloseTime(java.time.LocalTime.of(18, 0));
        branch.setBookingEnabled(false);
        branch.setBookingNotice("Maintenance");
        branch.setSlotMinutes(15);
        when(branches.findByStatusIgnoreCaseOrderByBranchNameAsc("ACTIVE"))
                .thenReturn(List.of(branch));

        mvc.perform(get("/api/v1/branches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].branchId").value(41))
                .andExpect(jsonPath("$[0].bookingEnabled").value(false))
                .andExpect(jsonPath("$[0].bookingNotice").value("Maintenance"))
                .andExpect(jsonPath("$[0].status").doesNotExist())
                .andExpect(jsonPath("$[0].bays").doesNotExist());
    }

    @Test
    void repeatedPublicPolling_isBoundedWithRetryAfter() throws Exception {
        when(availability.findByServiceIds(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), any(), any(), any(), any(), eq(null)))
                .thenReturn(response());

        for (int attempt = 0; attempt < 180; attempt++) {
            mvc.perform(get("/api/v1/branches/41/slots")
                            .with(request -> {
                                request.setRemoteAddr("192.0.2.88");
                                return request;
                            })
                            .param("date", "2026-07-25")
                            .param("serviceIds", "7"))
                    .andExpect(status().isOk());
        }

        mvc.perform(get("/api/v1/branches/41/slots")
                        .with(request -> {
                            request.setRemoteAddr("192.0.2.88");
                            return request;
                        })
                        .param("date", "2026-07-25")
                        .param("serviceIds", "7"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void deprecatedAvailabilityAdapter_isAlsoRateLimited() throws Exception {
        when(availability.findByServiceCodes(
                eq(41L), eq(LocalDate.of(2026, 7, 25)), eq(List.of("WASH")),
                eq(null), eq(null))).thenReturn(response());

        for (int attempt = 0; attempt < 180; attempt++) {
            mvc.perform(get("/api/v1/bookings/availability")
                            .with(request -> {
                                request.setRemoteAddr("192.0.2.89");
                                return request;
                            })
                            .param("branchId", "41")
                            .param("date", "2026-07-25")
                            .param("serviceCodes", "WASH"))
                    .andExpect(status().isOk());
        }

        mvc.perform(get("/api/v1/bookings/availability")
                        .with(request -> {
                            request.setRemoteAddr("192.0.2.89");
                            return request;
                        })
                        .param("branchId", "41")
                        .param("date", "2026-07-25")
                        .param("serviceCodes", "WASH"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    private SlotAvailabilityResponse response() {
        Instant selected = Instant.parse("2026-07-25T03:00:00Z");
        List<AlternativeSlotResponse> alternatives = List.of(
                new AlternativeSlotResponse(Instant.parse("2026-07-25T03:15:00Z"),
                        Instant.parse("2026-07-25T04:45:00Z"), 1),
                new AlternativeSlotResponse(Instant.parse("2026-07-25T03:30:00Z"),
                        Instant.parse("2026-07-25T05:00:00Z"), 2),
                new AlternativeSlotResponse(Instant.parse("2026-07-25T03:45:00Z"),
                        Instant.parse("2026-07-25T05:15:00Z"), 2));
        return new SlotAvailabilityResponse(
                41L, LocalDate.of(2026, 7, 25), "Asia/Ho_Chi_Minh", 15,
                "SLOT", 80, 5, 85, 6, 90, 90, 7,
                true, null, true,
                List.of(new SlotOptionResponse(
                        selected, selected.plusSeconds(90 * 60L),
                        "FULL", "CAPACITY_FULL", false, 0)), alternatives);
    }
}
