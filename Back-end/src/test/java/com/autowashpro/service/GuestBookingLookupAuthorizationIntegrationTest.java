package com.autowashpro.service;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.utils.ProofTokenCodec;
import com.autowashpro.utils.ProofTokenGenerator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class GuestBookingLookupAuthorizationIntegrationTest {

    @Autowired
    private GuestBookingLookupAuthorizationService authorizationService;

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    @Autowired
    private GuestVerificationService guestVerificationService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private String proofToken;

    @AfterEach
    void cleanUp() {
        if (proofToken != null) {
            proofRepository.deleteById(ProofTokenCodec.digest(proofToken));
        }
    }

    @Test
    void authorize_unknownBookingRef_stillConsumesProofDespiteException() {
        proofToken = ProofTokenGenerator.generate();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(ProofTokenCodec.digest(proofToken));
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

    @Test
    void consumeProofForLookup_outerTransactionRollsBack_burnRemainsCommitted() {
        proofToken = ProofTokenGenerator.generate();
        saveProof(proofToken, "+84911888001", VerificationPurpose.GUEST_BOOKING_LOOKUP);

        TransactionTemplate outer = new TransactionTemplate(transactionManager);
        outer.executeWithoutResult(status -> {
            guestVerificationService.consumeProofForLookup(proofToken, VerificationPurpose.GUEST_BOOKING_LOOKUP);
            status.setRollbackOnly();
        });

        assertThatThrownBy(() -> guestVerificationService.consumeProofForLookup(
                proofToken, VerificationPurpose.GUEST_BOOKING_LOOKUP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    @Test
    void consumeProofForPhone_outerTransactionRollsBack_burnRemainsCommitted() {
        proofToken = ProofTokenGenerator.generate();
        saveProof(proofToken, "+84911888002", VerificationPurpose.GUEST_BOOKING);

        TransactionTemplate outer = new TransactionTemplate(transactionManager);
        outer.executeWithoutResult(status -> {
            guestVerificationService.consumeProofForPhone(
                    proofToken, "+84911888002", VerificationPurpose.GUEST_BOOKING);
            status.setRollbackOnly();
        });

        assertThatThrownBy(() -> guestVerificationService.consumeProofForPhone(
                proofToken, "+84911888002", VerificationPurpose.GUEST_BOOKING))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification proof.");
    }

    private void saveProof(String token, String phone, VerificationPurpose purpose) {
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(ProofTokenCodec.digest(token));
        proof.setPhone(phone);
        proof.setPurpose(purpose);
        LocalDateTime now = LocalDateTime.now();
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plusMinutes(5));
        proofRepository.saveAndFlush(proof);
    }
}
