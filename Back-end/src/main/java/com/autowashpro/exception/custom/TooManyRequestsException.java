package com.autowashpro.exception.custom;

public class TooManyRequestsException extends RuntimeException {

    private final int retryAfterSeconds;

    public TooManyRequestsException(String message) {
        this(message, 60);
    }

    public TooManyRequestsException(String message, int retryAfterSeconds) {
        super(message);
        if (retryAfterSeconds <= 0) {
            throw new IllegalArgumentException("Retry delay must be positive.");
        }
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
