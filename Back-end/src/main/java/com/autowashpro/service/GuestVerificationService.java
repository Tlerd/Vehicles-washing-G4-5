package com.autowashpro.service;

import com.autowashpro.dto.response.VerificationProofResponse;
import com.autowashpro.entity.VerificationPurpose;

public interface GuestVerificationService {

    VerificationProofResponse issueProof(String phone, String firebaseToken, VerificationPurpose purpose);

    String consumeProofForPhone(String proofToken, String phone, VerificationPurpose purpose);

    String consumeProofForLookup(String proofToken, VerificationPurpose purpose);
}
