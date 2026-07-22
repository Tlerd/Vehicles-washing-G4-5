package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.IdempotencyRecord;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.Voucher;
import com.autowashpro.service.BookingAllocationLock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class BookingConcurrencyPrimitivesIntegrationTest {

    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private BookingAllocationLock allocationLock;
    @Autowired private IdempotencyRecordRepository idempotencyRecords;
    @Autowired private BranchRepository branches;
    @Autowired private CustomerRepository customers;
    @Autowired private VehicleRepository vehicles;
    @Autowired private BookingRepository bookings;
    @Autowired private VoucherRepository vouchers;

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final List<String> idempotencyCleanup = new ArrayList<>();
    private final List<Long> bookingCleanup = new ArrayList<>();
    private Long voucherCleanup;
    private Long vehicleCleanup;
    private Long customerCleanup;
    private Long branchCleanup;

    @AfterEach
    void cleanup() {
        executor.shutdownNow();
        tx().executeWithoutResult(status -> {
            if (voucherCleanup != null) {
                Voucher voucher = vouchers.findById(voucherCleanup).orElse(null);
                if (voucher != null && voucher.getLockedBookingId() != null) {
                    vouchers.releaseFromBooking(voucher.getVoucherId(), voucher.getLockedBookingId());
                }
            }
            if (!bookingCleanup.isEmpty()) {
                bookings.deleteAllById(bookingCleanup);
                bookings.flush();
            }
            if (voucherCleanup != null) vouchers.deleteById(voucherCleanup);
            if (vehicleCleanup != null) vehicles.deleteById(vehicleCleanup);
            if (customerCleanup != null) customers.deleteById(customerCleanup);
            if (branchCleanup != null) branches.deleteById(branchCleanup);
            if (!idempotencyCleanup.isEmpty()) {
                idempotencyRecords.deleteAllById(idempotencyCleanup);
            }
        });
    }

    @Test
    void allocationAppLock_serializesSameBranchDateButNotDifferentResource() throws Exception {
        saveIdempotency("2", "4");
        saveIdempotency("3", "5");
        saveIdempotency("4", "6");
        CountDownLatch firstAcquired = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        LocalDate day = LocalDate.of(2026, 8, 10);

        Future<?> first = executor.submit(() -> tx().executeWithoutResult(status -> {
            idempotencyRecords.lockByScopedKeyHash("2".repeat(64)).orElseThrow();
            allocationLock.acquire(900_001L, day);
            firstAcquired.countDown();
            await(releaseFirst);
        }));
        if (!firstAcquired.await(5, TimeUnit.SECONDS)) {
            first.get(1, TimeUnit.SECONDS);
            throw new AssertionError("The first allocation lock was not acquired.");
        }

        Future<?> sameResource = executor.submit(() -> tx().executeWithoutResult(status -> {
            idempotencyRecords.lockByScopedKeyHash("3".repeat(64)).orElseThrow();
            allocationLock.acquire(900_001L, day);
        }));
        Future<?> differentResource = executor.submit(() -> tx().executeWithoutResult(status -> {
            idempotencyRecords.lockByScopedKeyHash("4".repeat(64)).orElseThrow();
            allocationLock.acquire(900_002L, day);
        }));

        differentResource.get(3, TimeUnit.SECONDS);
        assertThatThrownBy(() -> sameResource.get(300, TimeUnit.MILLISECONDS))
                .isInstanceOf(TimeoutException.class);

        releaseFirst.countDown();
        first.get(3, TimeUnit.SECONDS);
        sameResource.get(3, TimeUnit.SECONDS);
    }

    @Test
    void missingIdempotencyKeyRange_serializesSameKeyButNotDifferentGap() throws Exception {
        saveIdempotency("1", "a");
        saveIdempotency("5", "b");
        saveIdempotency("9", "c");
        String sameMissing = "4".repeat(64);
        String differentMissing = "8".repeat(64);
        CountDownLatch firstLocked = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);

        Future<?> first = executor.submit(() -> tx().executeWithoutResult(status -> {
            assertThat(idempotencyRecords.lockByScopedKeyHash(sameMissing)).isEmpty();
            firstLocked.countDown();
            await(releaseFirst);
        }));
        assertThat(firstLocked.await(5, TimeUnit.SECONDS)).isTrue();

        Future<?> sameKey = executor.submit(() -> tx().executeWithoutResult(status ->
                idempotencyRecords.lockByScopedKeyHash(sameMissing)));
        Future<?> differentKey = executor.submit(() -> tx().executeWithoutResult(status ->
                idempotencyRecords.lockByScopedKeyHash(differentMissing)));

        differentKey.get(3, TimeUnit.SECONDS);
        assertThatThrownBy(() -> sameKey.get(300, TimeUnit.MILLISECONDS))
                .isInstanceOf(TimeoutException.class);

        releaseFirst.countDown();
        first.get(3, TimeUnit.SECONDS);
        sameKey.get(3, TimeUnit.SECONDS);
    }

    @Test
    void voucherAcquisition_twoTransactions_exactlyOneWins() throws Exception {
        VoucherFixture fixture = createVoucherFixture();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Future<Integer> first = executor.submit(() -> acquireVoucher(
                fixture, fixture.firstBookingId(), ready, start));
        Future<Integer> second = executor.submit(() -> acquireVoucher(
                fixture, fixture.secondBookingId(), ready, start));
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();

        int firstResult = first.get(5, TimeUnit.SECONDS);
        int secondResult = second.get(5, TimeUnit.SECONDS);
        assertThat(firstResult + secondResult).isEqualTo(1);

        Voucher locked = vouchers.findById(fixture.voucherId()).orElseThrow();
        Long expectedWinner = firstResult == 1
                ? fixture.firstBookingId() : fixture.secondBookingId();
        assertThat(locked.getStatus()).isEqualTo("LOCKED");
        assertThat(locked.getLockedBookingId()).isEqualTo(expectedWinner);
    }

    @Test
    void dueExpiryWorkers_claimDisjointRowsAndSkipFutureRows() throws Exception {
        List<Long> dueIds = createDueBookings();
        CountDownLatch firstClaimed = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        LocalDateTime now = LocalDateTime.now();

        Future<Long> first = executor.submit(() -> tx().execute(status -> {
            Long id = bookings.findDueForExpiry(now, 1).get(0).getBookingId();
            firstClaimed.countDown();
            await(releaseFirst);
            status.setRollbackOnly();
            return id;
        }));
        assertThat(firstClaimed.await(5, TimeUnit.SECONDS)).isTrue();

        Future<Long> second = executor.submit(() -> tx().execute(status -> {
            Long id = bookings.findDueForExpiry(now, 1).get(0).getBookingId();
            status.setRollbackOnly();
            return id;
        }));
        Long secondId = second.get(5, TimeUnit.SECONDS);
        releaseFirst.countDown();
        Long firstId = first.get(5, TimeUnit.SECONDS);

        assertThat(List.of(firstId, secondId)).containsExactlyInAnyOrderElementsOf(dueIds);
    }

    private int acquireVoucher(
            VoucherFixture fixture, Long bookingId,
            CountDownLatch ready, CountDownLatch start) {
        ready.countDown();
        await(start);
        return tx().execute(status -> vouchers.acquireForBooking(
                fixture.voucherId(), fixture.customerId(), bookingId, LocalDate.now()));
    }

    private VoucherFixture createVoucherFixture() {
        return tx().execute(status -> {
            Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Voucher Race"));
            Customer customer = customers.saveAndFlush(
                    BookingTestFixtures.newCustomer("+84918880001"));
            Vehicle vehicle = vehicles.saveAndFlush(
                    BookingTestFixtures.newVehicle(customer, "51A-88001"));
            Voucher voucher = new Voucher();
            voucher.setCustomer(customer);
            voucher.setVoucherCode("RACE-" + System.nanoTime());
            voucher.setVoucherType("DISCOUNT_FIXED");
            voucher.setDiscountAmount(new BigDecimal("50000"));
            voucher.setStatus("ACTIVE");
            voucher.setExpiredAt(LocalDate.now().plusDays(30));
            voucher = vouchers.saveAndFlush(voucher);

            Booking first = BookingTestFixtures.newBooking(
                    customer, vehicle, branch, "AWP-RACE1-" + System.nanoTime());
            first.setAppliedVoucher(voucher);
            first = bookings.saveAndFlush(first);
            Booking second = BookingTestFixtures.newBooking(
                    customer, vehicle, branch, "AWP-RACE2-" + System.nanoTime());
            second.setAppliedVoucher(voucher);
            second = bookings.saveAndFlush(second);

            branchCleanup = branch.getBranchId();
            customerCleanup = customer.getCustomerId();
            vehicleCleanup = vehicle.getVehicleId();
            voucherCleanup = voucher.getVoucherId();
            bookingCleanup.add(first.getBookingId());
            bookingCleanup.add(second.getBookingId());
            return new VoucherFixture(voucher.getVoucherId(), customer.getCustomerId(),
                    first.getBookingId(), second.getBookingId());
        });
    }

    private List<Long> createDueBookings() {
        return tx().execute(status -> {
            Branch branch = branches.saveAndFlush(BookingTestFixtures.newBranch("Expiry Workers"));
            Customer customer = customers.saveAndFlush(
                    BookingTestFixtures.newCustomer("+84918880002"));
            Vehicle vehicle = vehicles.saveAndFlush(
                    BookingTestFixtures.newVehicle(customer, "51A-88002"));
            LocalDateTime now = LocalDateTime.now();
            Booking first = nonLegacyPending(customer, vehicle, branch,
                    "AWP-DUE1-" + System.nanoTime(), now.minusMinutes(30), now.minusMinutes(15));
            Booking second = nonLegacyPending(customer, vehicle, branch,
                    "AWP-DUE2-" + System.nanoTime(), now.minusMinutes(25), now.minusMinutes(10));
            Booking future = nonLegacyPending(customer, vehicle, branch,
                    "AWP-FUTURE-" + System.nanoTime(), now, now.plusMinutes(15));
            first = bookings.saveAndFlush(first);
            second = bookings.saveAndFlush(second);
            future = bookings.saveAndFlush(future);

            branchCleanup = branch.getBranchId();
            customerCleanup = customer.getCustomerId();
            vehicleCleanup = vehicle.getVehicleId();
            bookingCleanup.add(first.getBookingId());
            bookingCleanup.add(second.getBookingId());
            bookingCleanup.add(future.getBookingId());
            return List.of(first.getBookingId(), second.getBookingId());
        });
    }

    private Booking nonLegacyPending(
            Customer customer, Vehicle vehicle, Branch branch, String ref,
            LocalDateTime createdAt, LocalDateTime expiresAt) {
        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, ref);
        booking.setLegacyFinancialSnapshot(false);
        booking.setBookingMode("FLEXIBLE");
        booking.setCreatedAt(createdAt);
        booking.setDepositAmount(new BigDecimal("100000"));
        booking.setDepositExpiresAt(expiresAt);
        return booking;
    }

    private void saveIdempotency(String scopedCharacter, String principalCharacter) {
        tx().executeWithoutResult(status -> {
            LocalDateTime now = LocalDateTime.now();
            IdempotencyRecord record = new IdempotencyRecord();
            record.setScopedKeyHash(scopedCharacter.repeat(64));
            record.setRequestPath("/api/v1/bookings");
            record.setCustomerId(10L + idempotencyCleanup.size());
            record.setRequestHash("d".repeat(64));
            record.setPrincipalScopeHash(principalCharacter.repeat(64));
            record.setClientKeyHash("e".repeat(64));
            record.setResponseStatus(201);
            record.setResponseBody("{}");
            record.setCreatedAt(now);
            record.setExpiresAt(now.plusHours(24));
            idempotencyRecords.saveAndFlush(record);
            idempotencyCleanup.add(record.getScopedKeyHash());
        });
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(transactionManager);
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, TimeUnit.SECONDS)) {
                throw new AssertionError("Timed out waiting for concurrent test coordination.");
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new AssertionError("Concurrent test was interrupted.", interrupted);
        }
    }

    private record VoucherFixture(
            Long voucherId, Long customerId, Long firstBookingId, Long secondBookingId) {
    }
}
