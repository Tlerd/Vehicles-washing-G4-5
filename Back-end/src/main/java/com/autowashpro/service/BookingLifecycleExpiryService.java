package com.autowashpro.service;

import com.autowashpro.entity.AuditLog;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Payment;
import com.autowashpro.entity.SlotReservation;
import com.autowashpro.entity.Voucher;
import com.autowashpro.repository.AuditLogRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.PaymentRepository;
import com.autowashpro.repository.SlotReservationRepository;
import com.autowashpro.repository.VoucherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BookingLifecycleExpiryService {

    private static final Logger log = LoggerFactory.getLogger(BookingLifecycleExpiryService.class);
    private static final String PENDING_DEPOSIT = "PENDING_DEPOSIT";
    private static final String EXPIRED = "EXPIRED";

    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final VoucherRepository vouchers;
    private final SlotReservationRepository reservations;
    private final AuditLogRepository audits;

    public BookingLifecycleExpiryService(
            BookingRepository bookings,
            PaymentRepository payments,
            VoucherRepository vouchers,
            SlotReservationRepository reservations,
            AuditLogRepository audits) {
        this.bookings = bookings;
        this.payments = payments;
        this.vouchers = vouchers;
        this.reservations = reservations;
        this.audits = audits;
    }

    @Transactional(timeout = 5)
    public int expireDue(LocalDateTime now, int batchSize) {
        if (now == null) {
            throw new IllegalArgumentException("Expiry time is required.");
        }
        if (batchSize < 1 || batchSize > 100) {
            throw new IllegalArgumentException("Expiry batch size must be between 1 and 100.");
        }

        int expiredCount = 0;
        for (Long bookingId : bookings.findDueIdsForExpiry(now, batchSize)) {
            if (expireLockedAggregate(bookingId, now)) {
                expiredCount++;
            }
        }
        return expiredCount;
    }

    private boolean expireLockedAggregate(Long bookingId, LocalDateTime now) {
        Optional<Booking> lockedBooking = bookings.findByIdForUpdate(bookingId);
        if (lockedBooking.isEmpty()) {
            return false;
        }
        Booking booking = lockedBooking.get();
        if (!isDue(booking, now)) {
            return false;
        }

        List<Payment> lockedPayments = payments.findByBookingIdForUpdate(bookingId);
        if (lockedPayments.stream().map(Payment::getStatus)
                .anyMatch(status -> "SUCCESS".equalsIgnoreCase(status))) {
            warnSkipped(bookingId, "SUCCESS_PAYMENT");
            return false;
        }

        Voucher lockedVoucher = null;
        if (booking.getAppliedVoucher() != null) {
            Long voucherId = booking.getAppliedVoucher().getVoucherId();
            if (voucherId == null) {
                warnSkipped(bookingId, "MISSING_VOUCHER_ID");
                return false;
            }
            Optional<Voucher> voucher = vouchers.findByIdForUpdate(voucherId);
            if (voucher.isEmpty()) {
                warnSkipped(bookingId, "MISSING_VOUCHER");
                return false;
            }
            lockedVoucher = voucher.get();
        }

        List<SlotReservation> lockedReservations =
                reservations.findByBookingIdForUpdate(bookingId);
        if (lockedReservations.stream()
                .anyMatch(reservation -> !"HOLD".equals(reservation.getStatus()))) {
            warnSkipped(bookingId, "NON_HOLD_RESERVATION");
            return false;
        }
        if (lockedVoucher != null && !isOwnedLock(lockedVoucher, bookingId)) {
            warnSkipped(bookingId, "VOUCHER_LOCK_MISMATCH");
            return false;
        }

        booking.setStatus(EXPIRED);
        booking.setDepositExpiresAt(null);
        if (lockedVoucher != null) {
            lockedVoucher.setStatus("ACTIVE");
            lockedVoucher.setLockedBookingId(null);
        }
        lockedReservations.forEach(reservations::delete);
        audits.save(expiryAudit(bookingId, now));
        return true;
    }

    private boolean isDue(Booking booking, LocalDateTime now) {
        return PENDING_DEPOSIT.equals(booking.getStatus())
                && booking.getDepositExpiresAt() != null
                && !booking.getDepositExpiresAt().isAfter(now);
    }

    private boolean isOwnedLock(Voucher voucher, Long bookingId) {
        return "LOCKED".equals(voucher.getStatus())
                && bookingId.equals(voucher.getLockedBookingId());
    }

    private AuditLog expiryAudit(Long bookingId, LocalDateTime now) {
        AuditLog audit = new AuditLog();
        audit.setEntityType("BOOKING");
        audit.setEntityId(bookingId.toString());
        audit.setAction("STATUS_CHANGED");
        audit.setOldValue("{\"status\":\"PENDING_DEPOSIT\"}");
        audit.setNewValue("{\"status\":\"EXPIRED\"}");
        audit.setReason("DEPOSIT_TIMEOUT");
        audit.setActorId("SYSTEM");
        audit.setActorRole("SYSTEM");
        audit.setCreatedAt(now);
        return audit;
    }

    private void warnSkipped(Long bookingId, String reason) {
        log.warn("Skipped expiry for bookingId={} due to invariant={}", bookingId, reason);
    }
}
