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

    // Deliberately NOT @Transactional. consumeProofForLookup() commits the proof's single-use burn in
    // its own REQUIRES_NEW transaction, so later lookup/ownership failures cannot restore it even if a
    // future caller adds an outer transaction. GuestBookingLookupAuthorizationIntegrationTest proves
    // that durability behaviorally.
    @Override
    public Booking authorize(String bookingRef, String proofToken) {
        String verifiedPhone = guestVerificationService.consumeProofForLookup(proofToken, VerificationPurpose.GUEST_BOOKING_LOOKUP);

        Booking booking = bookingRepository.findForLookupByBookingRef(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found."));

        if (booking.getGuest() == null || !verifiedPhone.equals(booking.getGuest().getPhone())) {
            throw new ForbiddenException("You are not authorized to view this booking.");
        }

        return booking;
    }
}
