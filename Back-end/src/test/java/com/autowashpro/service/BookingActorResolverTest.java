package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActorResolution;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.exception.custom.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingActorResolverTest {

    private static final String PROOF = "gvp_" + "A".repeat(43);
    private final BookingActorResolver resolver = new BookingActorResolver();

    @Test
    void customerIdentityComesOnlyFromAuthenticatedSubject() {
        BookingActorResolution result = resolver.resolve(
                bearer("42", "CUSTOMER"), "Bearer signed-token", null);

        assertThat(result).isEqualTo(new BookingActorResolution.Member(42L));
    }

    @Test
    void customerCannotAlsoSubmitGuestProof() {
        assertThatThrownBy(() -> resolver.resolve(
                bearer("42", "CUSTOMER"), "Bearer signed-token", PROOF))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void staffAndAdminNeverDowngradeToGuest() {
        for (String role : List.of("STAFF", "ADMIN")) {
            assertThatThrownBy(() -> resolver.resolve(
                    bearer("7", role), "Bearer signed-token", PROOF))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Test
    void anonymousRequiresOneWellFormedProof() {
        BookingActorResolution result = resolver.resolve(anonymous(), null, PROOF);

        assertThat(result).isInstanceOf(BookingActorResolution.GuestCandidate.class);
        assertThat(result.toString()).doesNotContain(PROOF);

        assertThatThrownBy(() -> resolver.resolve(anonymous(), null, null))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> resolver.resolve(anonymous(), null, "not-a-proof"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void anyExplicitUnresolvedAuthorizationHeaderIsUnauthorizedNotGuestFallback() {
        for (String header : List.of("Basic abc", "Bearer ", "garbage")) {
            assertThatThrownBy(() -> resolver.resolve(anonymous(), header, PROOF))
                    .isInstanceOf(UnauthorizedException.class);
        }
    }

    @Test
    void malformedAuthenticatedSubjectIsUnauthorized() {
        assertThatThrownBy(() -> resolver.resolve(
                bearer("not-an-id", "CUSTOMER"), "Bearer signed-token", null))
                .isInstanceOf(UnauthorizedException.class);
    }

    private Authentication bearer(String subject, String role) {
        return new UsernamePasswordAuthenticationToken(
                subject, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private Authentication anonymous() {
        return new AnonymousAuthenticationToken(
                "anonymous-key", "anonymousUser",
                List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
    }
}
