package com.autowashpro.service.impl;

import com.autowashpro.dto.request.SendOtpRequest;
import com.autowashpro.dto.request.VerifyOtpRequest;
import com.autowashpro.dto.response.SendOtpResponse;
import com.autowashpro.dto.response.VerifyOtpResponse;
import com.autowashpro.entity.OtpToken;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.OtpTokenRepository;
import com.autowashpro.service.OtpService;
import com.autowashpro.utils.PhoneNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_OTP_REQUESTS_PER_HOUR = 3;
    private static final int VERIFIED_OTP_WINDOW_MINUTES = 30;

    private final OtpTokenRepository otpTokenRepository;
    private final CustomerRepository customerRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpServiceImpl(OtpTokenRepository otpTokenRepository, CustomerRepository customerRepository) {
        this.otpTokenRepository = otpTokenRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    @Transactional
    public SendOtpResponse sendOtp(SendOtpRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhoneNumber());

        if (customerRepository.existsByPhone(phone)) {
            throw new ConflictException("Phone number already registered.");
        }

        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentRequests = otpTokenRepository.countByPhoneAndCreatedAtAfter(phone, oneHourAgo);
        if (recentRequests >= MAX_OTP_REQUESTS_PER_HOUR) {
            throw new BadRequestException("OTP request limit reached. Please try again later.");
        }

        String otpCode = generateOtpCode();
        String sid = "local-" + UUID.randomUUID();

        OtpToken otpToken = new OtpToken();
        otpToken.setPhone(phone);
        otpToken.setOtpCode(otpCode);
        otpToken.setVerificationSid(sid);
        otpToken.setIsVerified(false);
        otpToken.setExpiredAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpToken.setCreatedAt(LocalDateTime.now());

        otpTokenRepository.save(otpToken);

        // Local/dev fallback until Phat integrates Twilio SMS dispatch.
        log.info("OTP generated for {} (dev mode): {}", phone, otpCode);

        return new SendOtpResponse(true, sid);
    }

    @Override
    @Transactional
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhoneNumber());

        OtpToken otpToken = otpTokenRepository.findTopByPhoneOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new BadRequestException("Incorrect OTP code. Please try again."));

        if (otpToken.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Incorrect OTP code. Please try again.");
        }

        if (!otpToken.getOtpCode().equals(request.getCode())) {
            throw new BadRequestException("Incorrect OTP code. Please try again.");
        }

        otpToken.setIsVerified(true);
        otpTokenRepository.save(otpToken);

        return new VerifyOtpResponse(true);
    }

    @Override
    public boolean isPhoneVerifiedForRegistration(String phone) {
        return otpTokenRepository.findTopByPhoneAndIsVerifiedTrueOrderByCreatedAtDesc(phone)
                .map(token -> token.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(VERIFIED_OTP_WINDOW_MINUTES)))
                .orElse(false);
    }

    private String generateOtpCode() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
