package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActorResolution;
import com.autowashpro.domain.booking.SensitiveProofToken;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.UnauthorizedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class BookingActorResolver {

    public BookingActorResolution resolve(
            Authentication authentication,
            String authorizationHeader,
            String guestProofHeader) {
        if (hasBearerPrincipal(authentication)) {
            if (hasRole(authentication, "STAFF") || hasRole(authentication, "ADMIN")) {
                throw new ForbiddenException("Only customers and verified guests can create bookings.");
            }
            if (!hasRole(authentication, "CUSTOMER")) {
                throw new ForbiddenException("Only customers and verified guests can create bookings.");
            }
            if (guestProofHeader != null && !guestProofHeader.isBlank()) {
                throw new BadRequestException(
                        "Customer authentication and guest proof cannot be combined.");
            }
            try {
                long customerId = Long.parseLong(authentication.getName());
                if (customerId <= 0) {
                    throw new NumberFormatException("non-positive subject");
                }
                return new BookingActorResolution.Member(customerId);
            } catch (NumberFormatException invalidSubject) {
                throw new UnauthorizedException("Invalid authenticated identity.");
            }
        }

        if (authorizationHeader != null) {
            throw new UnauthorizedException("Invalid bearer token.");
        }
        if (guestProofHeader == null || guestProofHeader.isBlank()) {
            throw new UnauthorizedException(
                    "Customer authentication or guest verification proof is required.");
        }
        return new BookingActorResolution.GuestCandidate(
                SensitiveProofToken.of(guestProofHeader));
    }

    private boolean hasBearerPrincipal(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }

    private boolean hasRole(Authentication authentication, String role) {
        String authority = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(candidate -> authority.equals(candidate.getAuthority()));
    }
}
