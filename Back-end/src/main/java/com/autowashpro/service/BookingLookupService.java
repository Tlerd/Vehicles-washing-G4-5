package com.autowashpro.service;

import com.autowashpro.dto.response.BookingLookupResponse;
import org.springframework.security.core.Authentication;

public interface BookingLookupService {
    BookingLookupResponse lookup(String bookingRef, Authentication authentication, String guestProofToken);
}
