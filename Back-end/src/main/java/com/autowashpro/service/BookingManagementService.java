package com.autowashpro.service;

import com.autowashpro.dto.booking.*;
import com.autowashpro.entity.*;
import com.autowashpro.exception.custom.*;
import com.autowashpro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.math.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class BookingManagementService {
    @Value("${autowash.payment.bank-code:VCB}") private String bankCode;
    @Value("${autowash.payment.account-number:1234567890}") private String accountNumber;
    @Value("${autowash.payment.account-name:VINAWASH CO. LTD}") private String accountName;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final PromotionRepository promotionRepository;

    public BookingResponse create(CreateBookingRequest r) {
        Customer customer = customerRepository.findById(r.getCustomerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (bookingRepository.existsByCustomerCustomerIdAndStatusIn(r.getCustomerId(), List.of("PENDING", "CONFIRMED")))
            throw new ConflictException("You already have an active booking.");
        Vehicle vehicle = resolveVehicle(r, customer);
        Branch branch = branchRepository.findById(r.getBranchId()).filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus()))
                .orElseThrow(() -> new ResourceNotFoundException("Active branch not found"));
        List<com.autowashpro.entity.Service> services = serviceRepository.findByServiceCodeIn(r.getServiceCodes());
        if (services.size() != new HashSet<>(r.getServiceCodes()).size() || services.stream().anyMatch(s -> !"ACTIVE".equalsIgnoreCase(s.getStatus())))
            throw new BadRequestException("One or more services are invalid or inactive");
        int duration = services.stream().mapToInt(s -> Optional.ofNullable(s.getDurationMinutes()).orElse(30)).sum();
        LocalTime endTime = r.getBookingTime().plusMinutes(duration);
        validateSchedule(branch, r.getBookingDate(), r.getBookingTime(), endTime);
        BigDecimal multiplier = switch (vehicle.getVehicleSize()) { case HATCHBACK -> new BigDecimal("0.9"); case SEDAN -> BigDecimal.ONE; case SUV -> new BigDecimal("1.2"); case PICKUP -> new BigDecimal("1.4"); };
        BigDecimal total = services.stream().map(com.autowashpro.entity.Service::getBasePrice).reduce(BigDecimal.ZERO, BigDecimal::add).multiply(multiplier).setScale(0, RoundingMode.HALF_UP);
        Voucher voucher = null;
        if (r.getVoucherId() != null) {
            voucher = voucherRepository.findByVoucherIdAndCustomerCustomerId(r.getVoucherId(), r.getCustomerId()).orElseThrow(() -> new ForbiddenException("Voucher does not belong to customer"));
            if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus()) || voucher.getExpiredAt().isBefore(LocalDate.now())) throw new BadRequestException("Voucher is not active");
            total = total.subtract(voucher.getDiscountAmount()).max(BigDecimal.ZERO);
            voucher.setStatus("LOCKED"); voucherRepository.save(voucher);
        }
        Booking b = new Booking();
        b.setBookingRef("AWP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()); b.setCustomer(customer); b.setVehicle(vehicle); b.setBranch(branch);
        b.setBookingDate(r.getBookingDate()); b.setBookingTime(r.getBookingTime()); b.setEndTime(endTime); b.setDurationMinutes(duration); b.setTotalPrice(total); b.setStatus("PENDING"); b.setPointsEarned(0); b.setAppliedVoucher(voucher); b.setCreatedAt(LocalDateTime.now());
        b = bookingRepository.save(b);
        for (com.autowashpro.entity.Service s : services) bookingServiceRepository.save(new com.autowashpro.entity.BookingService(new BookingServiceId(b.getBookingId(), s.getServiceId()), b, s));
        return toResponse(b);
    }

    private Vehicle resolveVehicle(CreateBookingRequest r, Customer customer) {
        if (r.getVehicleId() != null) return vehicleRepository.findByVehicleIdAndCustomerCustomerId(r.getVehicleId(), r.getCustomerId())
                .orElseThrow(() -> new ForbiddenException("Vehicle does not belong to customer"));
        if (r.getLicensePlate() == null || r.getLicensePlate().isBlank() || r.getBrand() == null || r.getBrand().isBlank() || r.getVehicleSize() == null)
            throw new BadRequestException("License plate, brand/model and vehicle size are required");
        String plate = r.getLicensePlate().trim().toUpperCase();
        if (vehicleRepository.existsByCustomerCustomerIdAndLicensePlateIgnoreCase(customer.getCustomerId(), plate)) throw new ConflictException("License plate already exists in your vehicle list");
        Vehicle v = new Vehicle(); v.setCustomer(customer); v.setLicensePlate(plate); v.setBrand(r.getBrand().trim());
        try { v.setVehicleSize(VehicleSize.valueOf(r.getVehicleSize().toUpperCase())); }
        catch (IllegalArgumentException ex) { throw new BadRequestException("Invalid vehicle size"); }
        v.setNotes("Created during booking"); v.setIsDefault(vehicleRepository.countByCustomerCustomerId(customer.getCustomerId()) == 0);
        return vehicleRepository.save(v);
    }

    private void validateSchedule(Branch branch, LocalDate date, LocalTime start, LocalTime end) {
        if (start.isBefore(branch.getOpenTime()) || end.isAfter(branch.getCloseTime()) || !end.isAfter(start))
            throw new BadRequestException("Selected services do not fit within branch operating hours");
        boolean overlaps = bookingRepository.findByBranchBranchIdAndBookingDateAndStatusNot(branch.getBranchId(), date, "CANCELLED").stream().anyMatch(existing -> {
            LocalTime existingEnd = existing.getEndTime() != null ? existing.getEndTime() : existing.getBookingTime().plusMinutes(Optional.ofNullable(existing.getDurationMinutes()).orElse(30));
            return start.isBefore(existingEnd) && end.isAfter(existing.getBookingTime());
        });
        if (overlaps) throw new ConflictException("This time range overlaps an existing booking");
    }

    @Transactional(readOnly = true) public List<BookingResponse> customerBookings(Long customerId) { return bookingRepository.findByCustomerCustomerIdOrderByCreatedAtDesc(customerId).stream().map(this::toResponse).toList(); }
    @Transactional(readOnly = true) public List<BookingResponse> queue(LocalDate date) { return bookingRepository.findByBookingDateOrderByBookingTimeAsc(date).stream().map(this::toResponse).toList(); }

    public BookingResponse transition(Long id, String requested) {
        Booking b = bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        String next = requested.toUpperCase();
        Map<String, Set<String>> allowed = Map.of("PENDING", Set.of("CONFIRMED", "CANCELLED"), "CONFIRMED", Set.of("CHECKED_IN", "CANCELLED"), "CHECKED_IN", Set.of("COMPLETED"));
        if (!allowed.getOrDefault(b.getStatus(), Set.of()).contains(next)) throw new BadRequestException("Invalid booking status transition: " + b.getStatus() + " -> " + next);
        b.setStatus(next);
        if ("CANCELLED".equals(next) && b.getAppliedVoucher() != null) { b.getAppliedVoucher().setStatus("ACTIVE"); voucherRepository.save(b.getAppliedVoucher()); }
        if ("COMPLETED".equals(next)) complete(b);
        return toResponse(bookingRepository.save(b));
    }

    private void complete(Booking b) {
        if (pointHistoryRepository.existsByBookingBookingIdAndActivityType(b.getBookingId(), "EARN")) throw new ConflictException("Points were already credited for this booking");
        Customer c = b.getCustomer();
        BigDecimal tierMultiplier = switch (c.getTier().toUpperCase()) { case "SILVER" -> new BigDecimal("1.1"); case "GOLD" -> new BigDecimal("1.2"); case "PLATINUM" -> new BigDecimal("1.3"); default -> BigDecimal.ONE; };
        BigDecimal campaignMultiplier = promotionRepository.findByStatusIgnoreCaseAndStartDateLessThanEqualAndEndDateGreaterThanEqual("ACTIVE", b.getBookingDate(), b.getBookingDate()).stream().filter(p -> "ALL".equalsIgnoreCase(p.getTargetTier()) || c.getTier().equalsIgnoreCase(p.getTargetTier())).map(Promotion::getDiscountPercent).max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
        int earned = b.getTotalPrice().divide(new BigDecimal("1000"), 0, RoundingMode.FLOOR).multiply(tierMultiplier).multiply(campaignMultiplier).intValue();
        b.setPointsEarned(earned); c.setAccumulatedPoints(c.getAccumulatedPoints() + earned); c.setTotalSpent(c.getTotalSpent().add(b.getTotalPrice())); c.setTotalWashes(c.getTotalWashes() + 1);
        c.setTier(c.getTotalWashes() >= 30 || c.getTotalSpent().compareTo(new BigDecimal("15000000")) >= 0 ? "Platinum" : c.getTotalWashes() >= 15 || c.getTotalSpent().compareTo(new BigDecimal("6000000")) >= 0 ? "Gold" : c.getTotalWashes() >= 5 || c.getTotalSpent().compareTo(new BigDecimal("2000000")) >= 0 ? "Silver" : "Member"); c.setUpdatedAt(LocalDateTime.now()); customerRepository.save(c);
        PointHistory h = new PointHistory(); h.setCustomer(c); h.setBooking(b); h.setPoints(earned); h.setActivityType("EARN"); h.setDescription("Points earned from " + b.getBookingRef()); h.setCreatedAt(LocalDateTime.now()); pointHistoryRepository.save(h);
        if (b.getAppliedVoucher() != null) { b.getAppliedVoucher().setStatus("USED"); b.getAppliedVoucher().setRedeemedAt(LocalDateTime.now()); voucherRepository.save(b.getAppliedVoucher()); }
        if (b.getTotalPrice().compareTo(new BigDecimal("300000")) > 0) {
            BigDecimal discount=b.getTotalPrice().compareTo(new BigDecimal("500000"))>0?new BigDecimal("100000"):new BigDecimal("50000");
            Voucher reward=new Voucher(); reward.setCustomer(c); reward.setVoucherCode("AUTO-"+UUID.randomUUID().toString().substring(0,8).toUpperCase()); reward.setVoucherType(discount.intValue()==100000?"DISCOUNT_100K":"DISCOUNT_50K"); reward.setDiscountAmount(discount); reward.setStatus("ACTIVE"); reward.setExpiredAt(LocalDate.now().plusMonths(3)); voucherRepository.save(reward);
        }
    }

    private BookingResponse toResponse(Booking b) {
        List<BookingService> bookingServices = bookingServiceRepository.findByBookingBookingId(b.getBookingId());
        List<Long> ids = bookingServices.stream().map(x -> x.getService().getServiceId()).toList();
        List<String> serviceNames = bookingServices.stream().map(x -> x.getService().getServiceName()).toList();
        String info = URLEncoder.encode(b.getBookingRef(), StandardCharsets.UTF_8);
        String qr = "https://img.vietqr.io/image/" + bankCode + "-" + accountNumber + "-compact2.png?amount=" + b.getTotalPrice().toPlainString() + "&addInfo=" + info + "&accountName=" + URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        return BookingResponse.builder().id(b.getBookingId()).bookingRef(b.getBookingRef())
                .customerId(b.getCustomer().getCustomerId()).customerName(b.getCustomer().getFullName()).customerPhone(b.getCustomer().getPhone())
                .vehicleId(b.getVehicle().getVehicleId()).licensePlate(b.getVehicle().getLicensePlate()).vehicleBrand(b.getVehicle().getBrand()).vehicleSize(b.getVehicle().getVehicleSize().name())
                .branchId(b.getBranch().getBranchId()).serviceIds(ids).serviceNames(serviceNames)
                .bookingDate(b.getBookingDate()).bookingTime(b.getBookingTime()).endTime(b.getEndTime()).durationMinutes(b.getDurationMinutes())
                .totalPrice(b.getTotalPrice()).status(b.getStatus()).pointsEarned(b.getPointsEarned())
                .appliedVoucherId(b.getAppliedVoucher() == null ? null : b.getAppliedVoucher().getVoucherId()).createdAt(b.getCreatedAt()).vietQrUrl(qr).build();
    }
}
