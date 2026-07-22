package com.autowashpro.config;

import com.autowashpro.entity.Customer;
import com.autowashpro.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SystemAccountSeederTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(SystemAccountSeeder.class)
            .withBean(CustomerRepository.class, () -> mock(CustomerRepository.class))
            .withBean(PasswordEncoder.class, () -> mock(PasswordEncoder.class));

    @Test
    void bootstrap_isDisabledByDefault() {
        runner.run(context -> assertThat(context).doesNotHaveBean(SystemAccountSeeder.class));
    }

    @Test
    void enabledWithoutCompleteEnvironmentValues_failsClosed() {
        runner.withPropertyValues("autowash.bootstrap.system-accounts.enabled=true")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void validEnvironmentValues_createHashedAccountsWithoutPersistingRawPasswords() {
        withValidProperties().run(context -> {
            CustomerRepository repository = context.getBean(CustomerRepository.class);
            PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
            when(repository.findByPhone(anyString())).thenReturn(Optional.empty());
            when(repository.existsByEmail(anyString())).thenReturn(false);
            when(encoder.encode("S3cure-staff!value")).thenReturn("staff-hash");
            when(encoder.encode("S3cure-admin!value")).thenReturn("admin-hash");

            context.getBean(SystemAccountSeeder.class).run();

            verify(repository).save(org.mockito.ArgumentMatchers.argThat(customer ->
                    "STAFF".equals(customer.getRole()) && "staff-hash".equals(customer.getPasswordHash())));
            verify(repository).save(org.mockito.ArgumentMatchers.argThat(customer ->
                    "ADMIN".equals(customer.getRole()) && "admin-hash".equals(customer.getPasswordHash())));
        });
    }

    @Test
    void conflictingExistingAccount_failsWithoutChangingPrivilegesOrPassword() {
        withValidProperties().run(context -> {
            CustomerRepository repository = context.getBean(CustomerRepository.class);
            PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
            Customer existing = new Customer();
            existing.setPhone("+84900000111");
            existing.setEmail("someone-else@example.test");
            existing.setRole("CUSTOMER");
            existing.setPasswordHash("unchanged-hash");
            when(repository.findByPhone("+84900000111")).thenReturn(Optional.of(existing));

            assertThat(org.assertj.core.api.Assertions.catchThrowable(
                    () -> context.getBean(SystemAccountSeeder.class).run()))
                    .isInstanceOf(IllegalStateException.class);
            assertThat(existing.getRole()).isEqualTo("CUSTOMER");
            assertThat(existing.getPasswordHash()).isEqualTo("unchanged-hash");
            verify(repository, never()).save(existing);
            verify(encoder, never()).encode(anyString());
        });
    }

    @Test
    void secondAccountCollision_isDetectedBeforeFirstAccountIsInserted() {
        withValidProperties().run(context -> {
            CustomerRepository repository = context.getBean(CustomerRepository.class);
            PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
            Customer conflictingAdmin = new Customer();
            conflictingAdmin.setPhone("+84900000222");
            conflictingAdmin.setEmail("other@example.test");
            conflictingAdmin.setRole("CUSTOMER");
            when(repository.findByPhone("+84900000111")).thenReturn(Optional.empty());
            when(repository.existsByEmail("staff@example.test")).thenReturn(false);
            when(repository.findByPhone("+84900000222")).thenReturn(Optional.of(conflictingAdmin));

            assertThat(org.assertj.core.api.Assertions.catchThrowable(
                    () -> context.getBean(SystemAccountSeeder.class).run()))
                    .isInstanceOf(IllegalStateException.class);
            verify(repository, never()).save(org.mockito.ArgumentMatchers.any(Customer.class));
            verifyNoInteractions(encoder);
        });
    }

    private ApplicationContextRunner withValidProperties() {
        return runner.withPropertyValues(
                "autowash.bootstrap.system-accounts.enabled=true",
                "autowash.bootstrap.system-accounts.staff.full-name=Test Staff",
                "autowash.bootstrap.system-accounts.staff.phone=+84900000111",
                "autowash.bootstrap.system-accounts.staff.email=staff@example.test",
                "autowash.bootstrap.system-accounts.staff.password=S3cure-staff!value",
                "autowash.bootstrap.system-accounts.admin.full-name=Test Admin",
                "autowash.bootstrap.system-accounts.admin.phone=+84900000222",
                "autowash.bootstrap.system-accounts.admin.email=admin@example.test",
                "autowash.bootstrap.system-accounts.admin.password=S3cure-admin!value");
    }
}
