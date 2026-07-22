package com.autowashpro.service.impl;

import com.autowashpro.dto.response.BookingLookupResponse;
import com.autowashpro.entity.Booking;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.exception.custom.UnauthorizedException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.service.BookingLookupService;
import com.autowashpro.service.GuestBookingLookupAuthorizationService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class BookingLookupServiceImpl implements BookingLookupService {

    private static final String NOT_FOUND = "Booking not found.";
    private static final String FORBIDDEN = "You are not authorized to view this booking.";

    private final BookingRepository bookingRepository;
    private final GuestBookingLookupAuthorizationService guestAuthorization;

    public BookingLookupServiceImpl(BookingRepository bookingRepository,
                                    GuestBookingLookupAuthorizationService guestAuthorization) {
        this.bookingRepository = bookingRepository;
        this.guestAuthorization = guestAuthorization;
    }

    @Override
    public BookingLookupResponse lookup(
            String bookingRef, Authentication authentication, String guestProofToken) {
        Booking booking;
        if (hasBearerPrincipal(authentication)) {
            boolean customer = authentication.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_CUSTOMER".equals(authority.getAuthority()));
            if (!customer) {
                throw new ForbiddenException(FORBIDDEN);
            }
            long customerId;
            try {
                customerId = Long.parseLong(authentication.getName());
            } catch (NumberFormatException ex) {
                throw new ForbiddenException(FORBIDDEN);
            }
            booking = bookingRepository.findForLookupByBookingRef(bookingRef)
                    .orElseThrow(() -> new ResourceNotFoundException(NOT_FOUND));
            if (booking.getCustomer() == null
                    || !customerIdEquals(booking.getCustomer().getCustomerId(), customerId)) {
                throw new ForbiddenException(FORBIDDEN);
            }
        } else {
            if (guestProofToken == null || guestProofToken.isBlank()) {
                throw new UnauthorizedException("A bearer token or guest verification proof is required.");
            }
            booking = guestAuthorization.authorize(bookingRef, guestProofToken);
        }
        return toResponse(booking);
    }

    private boolean hasBearerPrincipal(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ANONYMOUS".equals(authority.getAuthority()));
    }

    private boolean customerIdEquals(Long actual, long expected) {
        return actual != null && actual == expected;
    }

    private BookingLookupResponse toResponse(Booking booking) {
        String licensePlate = booking.getVehicle() != null
                ? booking.getVehicle().getLicensePlate()
                : booking.getGuestLicensePlate();
        String vehicleBrand = booking.getVehicle() != null
                ? booking.getVehicle().getBrand()
                : booking.getGuestVehicleBrand();
        String vehicleSize = booking.getVehicle() != null && booking.getVehicle().getVehicleSize() != null
                ? booking.getVehicle().getVehicleSize().name()
                : booking.getGuestVehicleSize() != null
                ? booking.getGuestVehicleSize().name() : null;
        return new BookingLookupResponse(
                booking.getBookingRef(), booking.getStatus(), booking.getBranch().getBranchId(),
                booking.getBranch().getBranchName(), booking.getBranch().getAddress(),
                booking.getBookingDate(), booking.getBookingTime(), booking.getEndTime(),
                booking.getDurationMinutes(), booking.getTotalPrice(), licensePlate, vehicleBrand,
                vehicleSize, booking.getCreatedAt());
    }
}
