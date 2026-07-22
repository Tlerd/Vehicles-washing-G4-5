package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.IdempotencyRecord;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.Voucher;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingEngineIntegrityIntegrationTest extends RepositoryIntegrationTest {

    @Autowired private BranchRepository branches;
    @Autowired private CustomerRepository customers;
    @Autowired private VehicleRepository vehicles;
    @Autowired private BookingRepository bookings;
    @Autowired private VoucherRepository vouchers;
    @Autowired private GuestRepository guests;
    @Autowired private IdempotencyRecordRepository idempotencyRecords;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void activeCustomerGuard_allowsPendingRowsButRejectsSecondConfirmedBooking() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Active Guard"));
        Customer customer = customers.saveAndFlush(
                BookingTestFixtures.newCustomer("+84919000001"));
        Vehicle vehicle = vehicles.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "51A-90001"));

        Booking first = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-GUARD1");
        Booking second = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-GUARD2");
        bookings.saveAndFlush(first);
        bookings.saveAndFlush(second);
        assertThat(first.getBookingId()).isNotEqualTo(second.getBookingId());

        first.setStatus("CONFIRMED");
        bookings.saveAndFlush(first);
        second.setStatus("CONFIRMED");

        assertThatThrownBy(() -> bookings.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("UX_bookings_active_customer");
        entityManager.clear();
    }

    @Test
    void activeGuestGuard_allowsPendingRowsButRejectsSecondConfirmedBooking() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Guest Active Guard"));
        Guest guest = new Guest();
        guest.setFullName("Guest Guard");
        guest.setPhone("+84919000101");
        guest.setLicensePlate("51A-90101");
        guest.setVehicleBrand("Toyota");
        guest.setVehicleSize(VehicleSize.SEDAN);
        guest.setCreatedAt(LocalDateTime.now());
        guest = guests.saveAndFlush(guest);

        Booking first = guestBooking(guest, branch, "AWP-GGARD1");
        Booking second = guestBooking(guest, branch, "AWP-GGARD2");
        bookings.saveAndFlush(first);
        bookings.saveAndFlush(second);

        first.setStatus("CONFIRMED");
        bookings.saveAndFlush(first);
        second.setStatus("CONFIRMED");
        assertThatThrownBy(() -> bookings.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("UX_bookings_active_guest");
        entityManager.clear();
    }

    @Test
    void nonLegacyPendingDeposit_withoutPositiveDepositAndExpiry_isRejected() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Pending Guard"));
        Customer customer = customers.saveAndFlush(
                BookingTestFixtures.newCustomer("+84919000002"));
        Vehicle vehicle = vehicles.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "51A-90002"));
        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-PEND01");
        booking.setLegacyFinancialSnapshot(false);
        booking.setBookingMode("FLEXIBLE");
        booking.setDepositAmount(BigDecimal.ZERO);
        booking.setDepositExpiresAt(null);

        assertThatThrownBy(() -> bookings.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_bookings_pending_expiry");
        entityManager.clear();
    }

    @Test
    void voucherLock_mustPointToBookingThatAppliedThatVoucher() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Voucher Guard"));
        Customer customer = customers.saveAndFlush(
                BookingTestFixtures.newCustomer("+84919000003"));
        Vehicle vehicle = vehicles.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "51A-90003"));
        Voucher applied = vouchers.saveAndFlush(voucher(customer, "V-GUARD-A"));
        Voucher different = vouchers.saveAndFlush(voucher(customer, "V-GUARD-B"));

        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-VOUCH1");
        booking.setAppliedVoucher(applied);
        booking = bookings.saveAndFlush(booking);

        different.setStatus("LOCKED");
        different.setLockedBookingId(booking.getBookingId());
        assertThatThrownBy(() -> vouchers.saveAndFlush(different))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("FK_vouchers_locked_booking");
        entityManager.clear();
    }

    @Test
    void idempotencyRecord_overTwentyFourHours_isRejected() {
        LocalDateTime now = LocalDateTime.now();
        IdempotencyRecord record = new IdempotencyRecord();
        record.setScopedKeyHash("6".repeat(64));
        record.setRequestPath("/api/v1/bookings");
        record.setCustomerId(999L);
        record.setRequestHash("7".repeat(64));
        record.setPrincipalScopeHash("8".repeat(64));
        record.setClientKeyHash("9".repeat(64));
        record.setResponseStatus(201);
        record.setResponseBody("{}");
        record.setCreatedAt(now);
        record.setExpiresAt(now.plusHours(24).plusSeconds(1));

        assertThatThrownBy(() -> idempotencyRecords.saveAndFlush(record))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_idempotency_expiry");
        entityManager.clear();
    }

    @Test
    void guestIdempotency_withoutVerifiedPhone_isRejected() {
        IdempotencyRecord record = idempotencyRecord("a", "b", "c");
        record.setGuestProofHash("d".repeat(64));

        assertThatThrownBy(() -> idempotencyRecords.saveAndFlush(record))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_idempotency_actor");
        entityManager.clear();
    }

    @Test
    void sameActorAndClientKey_cannotCreateSecondIdempotencyRecord() {
        IdempotencyRecord first = idempotencyRecord("1", "2", "3");
        first.setCustomerId(41L);
        idempotencyRecords.saveAndFlush(first);

        IdempotencyRecord second = idempotencyRecord("4", "2", "3");
        second.setCustomerId(41L);
        assertThatThrownBy(() -> idempotencyRecords.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("UX_idempotency_actor_key");
        entityManager.clear();
    }

    @Test
    void sameGuestProof_cannotAuthorizeTwoDifferentIdempotencyResults() {
        IdempotencyRecord first = idempotencyRecord("a", "b", "c");
        first.setGuestPhone("+84901110001");
        first.setGuestProofHash("d".repeat(64));
        idempotencyRecords.saveAndFlush(first);

        IdempotencyRecord second = idempotencyRecord("1", "2", "3");
        second.setGuestPhone("+84901110002");
        second.setGuestProofHash("d".repeat(64));
        assertThatThrownBy(() -> idempotencyRecords.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("IX_idempotency_guest_replay");
        entityManager.clear();
    }

    @Test
    void nonLegacyConfirmedBooking_withStaleDepositExpiry_isRejected() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Confirmed Expiry Guard"));
        Customer customer = customers.saveAndFlush(
                BookingTestFixtures.newCustomer("+84919000004"));
        Vehicle vehicle = vehicles.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "51A-90004"));
        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-EXPIR1");
        booking.setLegacyFinancialSnapshot(false);
        booking.setBookingMode("FLEXIBLE");
        booking.setStatus("CONFIRMED");
        booking.setDepositExpiresAt(booking.getCreatedAt().plusMinutes(15));

        assertThatThrownBy(() -> bookings.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_bookings_pending_expiry");
        entityManager.clear();
    }

    private Voucher voucher(Customer customer, String code) {
        Voucher voucher = new Voucher();
        voucher.setCustomer(customer);
        voucher.setVoucherCode(code);
        voucher.setVoucherType("DISCOUNT_FIXED");
        voucher.setDiscountAmount(new BigDecimal("50000"));
        voucher.setStatus("ACTIVE");
        voucher.setExpiredAt(LocalDate.now().plusMonths(1));
        return voucher;
    }

    private IdempotencyRecord idempotencyRecord(
            String scopedCharacter, String principalCharacter, String clientCharacter) {
        LocalDateTime now = LocalDateTime.now();
        IdempotencyRecord record = new IdempotencyRecord();
        record.setScopedKeyHash(scopedCharacter.repeat(64));
        record.setRequestPath("/api/v1/bookings");
        record.setRequestHash("e".repeat(64));
        record.setPrincipalScopeHash(principalCharacter.repeat(64));
        record.setClientKeyHash(clientCharacter.repeat(64));
        record.setResponseStatus(201);
        record.setResponseBody("{}");
        record.setCreatedAt(now);
        record.setExpiresAt(now.plusHours(24));
        return record;
    }

    private Booking guestBooking(Guest guest, Branch branch, String ref) {
        Booking booking = new Booking();
        booking.setBookingRef(ref);
        booking.setGuest(guest);
        booking.setGuestLicensePlate(guest.getLicensePlate());
        booking.setGuestVehicleBrand(guest.getVehicleBrand());
        booking.setGuestVehicleSize(guest.getVehicleSize());
        booking.setBranch(branch);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setBookingTime(java.time.LocalTime.of(10, 0));
        booking.setStatus("PENDING_DEPOSIT");
        booking.setCreatedAt(LocalDateTime.now());
        booking.setLegacyFinancialSnapshot(true);
        return booking;
    }
}
