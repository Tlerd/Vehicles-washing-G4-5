package com.autowashpro.repository;

import com.autowashpro.entity.Voucher;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByCustomerCustomerIdOrderByExpiredAtDesc(Long customerId);
    Optional<Voucher> findByVoucherIdAndCustomerCustomerId(Long voucherId, Long customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE v.voucherId = :voucherId " +
            "AND v.customer.customerId = :customerId")
    Optional<Voucher> findOwnedForUpdate(
            @Param("voucherId") Long voucherId,
            @Param("customerId") Long customerId);

    @Query(value = "SELECT * FROM dbo.vouchers WITH (UPDLOCK, ROWLOCK) " +
            "WHERE voucher_id = :voucherId", nativeQuery = true)
    @QueryHints(@QueryHint(name = "jakarta.persistence.query.timeout", value = "2000"))
    Optional<Voucher> findByIdForUpdate(@Param("voucherId") Long voucherId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.status = 'LOCKED', v.lockedBookingId = :bookingId " +
            "WHERE v.voucherId = :voucherId AND v.customer.customerId = :customerId " +
            "AND v.status = 'ACTIVE' AND v.lockedBookingId IS NULL AND v.expiredAt >= :today")
    int acquireForBooking(
            @Param("voucherId") Long voucherId,
            @Param("customerId") Long customerId,
            @Param("bookingId") Long bookingId,
            @Param("today") LocalDate today);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.status = 'ACTIVE', v.lockedBookingId = NULL " +
            "WHERE v.voucherId = :voucherId AND v.status = 'LOCKED' " +
            "AND v.lockedBookingId = :bookingId")
    int releaseFromBooking(
            @Param("voucherId") Long voucherId,
            @Param("bookingId") Long bookingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Voucher v SET v.status = 'USED', v.lockedBookingId = NULL, " +
            "v.redeemedAt = :completedAt WHERE v.voucherId = :voucherId " +
            "AND v.status = 'LOCKED' AND v.lockedBookingId = :bookingId")
    int consumeForBooking(
            @Param("voucherId") Long voucherId,
            @Param("bookingId") Long bookingId,
            @Param("completedAt") java.time.LocalDateTime completedAt);
}
