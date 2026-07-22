package com.autowashpro.config;

import com.autowashpro.entity.Customer;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.utils.PhoneNormalizer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;

@Component
@ConditionalOnProperty(
        prefix = "autowash.bootstrap.system-accounts",
        name = "enabled",
        havingValue = "true")
@EnableConfigurationProperties(SystemAccountSeedProperties.class)
public class SystemAccountSeeder implements CommandLineRunner {

    private final CustomerRepository customers;
    private final PasswordEncoder encoder;
    private final SeedAccount staff;
    private final SeedAccount admin;

    public SystemAccountSeeder(CustomerRepository customers, PasswordEncoder encoder,
                               SystemAccountSeedProperties properties) {
        this.customers = customers;
        this.encoder = encoder;
        this.staff = validate(properties.getStaff(), "STAFF");
        this.admin = validate(properties.getAdmin(), "ADMIN");
        if (staff.phone().equals(admin.phone()) || staff.email().equalsIgnoreCase(admin.email())) {
            throw new IllegalStateException("Bootstrap accounts must use distinct phone numbers and emails.");
        }
    }

    @Override
    @Transactional
    public void run(String... args) {
        boolean staffExists = preflight(staff);
        boolean adminExists = preflight(admin);
        if (!staffExists) {
            insert(staff);
        }
        if (!adminExists) {
            insert(admin);
        }
    }

    private boolean preflight(SeedAccount account) {
        return customers.findByPhone(account.phone()).map(existing -> {
            boolean exactPrivilegedIdentity = account.email().equalsIgnoreCase(existing.getEmail())
                    && account.role().equals(existing.getRole());
            if (!exactPrivilegedIdentity) {
                throw new IllegalStateException("A bootstrap account conflicts with an existing customer.");
            }
            // Idempotent startup: never reset a previously provisioned privileged password.
            return true;
        }).orElseGet(() -> {
            if (customers.existsByEmail(account.email())) {
                throw new IllegalStateException("A bootstrap email conflicts with an existing customer.");
            }
            return false;
        });
    }

    private void insert(SeedAccount account) {
        LocalDateTime now = LocalDateTime.now();
        Customer customer = new Customer();
        customer.setFullName(account.fullName());
        customer.setPhone(account.phone());
        customer.setEmail(account.email());
        customer.setPasswordHash(encoder.encode(account.password()));
        customer.setTier("MEMBER");
        customer.setRole(account.role());
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);
        customers.save(customer);
    }

    private SeedAccount validate(SystemAccountSeedProperties.Account account, String role) {
        if (account == null
                || isBlank(account.getFullName())
                || isBlank(account.getPhone())
                || isBlank(account.getEmail())
                || isBlank(account.getPassword())) {
            throw new IllegalStateException("Enabled system-account bootstrap requires complete environment configuration.");
        }
        String email = account.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalStateException("Bootstrap account email is invalid.");
        }
        String password = account.getPassword();
        boolean strong = password.length() >= 12
                && password.chars().anyMatch(Character::isUpperCase)
                && password.chars().anyMatch(Character::isLowerCase)
                && password.chars().anyMatch(Character::isDigit)
                && password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (!strong) {
            throw new IllegalStateException("Bootstrap account passwords must satisfy the strong-password policy.");
        }
        return new SeedAccount(
                account.getFullName().trim(), PhoneNormalizer.toE164(account.getPhone()),
                email, password, role);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record SeedAccount(String fullName, String phone, String email, String password, String role) {
    }
}
