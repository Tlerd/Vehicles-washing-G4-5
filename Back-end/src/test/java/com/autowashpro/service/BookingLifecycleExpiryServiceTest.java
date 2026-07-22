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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class BookingLifecycleExpiryServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 22, 8, 15);

    private BookingRepository bookings;
    private PaymentRepository payments;
    private VoucherRepository vouchers;
    private SlotReservationRepository reservations;
    private AuditLogRepository audits;
    private BookingLifecycleExpiryService service;

    @BeforeEach
    void setUp() {
        bookings = mock(BookingRepository.class);
        payments = mock(PaymentRepository.class);
        vouchers = mock(VoucherRepository.class);
        reservations = mock(SlotReservationRepository.class);
        audits = mock(AuditLogRepository.class);
        service = new BookingLifecycleExpiryService(
                bookings, payments, vouchers, reservations, audits);
    }

    @Test
    void exactBoundary_expiresWholeAggregateInRequiredLockOrder() {
        Voucher voucher = lockedVoucher(9L, 41L);
        Booking booking = dueBooking(41L, NOW, voucher);
        Payment pending = payment("PENDING");
        SlotReservation firstHold = reservation(1L, "HOLD");
        SlotReservation secondHold = reservation(2L, "HOLD");
        stubAggregate(booking, List.of(pending), Optional.of(voucher),
                List.of(firstHold, secondHold));

        int expired = service.expireDue(NOW, 25);

        assertThat(expired).isOne();
        assertThat(booking.getStatus()).isEqualTo("EXPIRED");
        assertThat(booking.getDepositExpiresAt()).isNull();
        assertThat(voucher.getStatus()).isEqualTo("ACTIVE");
        assertThat(voucher.getLockedBookingId()).isNull();
        assertThat(pending.getStatus()).isEqualTo("PENDING");
        verify(reservations).delete(firstHold);
        verify(reservations).delete(secondHold);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(audits).save(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertThat(audit.getEntityType()).isEqualTo("BOOKING");
        assertThat(audit.getEntityId()).isEqualTo("41");
        assertThat(audit.getAction()).isEqualTo("STATUS_CHANGED");
        assertThat(audit.getOldValue()).isEqualTo("{\"status\":\"PENDING_DEPOSIT\"}");
        assertThat(audit.getNewValue()).isEqualTo("{\"status\":\"EXPIRED\"}");
        assertThat(audit.getReason()).isEqualTo("DEPOSIT_TIMEOUT");
        assertThat(audit.getActorId()).isEqualTo("SYSTEM");
        assertThat(audit.getActorRole()).isEqualTo("SYSTEM");
        assertThat(audit.getCreatedAt()).isEqualTo(NOW);

        InOrder locks = inOrder(bookings, payments, vouchers, reservations, audits);
        locks.verify(bookings).findDueIdsForExpiry(NOW, 25);
        locks.verify(bookings).findByIdForUpdate(41L);
        locks.verify(payments).findByBookingIdForUpdate(41L);
        locks.verify(vouchers).findByIdForUpdate(9L);
        locks.verify(reservations).findByBookingIdForUpdate(41L);
        locks.verify(reservations).delete(firstHold);
        locks.verify(reservations).delete(secondHold);
        locks.verify(audits).save(any(AuditLog.class));
    }

    @Test
    void bookingNoLongerDueAfterLock_isNoOpBeforeDependentLocks() {
        Booking booking = dueBooking(41L, NOW.plusNanos(100), null);
        when(bookings.findDueIdsForExpiry(NOW, 25)).thenReturn(List.of(41L));
        when(bookings.findByIdForUpdate(41L)).thenReturn(Optional.of(booking));

        assertThat(service.expireDue(NOW, 25)).isZero();

        assertThat(booking.getStatus()).isEqualTo("PENDING_DEPOSIT");
        verifyNoInteractions(payments, vouchers, reservations, audits);
    }

    @Test
    void successfulPayment_failsClosedWithoutReleasingAnything() {
        Voucher voucher = lockedVoucher(9L, 41L);
        Booking booking = dueBooking(41L, NOW.minusMinutes(1), voucher);
        when(bookings.findDueIdsForExpiry(NOW, 25)).thenReturn(List.of(41L));
        when(bookings.findByIdForUpdate(41L)).thenReturn(Optional.of(booking));
        when(payments.findByBookingIdForUpdate(41L))
                .thenReturn(List.of(payment("PENDING"), payment("SUCCESS")));

        assertThat(service.expireDue(NOW, 25)).isZero();

        assertThat(booking.getStatus()).isEqualTo("PENDING_DEPOSIT");
        assertThat(voucher.getStatus()).isEqualTo("LOCKED");
        verifyNoInteractions(vouchers, reservations, audits);
    }

    @Test
    void bookedReservationInvariant_failsClosedAndNeverDeletesCapacity() {
        Voucher voucher = lockedVoucher(9L, 41L);
        Booking booking = dueBooking(41L, NOW.minusMinutes(1), voucher);
        SlotReservation hold = reservation(1L, "HOLD");
        SlotReservation booked = reservation(2L, "BOOKED");
        stubAggregate(booking, List.of(payment("FAILED")), Optional.of(voucher),
                List.of(hold, booked));

        assertThat(service.expireDue(NOW, 25)).isZero();

        assertThat(booking.getStatus()).isEqualTo("PENDING_DEPOSIT");
        assertThat(voucher.getStatus()).isEqualTo("LOCKED");
        verify(reservations, never()).delete(any());
        verifyNoInteractions(audits);
    }

    @Test
    void mismatchedVoucherLock_failsClosed() {
        Voucher voucher = lockedVoucher(9L, 99L);
        Booking booking = dueBooking(41L, NOW.minusMinutes(1), voucher);
        stubAggregate(booking, List.of(), Optional.of(voucher), List.of());

        assertThat(service.expireDue(NOW, 25)).isZero();

        assertThat(booking.getStatus()).isEqualTo("PENDING_DEPOSIT");
        assertThat(voucher.getStatus()).isEqualTo("LOCKED");
        verify(reservations, never()).delete(any());
        verifyNoInteractions(audits);
    }

    @Test
    void rerunAfterCommittedTransition_createsNoSecondAudit() {
        Booking booking = dueBooking(41L, NOW, null);
        when(bookings.findDueIdsForExpiry(NOW, 25))
                .thenReturn(List.of(41L), List.of());
        when(bookings.findByIdForUpdate(41L)).thenReturn(Optional.of(booking));
        when(payments.findByBookingIdForUpdate(41L)).thenReturn(List.of());
        when(reservations.findByBookingIdForUpdate(41L)).thenReturn(List.of());

        assertThat(service.expireDue(NOW, 25)).isOne();
        assertThat(service.expireDue(NOW, 25)).isZero();

        verify(audits).save(any(AuditLog.class));
    }

    private void stubAggregate(
            Booking booking,
            List<Payment> bookingPayments,
            Optional<Voucher> lockedVoucher,
            List<SlotReservation> bookingReservations) {
        when(bookings.findDueIdsForExpiry(NOW, 25)).thenReturn(List.of(booking.getBookingId()));
        when(bookings.findByIdForUpdate(booking.getBookingId())).thenReturn(Optional.of(booking));
        when(payments.findByBookingIdForUpdate(booking.getBookingId()))
                .thenReturn(bookingPayments);
        if (booking.getAppliedVoucher() != null) {
            when(vouchers.findByIdForUpdate(booking.getAppliedVoucher().getVoucherId()))
                    .thenReturn(lockedVoucher);
        }
        when(reservations.findByBookingIdForUpdate(booking.getBookingId()))
                .thenReturn(bookingReservations);
    }

    private Booking dueBooking(Long id, LocalDateTime expiresAt, Voucher voucher) {
        Booking booking = new Booking();
        booking.setBookingId(id);
        booking.setStatus("PENDING_DEPOSIT");
        booking.setDepositExpiresAt(expiresAt);
        booking.setAppliedVoucher(voucher);
        return booking;
    }

    private Voucher lockedVoucher(Long id, Long bookingId) {
        Voucher voucher = new Voucher();
        voucher.setVoucherId(id);
        voucher.setStatus("LOCKED");
        voucher.setLockedBookingId(bookingId);
        return voucher;
    }

    private Payment payment(String status) {
        Payment payment = new Payment();
        payment.setStatus(status);
        return payment;
    }

    private SlotReservation reservation(Long id, String status) {
        SlotReservation reservation = new SlotReservation();
        reservation.setReservationId(id);
        reservation.setStatus(status);
        return reservation;
    }
}
