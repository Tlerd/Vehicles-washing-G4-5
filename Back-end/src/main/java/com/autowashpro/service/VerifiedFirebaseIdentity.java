package com.autowashpro.service;

/** Provider-agnostic result of verifying a Firebase ID token: a Phone-OTP
 *  token populates {@code phoneNumber}; a Google Sign-In token populates
 *  {@code email} instead. Exactly one is non-null for a successfully
 *  verified token. */
public record VerifiedFirebaseIdentity(String phoneNumber, String email) {
}
