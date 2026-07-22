package com.autowashpro.service.impl;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.RateLimiter;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.autowashpro.utils.ProofTokenCodec;
import com.google.firebase.auth.FirebaseAuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestVerificationServiceImplTest {

    private static final String TOKEN_1 = "gvp_" + "A".repeat(43);
    private static final String TOKEN_2 = "gvp_" + "B".repeat(43);
    private static final String TOKEN_3 = "gvp_" + "C".repeat(43);

    @Mock
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @Mock
    private PhoneVerificationProofRepository proofRepository;

    @Mock
    private RateLimiter rateLimiter;

    private GuestVerificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestVerificationServiceImpl(firebaseTokenVerifier, proofRepository, rateLimiter);
    }

    // Stub ordering below matches issueProof's actual execution order (Firebase verification runs
    // BEFORE the rate-limit check — see the reordering note above Step 6). Tests for failures that
    // occur before the rate-limit check deliberately do NOT stub rateLimiter.tryConsume at all: under
    // MockitoExtension's default STRICT_STUBS, a stub that is set up but never invoked fails the test
    // class with UnnecessaryStubbingException, so an unreachable stub must be omitted, not just unused.

    @Test
    void issueProof_validFirebaseVerification_returnsProofBoundToNormalizedPhoneAndPurpose() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("valid-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(true);

        VerificationProofResponse response = service.issueProof("0901234567", "valid-token", VerificationPurpose.GUEST_BOOKING);

        assertThat(response.getProofToken()).isNotBlank();
        assertThat(response.getExpiresAt()).isNotNull();

        ArgumentCaptor<PhoneVerificationProof> captor = ArgumentCaptor.forClass(PhoneVerificationProof.class);
        verify(proofRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo("+84901234567");
        assertThat(captor.getValue().getPurpose()).isEqualTo(VerificationPurpose.GUEST_BOOKING);
        assertThat(captor.getValue().getConsumedAt()).isNull();
        assertThat(captor.getValue().getProofToken()).isEqualTo(ProofTokenCodec.digest(response.getProofToken()));
        assertThat(captor.getValue().getProofToken()).isNotEqualTo(response.getProofToken());
    }

    @Test
    void issueProof_invalidFirebaseToken_throwsBadRequestWithGenericMessage() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("bad-token")).thenThrow(FirebaseAuthException.class);

        assertThatThrownBy(() -> service.issueProof("0901234567", "bad-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification token.");
    }

    @Test
    void issueProof_firebaseIdentityMissingPhone_throwsBadRequest() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "user@example.com"));

        assertThatThrownBy(() -> service.issueProof("0901234567", "google-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification token.");
    }

    @Test
    void issueProof_verifiedPhoneMismatch_throwsBadRequest() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("valid-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84909999999", null));

        assertThatThrownBy(() -> service.issueProof("0901234567", "valid-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Verified phone does not match the phone number provided.");
    }

    @Test
    void issueProof_rateLimitExceeded_throwsTooManyRequestsWithGenericMessageOnly() throws FirebaseAuthException {
        when(firebaseTokenVerifier.verify("any-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.issueProof("0901234567", "any-token", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessage("Too many verification requests. Please try again later.")
                .satisfies(ex -> assertThat(ex.getMessage()).doesNotContain("0901234567").doesNotContain("+84901234567"));
    }

    @Test
    void consumeProofForPhone_validProof_returnsNormalizedPhone() {
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValid(eq(ProofTokenCodec.digest(TOKEN_1)), eq("+84901234567"), eq(VerificationPurpose.GUEST_BOOKING), any()))
                .thenReturn(1);

        String phone = service.consumeProofForPhone(TOKEN_1, "0901234567", VerificationPurpose.GUEST_BOOKING);

        assertThat(phone).isEqualTo("+84901234567");
    }

    @Test
    void consumeProofForPhone_invalidProof_throwsGenericBadRequest() {
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValid(anyString(), anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.consumeProofForPhone(TOKEN_1, "0901234567", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    @Test
    void consumeProofForPhone_rateLimitExceeded_throwsTooManyRequests() {
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.consumeProofForPhone(TOKEN_1, "0901234567", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void consumeProofForPhone_blankToken_throwsGenericBadRequestWithoutQueryingRepository() {
        assertThatThrownBy(() -> service.consumeProofForPhone("   ", "0901234567", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");

        verifyNoInteractions(proofRepository, rateLimiter);
    }

    @Test
    void consumeProofForLookup_validProof_returnsPhoneFromRecord() {
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValidForPurpose(eq(ProofTokenCodec.digest(TOKEN_2)), eq(VerificationPurpose.GUEST_BOOKING_LOOKUP), any()))
                .thenReturn(1);
        PhoneVerificationProof stored = new PhoneVerificationProof();
        stored.setProofToken(ProofTokenCodec.digest(TOKEN_2));
        stored.setPhone("+84901234567");
        stored.setPurpose(VerificationPurpose.GUEST_BOOKING_LOOKUP);
        when(proofRepository.findById(ProofTokenCodec.digest(TOKEN_2))).thenReturn(Optional.of(stored));

        String phone = service.consumeProofForLookup(TOKEN_2, VerificationPurpose.GUEST_BOOKING_LOOKUP);

        assertThat(phone).isEqualTo("+84901234567");
    }

    @Test
    void consumeProofForLookup_invalidProof_throwsGenericBadRequest() {
        when(rateLimiter.tryConsume(any(), anyString(), anyInt(), any())).thenReturn(true);
        when(proofRepository.consumeIfValidForPurpose(anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> service.consumeProofForLookup(TOKEN_3, VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    @Test
    void consumeProofForLookup_blankToken_throwsGenericBadRequestWithoutQueryingRepository() {
        assertThatThrownBy(() -> service.consumeProofForLookup("   ", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");

        verifyNoInteractions(proofRepository, rateLimiter);
    }

    @Test
    void consumeProofForLookup_malformedToken_doesNotAllocateRateLimitEntry() {
        assertThatThrownBy(() -> service.consumeProofForLookup("gvp_too-short", VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");

        verifyNoInteractions(proofRepository, rateLimiter);
    }
}
