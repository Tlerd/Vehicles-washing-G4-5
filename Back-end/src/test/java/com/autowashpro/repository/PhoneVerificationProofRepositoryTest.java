package com.autowashpro.repository;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PhoneVerificationProofRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private PhoneVerificationProofRepository proofRepository;

    private PhoneVerificationProof newProof(String token, String phone, VerificationPurpose purpose, LocalDateTime expiresAt) {
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(token);
        proof.setPhone(phone);
        proof.setPurpose(purpose);
        proof.setIssuedAt(LocalDateTime.now());
        proof.setExpiresAt(expiresAt);
        return proof;
    }

    @Test
    void save_and_findById_persistsUnconsumedProof() {
        proofRepository.saveAndFlush(newProof("tok-persist-1", "+84911444001", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        PhoneVerificationProof loaded = proofRepository.findById("tok-persist-1").orElseThrow();
        assertThat(loaded.getPhone()).isEqualTo("+84911444001");
        assertThat(loaded.getPurpose()).isEqualTo(VerificationPurpose.GUEST_BOOKING);
        assertThat(loaded.getConsumedAt()).isNull();
    }

    @Test
    void consumeIfValid_matchingUnexpiredUnconsumedProof_marksConsumedAndReturnsOne() {
        proofRepository.saveAndFlush(newProof("tok-valid-1", "+84911444002", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-valid-1", "+84911444002", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(1);
        assertThat(proofRepository.findById("tok-valid-1").orElseThrow().getConsumedAt()).isNotNull();
    }

    @Test
    void consumeIfValid_expiredProof_returnsZeroAndLeavesUnconsumed() {
        proofRepository.saveAndFlush(newProof("tok-expired-1", "+84911444003", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().minusMinutes(1)));

        int updated = proofRepository.consumeIfValid("tok-expired-1", "+84911444003", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
        assertThat(proofRepository.findById("tok-expired-1").orElseThrow().getConsumedAt()).isNull();
    }

    @Test
    void consumeIfValid_alreadyConsumedProof_returnsZeroOnSecondAttempt() {
        proofRepository.saveAndFlush(newProof("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int first = proofRepository.consumeIfValid("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());
        int second = proofRepository.consumeIfValid("tok-replay-1", "+84911444004", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
    }

    @Test
    void consumeIfValid_wrongPhone_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-wrongphone-1", "+84911444005", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-wrongphone-1", "+84911444999", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
    }

    @Test
    void consumeIfValid_wrongPurpose_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-wrongpurpose-1", "+84911444006", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValid("tok-wrongpurpose-1", "+84911444006", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
    }

    @Test
    void consumeIfValidForPurpose_matchingUnexpiredUnconsumedProof_marksConsumedAndReturnsOne() {
        proofRepository.saveAndFlush(newProof("tok-purpose-1", "+84911444007", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValidForPurpose("tok-purpose-1", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(1);
        assertThat(proofRepository.findById("tok-purpose-1").orElseThrow().getConsumedAt()).isNotNull();
    }

    @Test
    void consumeIfValidForPurpose_wrongPurpose_returnsZero() {
        proofRepository.saveAndFlush(newProof("tok-purpose-2", "+84911444008", VerificationPurpose.GUEST_BOOKING, LocalDateTime.now().plusMinutes(5)));

        int updated = proofRepository.consumeIfValidForPurpose("tok-purpose-2", VerificationPurpose.GUEST_BOOKING_LOOKUP, LocalDateTime.now());

        assertThat(updated).isEqualTo(0);
        assertThat(proofRepository.findById("tok-purpose-2").orElseThrow().getConsumedAt()).isNull();
    }
}
