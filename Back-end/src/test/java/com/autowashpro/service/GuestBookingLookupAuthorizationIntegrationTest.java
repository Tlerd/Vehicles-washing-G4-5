package com.autowashpro.service;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class GuestBookingLookupAuthorizationIntegrationTest {

    @Autowired
    private GuestBookingLookupAuthorizationService authorizationService;

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    private String proofToken;

    @AfterEach
    void cleanUp() {
        if (proofToken != null) {
            proofRepository.deleteById(proofToken);
        }
    }

    @Test
    void authorize_unknownBookingRef_stillConsumesProofDespiteException() {
        proofToken = "gvp_txn_invariant_" + UUID.randomUUID();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(proofToken);
        proof.setPhone("+84911888000");
        proof.setPurpose(VerificationPurpose.GUEST_BOOKING_LOOKUP);
        LocalDateTime now = LocalDateTime.now();
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plusMinutes(5));
        proofRepository.saveAndFlush(proof);

        assertThatThrownBy(() -> authorizationService.authorize("AWP-DOES-NOT-EXIST", proofToken))
                .isInstanceOf(ResourceNotFoundException.class);

        // If the burn had rolled back with the exception above, this second call would reach the ref
        // lookup again and throw ResourceNotFoundException a second time. Instead it must fail earlier,
        // at proof consumption, proving the first call's consumed_at commit was durable.
        assertThatThrownBy(() -> authorizationService.authorize("AWP-DOES-NOT-EXIST", proofToken))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }
}
