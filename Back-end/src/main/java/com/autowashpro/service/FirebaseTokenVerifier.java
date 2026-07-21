package com.autowashpro.service;

import com.google.firebase.auth.FirebaseAuthException;

public interface FirebaseTokenVerifier {
    VerifiedFirebaseIdentity verify(String token) throws FirebaseAuthException;
}
