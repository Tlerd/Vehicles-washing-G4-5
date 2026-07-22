package com.autowashpro.service;

import com.autowashpro.exception.custom.ServiceUnavailableException;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@Component
public class BookingAllocationLock {

    private static final Logger log = LoggerFactory.getLogger(BookingAllocationLock.class);
    static final int LOCK_TIMEOUT_MILLIS = 2_000;
    private static final String LOCK_SQL = """
            SET NOCOUNT ON;
            DECLARE @result int;
            EXEC @result = sys.sp_getapplock
                @Resource = ?,
                @LockMode = 'Exclusive',
                @LockOwner = 'Transaction',
                @LockTimeout = ?;
            SELECT @result;
            """;

    private final EntityManager entityManager;

    public BookingAllocationLock(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public void acquire(Long branchId, LocalDate vietnamBusinessDate) {
        if (branchId == null || vietnamBusinessDate == null) {
            throw new IllegalArgumentException("Branch and business date are required.");
        }
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("The allocation lock requires an active transaction.");
        }

        String resource = "booking-allocation:" + branchId + ':' + vietnamBusinessDate;
        Integer result = entityManager.unwrap(Session.class).doReturningWork(connection -> {
            try (PreparedStatement statement = connection.prepareStatement(LOCK_SQL)) {
                statement.setNString(1, resource);
                statement.setInt(2, LOCK_TIMEOUT_MILLIS);
                try (ResultSet values = statement.executeQuery()) {
                    return values.next() ? values.getInt(1) : null;
                }
            }
        });
        requireAcquired(result);
    }

    static void requireAcquired(Integer result) {
        if (result == null || result < 0) {
            log.warn("SQL Server allocation lock acquisition failed with code={}", result);
            throw new ServiceUnavailableException(
                    "Booking capacity is temporarily busy. Please retry.");
        }
    }
}
