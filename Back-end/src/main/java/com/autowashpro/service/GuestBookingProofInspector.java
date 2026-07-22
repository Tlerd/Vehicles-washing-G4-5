package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActor;
import com.autowashpro.domain.booking.InspectedGuestProof;
import com.autowashpro.domain.booking.SensitiveProofToken;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.utils.PhoneNormalizer;
import com.autowashpro.utils.ProofTokenCodec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;

@Service
public class GuestBookingProofInspector {

    private static final String GENERIC_ERROR = "Invalid or expired verification proof.";

    private final PhoneVerificationProofRepository proofs;
    private final BookingIdempotencyCodec codec;
    private final Clock clock;

    @Autowired
    public GuestBookingProofInspector(
            PhoneVerificationProofRepository proofs, BookingIdempotencyCodec codec) {
        this(proofs, codec, Clock.systemUTC());
    }

    GuestBookingProofInspector(
            PhoneVerificationProofRepository proofs,
            BookingIdempotencyCodec codec,
            Clock clock) {
        this.proofs = proofs;
        this.codec = codec;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public InspectedGuestProof inspect(SensitiveProofToken token) {
        if (token == null) {
            throw invalid();
        }
        String rawProof = token.reveal();
        if (!ProofTokenCodec.isValid(rawProof)) {
            throw invalid();
        }
        String storageDigest = ProofTokenCodec.digest(rawProof);
        PhoneVerificationProof proof = proofs.findById(storageDigest)
                .orElseThrow(this::invalid);
        LocalDateTime now = LocalDateTime.ofInstant(
                Instant.now(clock), BookingAvailabilityService.BUSINESS_ZONE);
        if (proof.getPurpose() != VerificationPurpose.GUEST_BOOKING
                || proof.getConsumedAt() != null
                || proof.getExpiresAt() == null
                || !proof.getExpiresAt().isAfter(now)) {
            throw invalid();
        }

        String phone;
        try {
            phone = PhoneNormalizer.toE164(proof.getPhone());
        } catch (BadRequestException invalidPhone) {
            throw invalid();
        }
        if (!phone.equals(proof.getPhone())) {
            throw invalid();
        }
        BookingActor.Guest actor = new BookingActor.Guest(
                phone, codec.guestProofHash(rawProof));
        return new InspectedGuestProof(actor, storageDigest);
    }

    private BadRequestException invalid() {
        return new BadRequestException(GENERIC_ERROR);
    }
}
