package com.autowashpro.config;

import com.autowashpro.entity.Customer;
import com.autowashpro.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class SystemAccountSeeder implements CommandLineRunner {
    private final CustomerRepository customers;
    private final PasswordEncoder encoder;
    public SystemAccountSeeder(CustomerRepository customers, PasswordEncoder encoder) { this.customers=customers; this.encoder=encoder; }
    @Override public void run(String... args) {
        seed("AutoWash Staff", "+84900000001", "staff@autowash.local", "Staff@123", "STAFF");
        seed("AutoWash Admin", "+84900000002", "admin@autowash.local", "Admin@123", "ADMIN");
    }
    private void seed(String name,String phone,String email,String password,String role) {
        if(customers.existsByPhone(phone)) return;
        Customer c=new Customer(); c.setFullName(name); c.setPhone(phone); c.setEmail(email); c.setPasswordHash(encoder.encode(password));
        c.setTier("Member"); c.setRole(role); c.setAccumulatedPoints(0); c.setTotalSpent(BigDecimal.ZERO); c.setTotalWashes(0); c.setCreatedAt(LocalDateTime.now()); c.setUpdatedAt(LocalDateTime.now()); customers.save(c);
    }
}
