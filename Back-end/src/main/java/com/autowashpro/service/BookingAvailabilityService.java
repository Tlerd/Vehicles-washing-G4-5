package com.autowashpro.service;

import com.autowashpro.domain.booking.BayType;
import com.autowashpro.domain.booking.BookingDurationSummary;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.TrustedBookingSelection;
import com.autowashpro.dto.booking.AlternativeSlotResponse;
import com.autowashpro.dto.booking.SlotAvailabilityResponse;
import com.autowashpro.dto.booking.SlotOptionResponse;
import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.SlotReservationRepository;
import com.autowashpro.repository.TierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class BookingAvailabilityService {

    public static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int REQUIRED_SLOT_MINUTES = 15;
    private static final int GUEST_BOOKING_WINDOW_DAYS = 7;
    private static final List<String> LEGACY_BLOCKING_STATUSES = List.of(
            "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "AWAITING_CONFIRM");

    private final BranchRepository branches;
    private final BayRepository bays;
    private final SlotReservationRepository reservations;
    private final BookingRepository bookings;
    private final TrustedBookingCatalogService catalog;
    private final BookingDurationCalculator durationCalculator;
    private final CustomerRepository customers;
    private final TierRepository tiers;
    private final Clock clock;

    @Autowired
    public BookingAvailabilityService(
            BranchRepository branches,
            BayRepository bays,
            SlotReservationRepository reservations,
            BookingRepository bookings,
            TrustedBookingCatalogService catalog,
            BookingDurationCalculator durationCalculator,
            CustomerRepository customers,
            TierRepository tiers) {
        this(branches, bays, reservations, bookings, catalog, durationCalculator,
                customers, tiers, Clock.systemUTC());
    }

    BookingAvailabilityService(
            BranchRepository branches,
            BayRepository bays,
            SlotReservationRepository reservations,
            BookingRepository bookings,
            TrustedBookingCatalogService catalog,
            BookingDurationCalculator durationCalculator,
            CustomerRepository customers,
            TierRepository tiers,
            Clock clock) {
        this.branches = branches;
        this.bays = bays;
        this.reservations = reservations;
        this.bookings = bookings;
        this.catalog = catalog;
        this.durationCalculator = durationCalculator;
        this.customers = customers;
        this.tiers = tiers;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public SlotAvailabilityResponse findByServiceIds(
            Long branchId,
            LocalDate date,
            List<Long> serviceIds,
            List<Integer> quantities,
            Integer compatibilityDurationMinutes,
            Instant requestedStart,
            Long customerId) {
        if (serviceIds != null && !serviceIds.isEmpty()) {
            return availabilityForSelection(branchId, date,
                    catalog.resolveByIds(serviceIds, quantities), requestedStart, customerId);
        }
        if (quantities != null && !quantities.isEmpty()) {
            throw new BadRequestException("Quantities require matching service identifiers.");
        }
        return availabilityForCompatibilityDuration(
                branchId, date, compatibilityDurationMinutes, requestedStart, customerId);
    }

    @Transactional(readOnly = true)
    public SlotAvailabilityResponse findByServiceCodes(
            Long branchId,
            LocalDate date,
            List<String> serviceCodes,
            Instant requestedStart,
            Long customerId) {
        return availabilityForSelection(
                branchId, date, catalog.resolveByCodes(serviceCodes), requestedStart, customerId);
    }

    @Transactional(readOnly = true)
    public SlotAvailabilityResponse availabilityForCompatibilityDuration(
            Long branchId,
            LocalDate date,
            Integer durationMinutes,
            Instant requestedStart,
            Long customerId) {
        if (durationMinutes == null || durationMinutes <= 0
                || durationMinutes > REQUIRED_SLOT_MINUTES * 44) {
            throw new BadRequestException(
                    "Provide serviceIds or a compatibility duration from 1 to 660 minutes.");
        }
        long requiredSlots = ((long) durationMinutes + REQUIRED_SLOT_MINUTES - 1)
                / REQUIRED_SLOT_MINUTES;
        if (requiredSlots > Integer.MAX_VALUE) {
            throw new BadRequestException("Duration exceeds the supported range.");
        }
        BookingDurationSummary duration = new BookingDurationSummary(
                BookingMode.SLOT, durationMinutes, 0, durationMinutes,
                (int) requiredSlots, Math.multiplyExact((int) requiredSlots, REQUIRED_SLOT_MINUTES));
        return calculate(branchId, date, duration, Set.of(BayType.UNIVERSAL),
                requestedStart, customerId, false);
    }

    @Transactional(readOnly = true)
    SlotAvailabilityResponse availabilityForSelection(
            Long branchId,
            LocalDate date,
            TrustedBookingSelection selection,
            Instant requestedStart,
            Long customerId) {
        if (selection == null || selection.requiredBayTypes().isEmpty()) {
            throw new BadRequestException("Service bay configuration is invalid.");
        }
        BookingDurationSummary duration = durationCalculator.calculate(selection.items());
        return calculate(branchId, date, duration, selection.requiredBayTypes(),
                requestedStart, customerId, true);
    }

    private SlotAvailabilityResponse calculate(
            Long branchId,
            LocalDate date,
            BookingDurationSummary duration,
            Set<BayType> requiredBayTypes,
            Instant requestedStart,
            Long customerId,
            boolean derivedFromCatalog) {
        if (branchId == null || branchId <= 0 || date == null) {
            throw new BadRequestException("Branch and date are required.");
        }
        Branch branch = branches.findById(branchId)
                .filter(value -> "ACTIVE".equalsIgnoreCase(value.getStatus()))
                .orElseThrow(() -> new ResourceNotFoundException("Active branch not found."));
        validateBranchSchedule(branch);

        LocalDate today = LocalDate.ofInstant(clock.instant(), BUSINESS_ZONE);
        if (date.isBefore(today.minusDays(1)) || date.isAfter(today.plusDays(60))) {
            throw new BadRequestException("Requested date is outside the supported booking horizon.");
        }
        validateRequestedStartBounds(date, requestedStart);

        int bookingWindowDays = bookingWindowDays(customerId);
        int minimumAdvanceMinutes = duration.bookingMode() == BookingMode.SLOT
                ? branch.getMinAdvanceSlotMinutes()
                : branch.getMinAdvanceFlexibleMinutes();

        if (duration.bookingMode() == BookingMode.FLEXIBLE) {
            validateFlexiblePreferredStart(
                    branch, date, requestedStart, bookingWindowDays, minimumAdvanceMinutes);
            return response(branch, date, duration, minimumAdvanceMinutes, bookingWindowDays,
                    derivedFromCatalog, List.of(), List.of());
        }

        int gridCells = gridCellCount(branch);
        if (duration.requiredSlots() <= 0 || duration.requiredSlots() > gridCells) {
            throw new BadRequestException("Selected services do not fit within branch operating hours.");
        }

        boolean insideWindow = !date.isBefore(today)
                && !date.isAfter(today.plusDays(bookingWindowDays));
        Instant minimumStart = clock.instant().plus(Duration.ofMinutes(minimumAdvanceMinutes));
        LocalDateTime dayStart = date.atTime(branch.getOpenTime());
        List<SlotReservationRepository.BlockingSlotProjection> blocking = List.of();
        Map<Long, Set<LocalDateTime>> occupiedByBay = Map.of();
        Set<Long> compatibleBayIds = Set.of();
        List<TimeRange> legacyBlocks = List.of();
        if (insideWindow && Boolean.TRUE.equals(branch.getBookingEnabled())) {
            LocalDateTime dayEnd = date.atTime(branch.getCloseTime());
            LocalDateTime nowLocal = LocalDateTime.ofInstant(clock.instant(), BUSINESS_ZONE);
            blocking = reservations.findBlockingSlots(branchId, dayStart, dayEnd, nowLocal);
            occupiedByBay = occupiedByBay(blocking);
            compatibleBayIds = compatibleBays(
                    bays.findActiveByBranchId(branchId), requiredBayTypes).stream()
                    .map(Bay::getBayId)
                    .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
            legacyBlocks = legacyBlocks(
                    branch, date, blocking,
                    bookings.findLegacyAvailabilityCandidates(
                            branchId, date, LEGACY_BLOCKING_STATUSES));
        }
        List<SlotOptionResponse> slots = new ArrayList<>(gridCells);
        for (int index = 0; index < gridCells; index++) {
            LocalDateTime localStart = dayStart.plusMinutes((long) index * REQUIRED_SLOT_MINUTES);
            LocalDateTime localEnd = localStart.plusMinutes(duration.reservedMinutes());
            slots.add(evaluateSlot(
                    branch, localStart, localEnd, duration.requiredSlots(), insideWindow,
                    minimumStart, compatibleBayIds, occupiedByBay, legacyBlocks));
        }
        List<AlternativeSlotResponse> alternatives = alternatives(slots, requestedStart, date);
        if (requestedStart != null && alternatives.size() < 3
                && Boolean.TRUE.equals(branch.getBookingEnabled())
                && requestedSlotIsUnavailable(slots, requestedStart)) {
            List<AlternativeSlotResponse> expanded = new ArrayList<>(alternatives);
            LocalDate lastAllowedDate = today.plusDays(bookingWindowDays);
            for (LocalDate cursor = date.plusDays(1);
                 expanded.size() < 3 && !cursor.isAfter(lastAllowedDate);
                 cursor = cursor.plusDays(1)) {
                SlotAvailabilityResponse nextDay = calculate(
                        branchId, cursor, duration, requiredBayTypes,
                        null, customerId, derivedFromCatalog);
                for (SlotOptionResponse slot : nextDay.slots()) {
                    if (slot.available()) {
                        expanded.add(new AlternativeSlotResponse(
                                slot.startAt(), slot.endAt(), slot.availableBayCount()));
                        if (expanded.size() == 3) {
                            break;
                        }
                    }
                }
            }
            alternatives = List.copyOf(expanded);
        }
        return response(branch, date, duration, minimumAdvanceMinutes, bookingWindowDays,
                derivedFromCatalog, slots, alternatives);
    }

    private SlotOptionResponse evaluateSlot(
            Branch branch,
            LocalDateTime localStart,
            LocalDateTime localEnd,
            int requiredSlots,
            boolean insideWindow,
            Instant minimumStart,
            Set<Long> compatibleBayIds,
            Map<Long, Set<LocalDateTime>> occupiedByBay,
            List<TimeRange> legacyBlocks) {
        Instant start = localStart.atZone(BUSINESS_ZONE).toInstant();
        Instant end = localEnd.atZone(BUSINESS_ZONE).toInstant();
        if (!Boolean.TRUE.equals(branch.getBookingEnabled())) {
            return unavailable(start, end, "BRANCH_DISABLED");
        }
        if (!insideWindow) {
            return unavailable(start, end, "OUTSIDE_BOOKING_WINDOW");
        }
        if (start.isBefore(minimumStart)) {
            return unavailable(start, end, "MINIMUM_ADVANCE");
        }
        if (localEnd.toLocalTime().isAfter(branch.getCloseTime())
                || !localEnd.toLocalDate().equals(localStart.toLocalDate())) {
            return unavailable(start, end, "OUTSIDE_OPERATING_HOURS");
        }
        if (compatibleBayIds.isEmpty()) {
            return full(start, end, "NO_COMPATIBLE_BAY");
        }
        boolean legacyOverlap = legacyBlocks.stream()
                .anyMatch(block -> block.overlaps(localStart, localEnd));
        if (legacyOverlap) {
            return full(start, end, "LEGACY_BRANCH_CAPACITY");
        }

        int availableBayCount = 0;
        for (Long bayId : compatibleBayIds) {
            Set<LocalDateTime> occupied = occupiedByBay.getOrDefault(bayId, Set.of());
            boolean bayFree = true;
            for (int slot = 0; slot < requiredSlots; slot++) {
                if (occupied.contains(localStart.plusMinutes((long) slot * REQUIRED_SLOT_MINUTES))) {
                    bayFree = false;
                    break;
                }
            }
            if (bayFree) {
                availableBayCount++;
            }
        }
        if (availableBayCount == 0) {
            return full(start, end, "CAPACITY_FULL");
        }
        return new SlotOptionResponse(
                start, end, availableBayCount == 1 ? "LIMITED" : "AVAILABLE",
                null, true, availableBayCount);
    }

    private List<Bay> compatibleBays(List<Bay> activeBays, Set<BayType> requirements) {
        boolean universalOnly = requirements.contains(BayType.UNIVERSAL) || requirements.size() > 1;
        BayType specializedType = universalOnly ? null : requirements.iterator().next();
        return activeBays.stream()
                .filter(bay -> Boolean.TRUE.equals(bay.getActive()))
                .filter(bay -> {
                    BayType actual;
                    try {
                        actual = BayType.valueOf(bay.getBayType().toUpperCase(java.util.Locale.ROOT));
                    } catch (RuntimeException invalidBayType) {
                        return false;
                    }
                    return universalOnly
                            ? actual == BayType.UNIVERSAL
                            : actual == specializedType || actual == BayType.UNIVERSAL;
                })
                .sorted(Comparator
                        .comparingInt((Bay bay) -> "UNIVERSAL".equalsIgnoreCase(bay.getBayType()) ? 1 : 0)
                        .thenComparing(Bay::getBayCode)
                        .thenComparing(Bay::getBayId))
                .toList();
    }

    private Map<Long, Set<LocalDateTime>> occupiedByBay(
            List<SlotReservationRepository.BlockingSlotProjection> blocking) {
        Map<Long, Set<LocalDateTime>> result = new HashMap<>();
        for (SlotReservationRepository.BlockingSlotProjection slot : blocking) {
            result.computeIfAbsent(slot.getBayId(), ignored -> new HashSet<>())
                    .add(slot.getSlotTime());
        }
        return result;
    }

    private List<TimeRange> legacyBlocks(
            Branch branch,
            LocalDate date,
            List<SlotReservationRepository.BlockingSlotProjection> blocking,
            List<BookingRepository.LegacyAvailabilityProjection> candidates) {
        Map<Long, Map<Long, Set<LocalDateTime>>> reservationTimes = new HashMap<>();
        for (SlotReservationRepository.BlockingSlotProjection slot : blocking) {
            reservationTimes
                    .computeIfAbsent(slot.getBookingId(), ignored -> new HashMap<>())
                    .computeIfAbsent(slot.getBayId(), ignored -> new HashSet<>())
                    .add(slot.getSlotTime());
        }

        List<TimeRange> result = new ArrayList<>();
        for (BookingRepository.LegacyAvailabilityProjection booking : candidates) {
            if (!Boolean.TRUE.equals(booking.getLegacyFinancialSnapshot())
                    || !LEGACY_BLOCKING_STATUSES.contains(booking.getStatus())) {
                continue;
            }
            if (hasCompleteReservationSet(booking, date, reservationTimes.get(booking.getBookingId()))) {
                continue;
            }
            LocalDateTime start = date.atTime(booking.getBookingTime());
            LocalDateTime end = legacyEnd(branch, date, booking, start);
            result.add(new TimeRange(start, end));
        }
        return result;
    }

    private boolean hasCompleteReservationSet(
            BookingRepository.LegacyAvailabilityProjection booking,
            LocalDate date,
            Map<Long, Set<LocalDateTime>> timesByBay) {
        if (timesByBay == null || timesByBay.isEmpty() || booking.getBookingTime() == null) {
            return false;
        }
        int minutes = legacyDurationMinutes(booking);
        if (minutes <= 0) {
            return false;
        }
        int expectedSlots = (minutes + REQUIRED_SLOT_MINUTES - 1) / REQUIRED_SLOT_MINUTES;
        LocalDateTime start = date.atTime(booking.getBookingTime());
        for (Set<LocalDateTime> bayTimes : timesByBay.values()) {
            boolean complete = true;
            for (int slot = 0; slot < expectedSlots; slot++) {
                if (!bayTimes.contains(start.plusMinutes((long) slot * REQUIRED_SLOT_MINUTES))) {
                    complete = false;
                    break;
                }
            }
            if (complete) {
                return true;
            }
        }
        return false;
    }

    private LocalDateTime legacyEnd(
            Branch branch, LocalDate date,
            BookingRepository.LegacyAvailabilityProjection booking, LocalDateTime start) {
        if (booking.getEndTime() != null && booking.getEndTime().isAfter(booking.getBookingTime())) {
            return date.atTime(booking.getEndTime());
        }
        int minutes = legacyDurationMinutes(booking);
        if (minutes > 0) {
            LocalDateTime calculated = start.plusMinutes(minutes);
            LocalDateTime close = date.atTime(branch.getCloseTime());
            return calculated.isAfter(close) ? close : calculated;
        }
        return date.atTime(branch.getCloseTime());
    }

    private int legacyDurationMinutes(BookingRepository.LegacyAvailabilityProjection booking) {
        if (booking.getDurationMinutes() != null && booking.getDurationMinutes() > 0) {
            return booking.getDurationMinutes();
        }
        if (booking.getBookingTime() != null && booking.getEndTime() != null
                && booking.getEndTime().isAfter(booking.getBookingTime())) {
            return Math.toIntExact(Duration.between(
                    booking.getBookingTime(), booking.getEndTime()).toMinutes());
        }
        return -1;
    }

    private List<AlternativeSlotResponse> alternatives(
            List<SlotOptionResponse> slots, Instant requestedStart, LocalDate requestedDate) {
        if (requestedStart == null) {
            return List.of();
        }
        LocalDate localRequestedDate = LocalDate.ofInstant(requestedStart, BUSINESS_ZONE);
        if (!requestedDate.equals(localRequestedDate)) {
            throw new BadRequestException("Requested start must belong to the requested business date.");
        }
        SlotOptionResponse requested = slots.stream()
                .filter(slot -> slot.startAt().equals(requestedStart))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "Requested start must align to a branch 15-minute slot."));
        if (requested.available()) {
            return List.of();
        }
        return slots.stream()
                .filter(SlotOptionResponse::available)
                .filter(slot -> slot.startAt().isAfter(requestedStart))
                .limit(3)
                .map(slot -> new AlternativeSlotResponse(
                        slot.startAt(), slot.endAt(), slot.availableBayCount()))
                .toList();
    }

    private boolean requestedSlotIsUnavailable(
            List<SlotOptionResponse> slots, Instant requestedStart) {
        return slots.stream()
                .filter(slot -> slot.startAt().equals(requestedStart))
                .findFirst()
                .map(slot -> !slot.available())
                .orElse(false);
    }

    private int bookingWindowDays(Long customerId) {
        if (customerId == null) {
            return GUEST_BOOKING_WINDOW_DAYS;
        }
        return customers.findById(customerId)
                .flatMap(customer -> tiers.findByTierCodeIgnoreCase(customer.getTier()))
                .map(tier -> tier.getBookingWindowDays())
                .filter(days -> days != null && days > 0 && days <= 60)
                .orElse(GUEST_BOOKING_WINDOW_DAYS);
    }

    private void validateFlexiblePreferredStart(
            Branch branch,
            LocalDate date,
            Instant requestedStart,
            int bookingWindowDays,
            int minimumAdvanceMinutes) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), BUSINESS_ZONE);
        if (date.isBefore(today) || date.isAfter(today.plusDays(bookingWindowDays))) {
            if (requestedStart != null) {
                throw new BadRequestException("Preferred time is outside the booking window.");
            }
            return;
        }
        if (requestedStart == null) {
            return;
        }
        LocalDateTime local = LocalDateTime.ofInstant(requestedStart, BUSINESS_ZONE);
        if (!local.toLocalDate().equals(date)
                || local.toLocalTime().isBefore(branch.getOpenTime())
                || !local.toLocalTime().isBefore(branch.getCloseTime())
                || requestedStart.isBefore(clock.instant().plus(Duration.ofMinutes(minimumAdvanceMinutes)))) {
            throw new BadRequestException("Preferred time violates branch booking policy.");
        }
    }

    private void validateRequestedStartBounds(LocalDate date, Instant requestedStart) {
        if (requestedStart == null) {
            return;
        }
        Instant dayStart = date.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant nextDay = date.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        if (requestedStart.isBefore(dayStart) || !requestedStart.isBefore(nextDay)) {
            throw new BadRequestException(
                    "Requested start must belong to the requested business date.");
        }
    }

    private void validateBranchSchedule(Branch branch) {
        if (branch.getOpenTime() == null || branch.getCloseTime() == null
                || !branch.getCloseTime().isAfter(branch.getOpenTime())
                || branch.getSlotMinutes() == null
                || branch.getSlotMinutes() != REQUIRED_SLOT_MINUTES
                || branch.getMinAdvanceSlotMinutes() == null
                || branch.getMinAdvanceSlotMinutes() < 0
                || branch.getMinAdvanceFlexibleMinutes() == null
                || branch.getMinAdvanceFlexibleMinutes() < 0
                || branch.getOpenTime().getMinute() % REQUIRED_SLOT_MINUTES != 0
                || branch.getCloseTime().getMinute() % REQUIRED_SLOT_MINUTES != 0
                || branch.getOpenTime().getSecond() != 0
                || branch.getCloseTime().getSecond() != 0) {
            throw new BadRequestException("Branch booking schedule is not configured correctly.");
        }
    }

    private int gridCellCount(Branch branch) {
        long operatingMinutes = Duration.between(
                branch.getOpenTime(), branch.getCloseTime()).toMinutes();
        if (operatingMinutes <= 0 || operatingMinutes % REQUIRED_SLOT_MINUTES != 0
                || operatingMinutes / REQUIRED_SLOT_MINUTES > Integer.MAX_VALUE) {
            throw new BadRequestException("Branch booking schedule is not configured correctly.");
        }
        return (int) (operatingMinutes / REQUIRED_SLOT_MINUTES);
    }

    private SlotAvailabilityResponse response(
            Branch branch,
            LocalDate date,
            BookingDurationSummary duration,
            int minimumAdvanceMinutes,
            int bookingWindowDays,
            boolean derivedFromCatalog,
            List<SlotOptionResponse> slots,
            List<AlternativeSlotResponse> alternatives) {
        return new SlotAvailabilityResponse(
                branch.getBranchId(), date, BUSINESS_ZONE.getId(), REQUIRED_SLOT_MINUTES,
                duration.bookingMode().name(), duration.workMinutes(), duration.bufferMinutes(),
                duration.occupiedMinutes(), duration.requiredSlots(), duration.reservedMinutes(),
                minimumAdvanceMinutes, bookingWindowDays,
                Boolean.TRUE.equals(branch.getBookingEnabled()), branch.getBookingNotice(),
                derivedFromCatalog, slots, alternatives);
    }

    private SlotOptionResponse unavailable(Instant start, Instant end, String reason) {
        return new SlotOptionResponse(start, end, "UNAVAILABLE", reason, false, 0);
    }

    private SlotOptionResponse full(Instant start, Instant end, String reason) {
        return new SlotOptionResponse(start, end, "FULL", reason, false, 0);
    }

    private record TimeRange(LocalDateTime start, LocalDateTime end) {
        boolean overlaps(LocalDateTime candidateStart, LocalDateTime candidateEnd) {
            return candidateStart.isBefore(end) && candidateEnd.isAfter(start);
        }
    }
}
