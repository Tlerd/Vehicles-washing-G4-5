package com.autowashpro.service.impl;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.request.LoginRequest;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.LoginResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.exception.custom.UnauthorizedException;
import com.autowashpro.mapper.AuthMapper;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.service.AuthService;
import com.autowashpro.utils.PhoneNormalizer;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthMapper authMapper;

    public AuthServiceImpl(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            AuthMapper authMapper) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authMapper = authMapper;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhone());

        if (customerRepository.existsByPhone(phone)) {
            throw new ConflictException("Phone number already registered.");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(request.getFirebaseToken());
            String verifiedPhone = (String) decodedToken.getClaims().get("phone_number");

            if (verifiedPhone == null) {
                throw new BadRequestException("Mã xác minh của Firebase không chứa số điện thoại.");
            }

            String requestPhone = PhoneNormalizer.toE164(phone);
            String firebaseVerifiedPhone = PhoneNormalizer.toE164(verifiedPhone);

            if (!requestPhone.equals(firebaseVerifiedPhone)) {
                throw new BadRequestException("Số điện thoại đăng ký không trùng khớp với số điện thoại xác minh trên Firebase.");
            }
        } catch (FirebaseAuthException e) {
            throw new BadRequestException("Mã xác thực Firebase đã hết hạn hoặc không hợp lệ: " + e.getMessage());
        }

        Customer customer = authMapper.toCustomer(request);
        customer.setPhone(phone);
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Customer savedCustomer = customerRepository.save(customer);

        return authMapper.toRegisterResponse(savedCustomer);
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

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setCustomer(authMapper.toLoginCustomerResponse(customer));

        return response;
    }
}
