package com.autowashpro.service.impl;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.request.LoginRequest;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.LoginCustomerResponse;
import com.autowashpro.dto.response.LoginResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Voucher;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.exception.custom.UnauthorizedException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VoucherRepository;
import com.autowashpro.service.AuthService;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.autowashpro.utils.PhoneNormalizer;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final VoucherRepository voucherRepository;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    public AuthServiceImpl(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            VoucherRepository voucherRepository,
            FirebaseTokenVerifier firebaseTokenVerifier) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.voucherRepository = voucherRepository;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String phone = PhoneNormalizer.toE164(request.getPhone());

        if (customerRepository.existsByPhone(phone)) {
            throw new ConflictException("Phone number already registered.");
        }

        VerifiedFirebaseIdentity identity;
        try {
            identity = firebaseTokenVerifier.verify(request.getFirebaseToken());
        } catch (FirebaseAuthException e) {
            throw new BadRequestException("Mã xác thực Firebase đã hết hạn hoặc không hợp lệ: " + e.getMessage());
        }

        if (identity.phoneNumber() != null) {
            String requestPhone = PhoneNormalizer.toE164(phone);
            String firebaseVerifiedPhone = PhoneNormalizer.toE164(identity.phoneNumber());

            if (!requestPhone.equals(firebaseVerifiedPhone)) {
                throw new BadRequestException("Số điện thoại đăng ký không trùng khớp với số điện thoại xác minh trên Firebase.");
            }
        } else {
            throw new BadRequestException("Mã xác minh của Firebase không chứa số điện thoại.");
        }

        Customer customer = new Customer();
        customer.setFullName(request.getName());
        customer.setPhone(phone);
        customer.setEmail(request.getEmail());
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setTier("Member");
        customer.setRole("CUSTOMER");
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        Customer savedCustomer = customerRepository.save(customer);

        Voucher welcome=new Voucher(); welcome.setCustomer(savedCustomer); welcome.setVoucherCode("WELCOME-"+UUID.randomUUID().toString().substring(0,8).toUpperCase()); welcome.setVoucherType("DISCOUNT_50K"); welcome.setDiscountAmount(new BigDecimal("50000")); welcome.setStatus("ACTIVE"); welcome.setExpiredAt(LocalDate.now().plusMonths(1)); voucherRepository.save(welcome);

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

        String token = jwtTokenProvider.generateToken(customer.getCustomerId(), customer.getPhone(), customer.getRole());

        LoginCustomerResponse customerResponse = new LoginCustomerResponse();
        customerResponse.setId(String.valueOf(customer.getCustomerId()));
        customerResponse.setName(customer.getFullName());
        customerResponse.setPhone(customer.getPhone());
        customerResponse.setTier(customer.getTier());
        customerResponse.setRole(customer.getRole());
        customerResponse.setAccumulatedPoints(customer.getAccumulatedPoints());
        customerResponse.setTotalSpend(customer.getTotalSpent().longValue());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setCustomer(customerResponse);

        return response;
    }
}
