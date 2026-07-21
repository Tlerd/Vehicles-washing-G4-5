package com.autowashpro.service.impl;

import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Component;

@Component
public class FirebaseTokenVerifierImpl implements FirebaseTokenVerifier {

    @Override
    public VerifiedFirebaseIdentity verify(String token) throws FirebaseAuthException {
        FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
        String phoneNumber = (String) decoded.getClaims().get("phone_number");
        return new VerifiedFirebaseIdentity(phoneNumber, decoded.getEmail());
    }
}
