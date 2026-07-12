package com.autowashpro.service.impl;

import com.autowashpro.dto.request.BookingRequest;
import com.autowashpro.dto.response.AvailableSlotsResponse;
import com.autowashpro.dto.response.BookingResponse;
import com.autowashpro.dto.response.TimeSlotResponse;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.BookingService;
import com.autowashpro.entity.BookingServiceId;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BookingServiceRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.ServiceRepository;
import com.autowashpro.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements com.autowashpro.service.BookingService {

    private final BookingRepository bookingRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;
    private final ServiceRepository serviceRepository;

    private static final Random RANDOM = new Random();

    private static final List<String> ACTIVE_STATUSES = List.of("PENDING", "CONFIRMED");

    private static final int SLOT_INTERVAL_MINUTES = 30;

    private static final LocalTime DEFAULT_OPEN_TIME = LocalTime.of(8, 0);

    private static final LocalTime DEFAULT_CLOSE_TIME = LocalTime.of(20, 0);

    private static final Map<VehicleSize, BigDecimal> SIZE_MULTIPLIERS = Map.of(
            VehicleSize.HATCHBACK, new BigDecimal("0.9"),
            VehicleSize.SEDAN, new BigDecimal("1.0"),
            VehicleSize.SUV, new BigDecimal("1.2"),
            VehicleSize.PICKUP, new BigDecimal("1.4")
    );

    private static final Map<String, Integer> TIER_BOOKING_WINDOW_DAYS = Map.of(
            "Member", 7,
            "Silver", 10,
            "Gold", 12,
            "Platinum", 14
    );

    @Override
    public BookingResponse createBooking(BookingRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng không tồn tại."));

        Vehicle vehicle = vehicleRepository
                .findByVehicleIdAndCustomerCustomerId(request.getVehicleId(), request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phương tiện không tồn tại hoặc không thuộc về khách hàng này."
                ));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh không tồn tại."));

        var services = serviceRepository.findAllById(request.getServiceIds());

        if (services.size() != new HashSet<>(request.getServiceIds()).size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều dịch vụ không tồn tại.");
        }

        validateBookingWindow(customer, request.getBookingDate());
        validateNotInThePast(request.getBookingDate(), request.getBookingTime());

        boolean hasActiveBooking = bookingRepository
                .existsByCustomerCustomerIdAndStatusIn(request.getCustomerId(), ACTIVE_STATUSES);

        if (hasActiveBooking) {
            throw new ConflictException(
                    "Khách hàng đã có một lịch đặt đang hoạt động (PENDING/CONFIRMED)."
            );
        }

        int totalDurationMinutes = services.stream()
                .mapToInt(s -> s.getDurationMinutes())
                .sum();

        List<LocalTime> requiredSlots = buildRequiredSlots(
                request.getBookingTime(),
                totalDurationMinutes,
                branch
        );

        Set<LocalTime> occupiedSlots = getOccupiedSlots(branch.getBranchId(), request.getBookingDate());

        boolean hasCollision = requiredSlots.stream().anyMatch(occupiedSlots::contains);

        if (hasCollision) {
            throw new BadRequestException(
                    "Khung giờ đã chọn không đủ chỗ trống liên tục cho tổng thời lượng dịch vụ."
            );
        }

        BigDecimal multiplier = SIZE_MULTIPLIERS.get(vehicle.getVehicleSize());
        BigDecimal totalPrice = services.stream()
                .map(s -> s.getBasePrice().multiply(multiplier))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = new Booking();
        booking.setBookingRef(generateUniqueBookingRef());
        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setBranch(branch);
        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        booking.setTotalPrice(totalPrice);
        booking.setStatus("PENDING");
        booking.setPointsEarned(null);
        booking.setCreatedAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        List<BookingService> bookingServices = services.stream()
                .map(s -> {
                    BookingService bookingService = new BookingService();
                    bookingService.setId(new BookingServiceId(savedBooking.getBookingId(), s.getServiceId()));
                    bookingService.setBooking(savedBooking);
                    bookingService.setService(s);
                    return bookingService;
                })
                .collect(Collectors.toList());

        bookingServiceRepository.saveAll(bookingServices);

        return toResponse(savedBooking, request.getServiceIds());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByCustomer(Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Khách hàng không tồn tại.");
        }

        return bookingRepository.findByCustomerCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(booking -> toResponse(booking, getServiceIds(booking.getBookingId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AvailableSlotsResponse getAvailableSlots(Long branchId, LocalDate date) {

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh không tồn tại."));

        LocalTime openTime = branch.getOpenTime() != null ? branch.getOpenTime() : DEFAULT_OPEN_TIME;
        LocalTime closeTime = branch.getCloseTime() != null ? branch.getCloseTime() : DEFAULT_CLOSE_TIME;

        Set<LocalTime> occupiedSlots = getOccupiedSlots(branchId, date);

        boolean isToday = date.isEqual(LocalDate.now());
        LocalTime now = LocalTime.now();

        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalTime cursor = openTime;

        while (cursor.isBefore(closeTime)) {
            boolean isPast = isToday && !cursor.isAfter(now);
            boolean available = !occupiedSlots.contains(cursor) && !isPast;
            slots.add(new TimeSlotResponse(cursor.toString(), available));
            cursor = cursor.plusMinutes(SLOT_INTERVAL_MINUTES);
        }

        return new AvailableSlotsResponse(date, branchId, slots);
    }

    private void validateBookingWindow(Customer customer, LocalDate bookingDate) {

        int windowDays = TIER_BOOKING_WINDOW_DAYS.getOrDefault(customer.getTier(), 7);
        LocalDate maxDate = LocalDate.now().plusDays(windowDays);

        if (bookingDate.isAfter(maxDate)) {
            throw new BadRequestException(
                    "Ngày đặt lịch vượt quá giới hạn " + windowDays
                            + " ngày cho hạng thành viên " + customer.getTier() + "."
            );
        }
    }

    private void validateNotInThePast(LocalDate bookingDate, LocalTime bookingTime) {

        if (bookingDate.isEqual(LocalDate.now()) && bookingTime.isBefore(LocalTime.now())) {
            throw new BadRequestException("Không thể đặt lịch vào một thời điểm đã qua.");
        }
    }

    private List<LocalTime> buildRequiredSlots(
            LocalTime startTime,
            int totalDurationMinutes,
            Branch branch
    ) {

        LocalTime openTime = branch.getOpenTime() != null ? branch.getOpenTime() : DEFAULT_OPEN_TIME;
        LocalTime closeTime = branch.getCloseTime() != null ? branch.getCloseTime() : DEFAULT_CLOSE_TIME;

        if (startTime.isBefore(openTime)) {
            throw new BadRequestException("Giờ đặt lịch trước giờ mở cửa chi nhánh.");
        }

        int slotCount = (int) Math.ceil(totalDurationMinutes / (double) SLOT_INTERVAL_MINUTES);

        List<LocalTime> slots = new ArrayList<>();
        LocalTime cursor = startTime;

        for (int i = 0; i < slotCount; i++) {
            slots.add(cursor);
            cursor = cursor.plusMinutes(SLOT_INTERVAL_MINUTES);
        }

        if (cursor.isAfter(closeTime)) {
            throw new BadRequestException("Tổng thời lượng dịch vụ vượt quá giờ đóng cửa chi nhánh.");
        }

        return slots;
    }

    private Set<LocalTime> getOccupiedSlots(Long branchId, LocalDate bookingDate) {

        var existingBookings = bookingRepository
                .findByBranchBranchIdAndBookingDateAndStatusIn(branchId, bookingDate, ACTIVE_STATUSES);

        Set<LocalTime> occupied = new HashSet<>();

        for (Booking existing : existingBookings) {

            var existingServices = bookingServiceRepository
                    .findByBooking_BookingId(existing.getBookingId());

            int duration = existingServices.stream()
                    .mapToInt(bs -> bs.getService().getDurationMinutes())
                    .sum();

            int slotCount = (int) Math.ceil(duration / (double) SLOT_INTERVAL_MINUTES);
            LocalTime cursor = existing.getBookingTime();

            for (int i = 0; i < slotCount; i++) {
                occupied.add(cursor);
                cursor = cursor.plusMinutes(SLOT_INTERVAL_MINUTES);
            }
        }

        return occupied;
    }

    private String generateUniqueBookingRef() {

        String ref;

        do {
            ref = "AWP-" + (1000 + RANDOM.nextInt(9000));
        } while (bookingRepository.existsByBookingRef(ref));

        return ref;
    }

    private List<Long> getServiceIds(Long bookingId) {
        return bookingServiceRepository.findByBooking_BookingId(bookingId)
                .stream()
                .map(bs -> bs.getService().getServiceId())
                .collect(Collectors.toList());
    }

    private BookingResponse toResponse(Booking booking, List<Long> serviceIds) {
        return new BookingResponse(
                booking.getBookingId(),
                booking.getBookingRef(),
                booking.getCustomer().getCustomerId(),
                booking.getVehicle().getVehicleId(),
                booking.getBranch().getBranchId(),
                booking.getBookingDate(),
                booking.getBookingTime(),
                serviceIds,
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getPointsEarned(),
                booking.getCreatedAt()
        );
    }
}
