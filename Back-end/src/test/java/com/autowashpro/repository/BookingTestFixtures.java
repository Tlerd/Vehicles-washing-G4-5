package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

final class BookingTestFixtures {

    private BookingTestFixtures() {
    }

    static Branch newBranch(String name) {
        Branch branch = new Branch();
        branch.setBranchName(name);
        branch.setStatus("ACTIVE");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        return branch;
    }

    static Customer newCustomer(String phone) {
        Customer customer = new Customer();
        customer.setFullName("Test Customer");
        customer.setPhone(phone);
        customer.setEmail(phone + "@test.local");
        customer.setPasswordHash("hash");
        customer.setTier("MEMBER");
        customer.setRole("CUSTOMER");
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        return customer;
    }

    static Vehicle newVehicle(Customer customer, String plate) {
        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setLicensePlate(plate);
        vehicle.setBrand("Toyota");
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        vehicle.setIsDefault(true);
        return vehicle;
    }

    static Booking newBooking(Customer customer, Vehicle vehicle, Branch branch, String ref) {
        Booking booking = new Booking();
        booking.setBookingRef(ref);
        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setBranch(branch);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setBookingTime(LocalTime.of(9, 0));
        booking.setStatus("PENDING_DEPOSIT");
        booking.setCreatedAt(LocalDateTime.now());
        return booking;
    }
}
