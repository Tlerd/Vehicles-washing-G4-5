package com.autowashpro.service;

import com.autowashpro.dto.request.SendOtpRequest;
import com.autowashpro.dto.request.VerifyOtpRequest;
import com.autowashpro.dto.response.SendOtpResponse;
import com.autowashpro.dto.response.VerifyOtpResponse;

public interface OtpService {

    SendOtpResponse sendOtp(SendOtpRequest request);

    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);

    boolean isPhoneVerifiedForRegistration(String phone);
}
