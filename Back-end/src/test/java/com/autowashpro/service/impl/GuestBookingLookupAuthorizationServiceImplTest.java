package com.autowashpro.service.impl;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.service.GuestVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestBookingLookupAuthorizationServiceImplTest {

    @Mock
    private GuestVerificationService guestVerificationService;

    @Mock
    private BookingRepository bookingRepository;

    private GuestBookingLookupAuthorizationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestBookingLookupAuthorizationServiceImpl(guestVerificationService, bookingRepository);
    }

    @Test
    void authorize_validProofAndMatchingGuest_returnsBooking() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        Guest guest = new Guest();
        guest.setPhone("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-ABC12345");
        booking.setGuest(guest);
        when(bookingRepository.findByBookingRef("AWP-ABC12345")).thenReturn(Optional.of(booking));

        Booking result = service.authorize("AWP-ABC12345", "token-1");

        assertThat(result).isSameAs(booking);
    }

    @Test
    void authorize_unknownBookingRef_throwsResourceNotFound() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        when(bookingRepository.findByBookingRef("AWP-MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.authorize("AWP-MISSING", "token-1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void authorize_proofPhoneDoesNotMatchBookingGuestPhone_throwsForbidden() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84909999999");
        Guest guest = new Guest();
        guest.setPhone("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-ABC12345");
        booking.setGuest(guest);
        when(bookingRepository.findByBookingRef("AWP-ABC12345")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.authorize("AWP-ABC12345", "token-1"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void authorize_bookingBelongsToMemberNotGuest_throwsForbidden() {
        when(guestVerificationService.consumeProofForLookup("token-1", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .thenReturn("+84901234567");
        Booking booking = new Booking();
        booking.setBookingRef("AWP-MEMBER01");
        booking.setGuest(null);
        when(bookingRepository.findByBookingRef("AWP-MEMBER01")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.authorize("AWP-MEMBER01", "token-1"))
                .isInstanceOf(ForbiddenException.class);
    }
}
