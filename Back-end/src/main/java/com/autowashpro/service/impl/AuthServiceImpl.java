package com.autowashpro.service.impl;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.request.LoginRequest;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.LoginCustomerResponse;
import com.autowashpro.dto.response.LoginResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.exception.custom.UnauthorizedException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.service.AuthService;
import com.autowashpro.service.OtpService;
import com.autowashpro.utils.PhoneNormalizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final CustomerRepository customerRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(
            CustomerRepository customerRepository,
            OtpService otpService,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.customerRepository = customerRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhone());

        if (customerRepository.existsByPhone(phone)) {
            throw new ConflictException("Phone number already registered.");
        }

        if (!otpService.isPhoneVerifiedForRegistration(phone)) {
            throw new BadRequestException("Phone number must be OTP-verified before registration.");
        }

        Customer customer = new Customer();
        customer.setFullName(request.getName());
        customer.setPhone(phone);
        customer.setEmail(request.getEmail());
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setTier("Member");
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        Customer savedCustomer = customerRepository.save(customer);

        return new RegisterResponse(true, String.valueOf(savedCustomer.getCustomerId()));
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhone());

        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new UnauthorizedException("Incorrect phone number or password."));

        if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new UnauthorizedException("Incorrect phone number or password.");
        }

        String token = jwtTokenProvider.generateToken(customer.getCustomerId(), customer.getPhone());

        LoginCustomerResponse customerResponse = new LoginCustomerResponse();
        customerResponse.setId(String.valueOf(customer.getCustomerId()));
        customerResponse.setName(customer.getFullName());
        customerResponse.setPhone(customer.getPhone());
        customerResponse.setTier(customer.getTier());
        customerResponse.setAccumulatedPoints(customer.getAccumulatedPoints());
        customerResponse.setTotalSpend(customer.getTotalSpent().longValue());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setCustomer(customerResponse);

        return response;
    }
}
