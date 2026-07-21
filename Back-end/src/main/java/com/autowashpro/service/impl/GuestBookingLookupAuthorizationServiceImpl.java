package com.autowashpro.service.impl;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.service.GuestBookingLookupAuthorizationService;
import com.autowashpro.service.GuestVerificationService;
import org.springframework.stereotype.Service;

@Service
public class GuestBookingLookupAuthorizationServiceImpl implements GuestBookingLookupAuthorizationService {

    private final GuestVerificationService guestVerificationService;
    private final BookingRepository bookingRepository;

    public GuestBookingLookupAuthorizationServiceImpl(GuestVerificationService guestVerificationService,
                                                        BookingRepository bookingRepository) {
        this.guestVerificationService = guestVerificationService;
        this.bookingRepository = bookingRepository;
    }

    // Deliberately NOT @Transactional. consumeProofForLookup() below commits the proof's single-use
    // burn in its own transaction. If this method were wrapped in an outer transaction (by a future
    // caller), the exceptions thrown after consumption (ResourceNotFoundException/ForbiddenException)
    // would mark that outer transaction rollback-only, undoing the burn and making the proof replayable
    // — reopening exactly the replay/enumeration risk single-use consumption exists to prevent. See
    // GuestBookingLookupAuthorizationIntegrationTest, which proves this behaviorally.
    @Override
    public Booking authorize(String bookingRef, String proofToken) {
        String verifiedPhone = guestVerificationService.consumeProofForLookup(proofToken, VerificationPurpose.GUEST_BOOKING_LOOKUP);

        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found."));

        if (booking.getGuest() == null || !verifiedPhone.equals(booking.getGuest().getPhone())) {
            throw new ForbiddenException("You are not authorized to view this booking.");
        }

        return booking;
    }
}
