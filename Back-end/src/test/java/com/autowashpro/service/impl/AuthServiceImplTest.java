package com.autowashpro.service.impl;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VoucherRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.google.firebase.auth.FirebaseAuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private VoucherRepository voucherRepository;
    @Mock private FirebaseTokenVerifier firebaseTokenVerifier;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                customerRepository, passwordEncoder, jwtTokenProvider, voucherRepository, firebaseTokenVerifier);
    }

    @Test
    void register_withVerifiedPhoneOtp_createsAccount() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-phone-token");

        when(firebaseTokenVerifier.verify("valid-phone-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84901234567", null));
        when(customerRepository.existsByPhone("+84901234567")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setCustomerId(1L);
            return saved;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getCustomerId()).isEqualTo("1");
    }

    @Test
    void register_withMismatchedPhone_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-phone-token");

        when(firebaseTokenVerifier.verify("valid-phone-token"))
                .thenReturn(new VerifiedFirebaseIdentity("+84909999999", null));
        when(customerRepository.existsByPhone("+84901234567")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void register_withDuplicatePhone_throwsConflict() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van A");
        request.setPhone("0901234567");
        request.setPassword("secret123");
        request.setFirebaseToken("any-token");

        when(customerRepository.existsByPhone("+84901234567")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void register_withGoogleIdentity_createsAccountUsingSubmittedPhoneAndTokenEmail() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "vanb@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);
        when(customerRepository.existsByEmail("vanb@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setCustomerId(2L);
            return saved;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getCustomerId()).isEqualTo("2");
    }

    @Test
    void register_withGoogleIdentityAndMismatchedSubmittedEmail_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setEmail("someone-else@gmail.com");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "vanb@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void register_withDuplicateEmail_throwsConflict() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van B");
        request.setPhone("0909876543");
        request.setPassword("secret123");
        request.setFirebaseToken("valid-google-token");

        when(firebaseTokenVerifier.verify("valid-google-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, "taken@gmail.com"));
        when(customerRepository.existsByPhone("+84909876543")).thenReturn(false);
        when(customerRepository.existsByEmail("taken@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class);

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    void register_withTokenMissingPhoneAndEmail_throwsBadRequest() throws FirebaseAuthException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Nguyen Van C");
        request.setPhone("0901112233");
        request.setPassword("secret123");
        request.setFirebaseToken("no-identity-token");

        when(firebaseTokenVerifier.verify("no-identity-token"))
                .thenReturn(new VerifiedFirebaseIdentity(null, null));
        when(customerRepository.existsByPhone("+84901112233")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }
}
