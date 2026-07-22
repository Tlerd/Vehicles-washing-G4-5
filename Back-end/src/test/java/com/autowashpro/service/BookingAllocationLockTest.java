package com.autowashpro.service;

import com.autowashpro.exception.custom.ServiceUnavailableException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class BookingAllocationLockTest {

    @Test
    void acquire_withoutTransaction_failsBeforeCallingDatabase() {
        EntityManager entityManager = mock(EntityManager.class);
        BookingAllocationLock lock = new BookingAllocationLock(entityManager);

        assertThatThrownBy(() -> lock.acquire(1L, LocalDate.of(2026, 7, 22)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("active transaction");
        verifyNoInteractions(entityManager);
    }

    @Test
    void requireAcquired_acceptsEverySuccessfulSqlServerReturnCode() {
        assertThatCode(() -> BookingAllocationLock.requireAcquired(0)).doesNotThrowAnyException();
        assertThatCode(() -> BookingAllocationLock.requireAcquired(1)).doesNotThrowAnyException();
    }

    @Test
    void requireAcquired_rejectsTimeoutCancellationDeadlockAndCallFailures() {
        for (int code : new int[]{-1, -2, -3, -999}) {
            assertThatThrownBy(() -> BookingAllocationLock.requireAcquired(code))
                    .isInstanceOf(ServiceUnavailableException.class)
                    .hasMessageContaining("temporarily busy");
        }
        assertThatThrownBy(() -> BookingAllocationLock.requireAcquired(null))
                .isInstanceOf(ServiceUnavailableException.class);
    }
}
