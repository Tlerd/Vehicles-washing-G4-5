package com.autowashpro.controller;

import com.autowashpro.dto.request.LoginRequest;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.request.SendOtpRequest;
import com.autowashpro.dto.request.VerifyOtpRequest;
import com.autowashpro.dto.response.LoginResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.dto.response.SendOtpResponse;
import com.autowashpro.dto.response.VerifyOtpResponse;
import com.autowashpro.service.AuthService;
import com.autowashpro.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Customer registration, OTP verification, and login APIs")
public class AuthController {

    private final OtpService otpService;
    private final AuthService authService;

    public AuthController(OtpService otpService, AuthService authService) {
        this.otpService = otpService;
        this.authService = authService;
    }

    @Operation(summary = "Send OTP verification SMS")
    @PostMapping("/send-otp")
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        SendOtpResponse response = otpService.sendOtp(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Verify OTP code")
    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = otpService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Register a new customer account")
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Authenticate customer and return JWT")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
