package com.autowashpro.service.impl;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.TooManyRequestsException;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.GuestVerificationService;
import com.autowashpro.service.RateLimiter;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.autowashpro.utils.PhoneNormalizer;
import com.autowashpro.utils.ProofTokenGenerator;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class GuestVerificationServiceImpl implements GuestVerificationService {

    private static final Duration PROOF_TTL = Duration.ofMinutes(5);
    private static final int ISSUANCE_MAX_ATTEMPTS = 5;
    private static final Duration ISSUANCE_WINDOW = Duration.ofMinutes(15);
    private static final String GENERIC_TOKEN_ERROR = "Invalid or expired verification token.";
    private static final String GENERIC_RATE_LIMIT_ERROR = "Too many verification requests. Please try again later.";

    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final PhoneVerificationProofRepository proofRepository;
    private final RateLimiter rateLimiter;

    public GuestVerificationServiceImpl(FirebaseTokenVerifier firebaseTokenVerifier,
                                         PhoneVerificationProofRepository proofRepository,
                                         RateLimiter rateLimiter) {
        this.firebaseTokenVerifier = firebaseTokenVerifier;
        this.proofRepository = proofRepository;
        this.rateLimiter = rateLimiter;
    }

    @Override
    @Transactional
    public VerificationProofResponse issueProof(String phone, String firebaseToken, VerificationPurpose purpose) {
        // Order matters here, per the adversarial security review: verify the caller's Firebase
        // identity BEFORE rate-limiting. The original draft rate-limited on the caller's raw, unproven
        // phone claim first — meaning anyone could exhaust a real victim's issuance quota using pure
        // garbage tokens, with no proof of phone ownership required. Rate-limiting only after a real
        // Firebase-verified phone is established means the limiter can only ever be tripped by someone
        // who actually controls that phone number.
        String normalizedPhone = PhoneNormalizer.toE164(phone);

        VerifiedFirebaseIdentity identity;
        try {
            identity = firebaseTokenVerifier.verify(firebaseToken);
        } catch (FirebaseAuthException e) {
            throw new BadRequestException(GENERIC_TOKEN_ERROR);
        }

        if (identity.phoneNumber() == null) {
            throw new BadRequestException(GENERIC_TOKEN_ERROR);
        }

        String verifiedPhone = PhoneNormalizer.toE164(identity.phoneNumber());
        if (!verifiedPhone.equals(normalizedPhone)) {
            throw new BadRequestException("Verified phone does not match the phone number provided.");
        }

        if (!rateLimiter.tryConsume("issue|" + verifiedPhone + "|" + purpose, ISSUANCE_MAX_ATTEMPTS, ISSUANCE_WINDOW)) {
            throw new TooManyRequestsException(GENERIC_RATE_LIMIT_ERROR);
        }

        LocalDateTime now = LocalDateTime.now();
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(ProofTokenGenerator.generate());
        proof.setPhone(normalizedPhone);
        proof.setPurpose(purpose);
        proof.setIssuedAt(now);
        proof.setExpiresAt(now.plus(PROOF_TTL));
        proofRepository.save(proof);

        return new VerificationProofResponse(proof.getProofToken(), proof.getExpiresAt());
    }
}
