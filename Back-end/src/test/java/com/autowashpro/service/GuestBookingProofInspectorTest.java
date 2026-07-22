package com.autowashpro.service;

import com.autowashpro.domain.booking.InspectedGuestProof;
import com.autowashpro.domain.booking.SensitiveProofToken;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.utils.ProofTokenCodec;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GuestBookingProofInspectorTest {

    private static final Instant NOW = Instant.parse("2026-07-22T05:00:00Z");
    private static final String RAW_PROOF = "gvp_" + "A".repeat(43);
    private static final String STORAGE_DIGEST = ProofTokenCodec.digest(RAW_PROOF);
    private final PhoneVerificationProofRepository repository =
            mock(PhoneVerificationProofRepository.class);
    private final GuestBookingProofInspector inspector = new GuestBookingProofInspector(
            repository, new BookingIdempotencyCodec(), Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void liveBookingProofReturnsTrustedPhoneAndSeparateReplayDigestWithoutConsuming() {
        PhoneVerificationProof proof = proof(
                VerificationPurpose.GUEST_BOOKING, null,
                LocalDateTime.of(2026, 7, 22, 12, 5));
        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.of(proof));

        InspectedGuestProof result = inspector.inspect(SensitiveProofToken.of(RAW_PROOF));

        assertThat(result.actor().verifiedPhone()).isEqualTo("+84901234567");
        assertThat(result.storageDigest()).isEqualTo(STORAGE_DIGEST);
        assertThat(result.actor().proofReplayHash()).isNotEqualTo(STORAGE_DIGEST);
        assertThat(result.toString()).doesNotContain(STORAGE_DIGEST, RAW_PROOF, "+84901234567");
        verify(repository, never()).consumeIfValidForPurpose(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    void invalidSyntaxDoesNotQueryDatabase() {
        assertThatThrownBy(() -> inspector.inspect(SensitiveProofToken.of("invalid")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
        verify(repository, never()).findById(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void absentWrongPurposeConsumedExpiredAndUnnormalizedRowsShareGenericError() {
        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.empty());
        assertRejected();

        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.of(proof(
                VerificationPurpose.GUEST_BOOKING_LOOKUP, null,
                LocalDateTime.of(2026, 7, 22, 12, 5))));
        assertRejected();

        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.of(proof(
                VerificationPurpose.GUEST_BOOKING, LocalDateTime.of(2026, 7, 22, 11, 59),
                LocalDateTime.of(2026, 7, 22, 12, 5))));
        assertRejected();

        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.of(proof(
                VerificationPurpose.GUEST_BOOKING, null,
                LocalDateTime.of(2026, 7, 22, 12, 0))));
        assertRejected();

        PhoneVerificationProof unnormalized = proof(
                VerificationPurpose.GUEST_BOOKING, null,
                LocalDateTime.of(2026, 7, 22, 12, 5));
        unnormalized.setPhone("0901234567");
        when(repository.findById(STORAGE_DIGEST)).thenReturn(Optional.of(unnormalized));
        assertRejected();
    }

    private void assertRejected() {
        assertThatThrownBy(() -> inspector.inspect(SensitiveProofToken.of(RAW_PROOF)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    private PhoneVerificationProof proof(
            VerificationPurpose purpose, LocalDateTime consumedAt, LocalDateTime expiresAt) {
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(STORAGE_DIGEST);
        proof.setPhone("+84901234567");
        proof.setPurpose(purpose);
        proof.setIssuedAt(LocalDateTime.of(2026, 7, 22, 11, 55));
        proof.setExpiresAt(expiresAt);
        proof.setConsumedAt(consumedAt);
        return proof;
    }
}
