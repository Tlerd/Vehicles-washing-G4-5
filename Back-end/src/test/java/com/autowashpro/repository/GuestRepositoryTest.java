package com.autowashpro.repository;

import com.autowashpro.entity.Guest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GuestRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private GuestRepository guestRepository;

    @Test
    void existsByPhone_returnsTrueAfterSave() {
        Guest guest = new Guest();
        guest.setFullName("Nguyen Van A");
        guest.setPhone("+84911222333");
        guest.setCreatedAt(LocalDateTime.now());

        guestRepository.saveAndFlush(guest);

        assertThat(guestRepository.existsByPhone("+84911222333")).isTrue();
        assertThat(guestRepository.findByPhone("+84911222333")).isPresent();
    }

    @Test
    void save_duplicatePhone_violatesUniqueConstraint() {
        Guest first = new Guest();
        first.setFullName("Nguyen Van A");
        first.setPhone("+84911222444");
        first.setCreatedAt(LocalDateTime.now());
        guestRepository.saveAndFlush(first);

        Guest second = new Guest();
        second.setFullName("Tran Thi B");
        second.setPhone("+84911222444");
        second.setCreatedAt(LocalDateTime.now());

        assertThatThrownBy(() -> guestRepository.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
