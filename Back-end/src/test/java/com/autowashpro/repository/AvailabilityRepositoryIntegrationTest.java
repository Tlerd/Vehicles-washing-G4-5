package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.SlotReservation;
import com.autowashpro.entity.Vehicle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvailabilityRepositoryIntegrationTest extends RepositoryIntegrationTest {

    @Autowired private BranchRepository branches;
    @Autowired private BayRepository bays;
    @Autowired private CustomerRepository customers;
    @Autowired private VehicleRepository vehicles;
    @Autowired private BookingRepository bookings;
    @Autowired private SlotReservationRepository reservations;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void blockingSlotQuery_usesHalfOpenRangeAndTreatsPhysicalHoldsAsBlockingUntilLifecycleCleanup() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Availability Query"));
        Bay bay = bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(4);
        LocalDateTime now = date.atTime(8, 0);

        saveReservation(branch, bay, booking(branch, date, "AWP-AVQ001"),
                date.atTime(9, 0), "BOOKED", null);
        saveReservation(branch, bay, booking(branch, date, "AWP-AVQ002"),
                date.atTime(9, 15), "HOLD", now.plusMinutes(1));
        saveReservation(branch, bay, booking(branch, date, "AWP-AVQ003"),
                date.atTime(9, 30), "HOLD", now);
        saveReservation(branch, bay, booking(branch, date, "AWP-AVQ004"),
                date.atTime(9, 45), "HOLD", now.minusMinutes(1));
        saveReservation(branch, bay, booking(branch, date, "AWP-AVQ005"),
                date.atTime(10, 0), "BOOKED", null);

        List<SlotReservationRepository.BlockingSlotProjection> result =
                reservations.findBlockingSlots(
                        branch.getBranchId(), date.atTime(9, 0), date.atTime(10, 0));

        assertThat(result).extracting(SlotReservationRepository.BlockingSlotProjection::getSlotTime)
                .containsExactlyInAnyOrder(
                        date.atTime(9, 0), date.atTime(9, 15),
                        date.atTime(9, 30), date.atTime(9, 45));
    }

    @Test
    void activeBayQuery_excludesDisabledBaysAndHasStableCodeOrder() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Active Bay Query"));
        bays.saveAndFlush(newBay(branch, "U1", "UNIVERSAL", true));
        bays.saveAndFlush(newBay(branch, "Q2", "QUICK", true));
        bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        bays.saveAndFlush(newBay(branch, "D1", "DETAIL", false));

        assertThat(bays.findActiveByBranchId(branch.getBranchId()))
                .extracting(Bay::getBayCode)
                .containsExactly("Q1", "Q2", "U1");
    }

    @Test
    void legacyCandidateQuery_returnsOnlyRequestedNonterminalStatuses() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Legacy Availability"));
        LocalDate date = LocalDate.now().plusDays(5);
        Booking confirmed = booking(branch, date, "AWP-LEG001");
        confirmed.setStatus("CONFIRMED");
        confirmed.setLegacyFinancialSnapshot(true);
        bookings.saveAndFlush(confirmed);
        Booking completed = booking(branch, date, "AWP-LEG002");
        completed.setStatus("COMPLETED");
        completed.setLegacyFinancialSnapshot(true);
        bookings.saveAndFlush(completed);
        Booking unmarked = booking(branch, date, "AWP-LEG003");
        unmarked.setStatus("CONFIRMED");
        unmarked.setLegacyFinancialSnapshot(false);
        unmarked.setBookingMode("FLEXIBLE");
        bookings.saveAndFlush(unmarked);
        Booking pending = booking(branch, date, "AWP-LEG004");
        pending.setStatus("PENDING");
        pending.setLegacyFinancialSnapshot(true);
        bookings.saveAndFlush(pending);

        List<BookingRepository.LegacyAvailabilityProjection> result =
                bookings.findLegacyAvailabilityCandidates(
                        branch.getBranchId(), date, List.of("CONFIRMED"));

        assertThat(result).extracting(BookingRepository.LegacyAvailabilityProjection::getBookingId)
                .containsExactly(confirmed.getBookingId());
    }

    @Test
    void slotGridConstraint_rejectsOffGridTimestamp() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Grid Constraint"));
        Bay bay = bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(6);
        Booking booking = booking(branch, date, "AWP-GRID01");
        booking.setAssignedBay(bay);
        bookings.saveAndFlush(booking);

        SlotReservation offGrid = reservation(
                branch, bay, booking, date.atTime(9, 1), "BOOKED", null);

        assertThatThrownBy(() -> reservations.saveAndFlush(offGrid))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_slot_reservations_grid");
        entityManager.clear();
    }

    @Test
    void slotExpiryConstraint_rejectsHoldWithoutExpiry() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Expiry Constraint"));
        Bay bay = bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(7);
        Booking booking = booking(branch, date, "AWP-EXP001");
        booking.setAssignedBay(bay);
        bookings.saveAndFlush(booking);

        SlotReservation invalid = reservation(
                branch, bay, booking, date.atTime(9, 0), "HOLD", null);

        assertThatThrownBy(() -> reservations.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_slot_reservations_expiry");
        entityManager.clear();
    }

    @Test
    void slotExpiryConstraint_rejectsBookedReservationWithExpiry() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Booked Expiry Constraint"));
        Bay bay = bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(8);
        Booking booking = booking(branch, date, "AWP-EXP002");
        booking.setAssignedBay(bay);
        bookings.saveAndFlush(booking);

        SlotReservation invalid = reservation(
                branch, bay, booking, date.atTime(9, 0), "BOOKED",
                date.atTime(8, 0));

        assertThatThrownBy(() -> reservations.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_slot_reservations_expiry");
        entityManager.clear();
    }

    @Test
    void reservationBookingAssignmentConstraint_rejectsCrossBranchBooking() {
        Branch reservationBranch = branches.saveAndFlush(
                BookingTestFixtures.newBranch("Reservation Branch"));
        Branch bookingBranch = branches.saveAndFlush(
                BookingTestFixtures.newBranch("Different Booking Branch"));
        Bay bay = bays.saveAndFlush(newBay(reservationBranch, "Q1", "QUICK", true));
        Bay bookingBay = bays.saveAndFlush(newBay(bookingBranch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(9);
        Booking booking = booking(bookingBranch, date, "AWP-XBR001");
        booking.setAssignedBay(bookingBay);
        bookings.saveAndFlush(booking);

        SlotReservation invalid = reservation(
                reservationBranch, bay, booking, date.atTime(9, 0), "BOOKED", null);

        assertThatThrownBy(() -> reservations.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("FK_slot_reservations_booking_assignment");
        entityManager.clear();
    }

    @Test
    void expiredHoldCleanup_deletesOnlyHoldsAtOrBeforeBoundary() {
        Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Hold Cleanup"));
        Bay bay = bays.saveAndFlush(newBay(branch, "Q1", "QUICK", true));
        LocalDate date = LocalDate.now().plusDays(10);
        LocalDateTime now = date.atTime(8, 0);
        saveReservation(branch, bay, booking(branch, date, "AWP-CLN001"),
                date.atTime(9, 0), "HOLD", now);
        saveReservation(branch, bay, booking(branch, date, "AWP-CLN002"),
                date.atTime(9, 15), "HOLD", now.plusMinutes(1));
        saveReservation(branch, bay, booking(branch, date, "AWP-CLN003"),
                date.atTime(9, 30), "BOOKED", null);

        int deleted = reservations.deleteExpiredHolds(now);

        assertThat(deleted).isEqualTo(1);
        assertThat(reservations.findByBayBayIdAndSlotTimeBetween(
                bay.getBayId(), date.atTime(9, 0), date.atTime(9, 30)))
                .extracting(SlotReservation::getSlotTime)
                .containsExactlyInAnyOrder(date.atTime(9, 15), date.atTime(9, 30));
    }

    private Booking booking(Branch branch, LocalDate date, String ref) {
        Customer customer = customers.saveAndFlush(
                BookingTestFixtures.newCustomer("+849" + ref.substring(ref.length() - 6)));
        Vehicle vehicle = vehicles.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "T-" + ref.substring(ref.length() - 6)));
        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, ref);
        booking.setBookingDate(date);
        return bookings.saveAndFlush(booking);
    }

    private void saveReservation(
            Branch branch,
            Bay bay,
            Booking booking,
            LocalDateTime slotTime,
            String status,
            LocalDateTime expiresAt) {
        if (booking.getAssignedBay() == null) {
            booking.setAssignedBay(bay);
            bookings.saveAndFlush(booking);
        }
        reservations.saveAndFlush(reservation(
                branch, bay, booking, slotTime, status, expiresAt));
    }

    private SlotReservation reservation(
            Branch branch,
            Bay bay,
            Booking booking,
            LocalDateTime slotTime,
            String status,
            LocalDateTime expiresAt) {
        SlotReservation value = new SlotReservation();
        value.setBranch(branch);
        value.setBay(bay);
        value.setBooking(booking);
        value.setSlotTime(slotTime);
        value.setStatus(status);
        value.setExpiresAt(expiresAt);
        return value;
    }

    private Bay newBay(Branch branch, String code, String type, boolean active) {
        Bay bay = new Bay();
        bay.setBranch(branch);
        bay.setBayCode(code);
        bay.setBayType(type);
        bay.setActive(active);
        bay.setCreatedAt(LocalDateTime.now());
        return bay;
    }
}
