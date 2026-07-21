package com.autowashpro.service;

import com.autowashpro.entity.Booking;

public interface GuestBookingLookupAuthorizationService {

    Booking authorize(String bookingRef, String proofToken);
}
