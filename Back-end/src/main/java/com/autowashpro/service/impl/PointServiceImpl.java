package com.autowashpro.service.impl;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.PointHistory;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.exception.custom.ConflictException;
import com.autowashpro.exception.custom.ResourceNotFoundException;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.PointHistoryRepository;
import com.autowashpro.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PointServiceImpl implements PointService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final PointHistoryRepository pointHistoryRepository;

    private static final BigDecimal EARN_RATE_BASE = new BigDecimal("1000");

    private static final BigDecimal DEFAULT_CAMPAIGN_MULTIPLIER = BigDecimal.ONE;

    // BR-004: hệ số nhân điểm theo hạng thành viên (Kh)
    private static final Map<String, BigDecimal> TIER_POINT_MULTIPLIERS = Map.of(
            "Member", new BigDecimal("1.0"),
            "Silver", new BigDecimal("1.1"),
            "Gold", new BigDecimal("1.2"),
            "Platinum", new BigDecimal("1.3")
    );

    @Override
    public int calculatePoints(BigDecimal actualPaid, String tier, BigDecimal campaignMultiplier) {

        if (actualPaid == null || actualPaid.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        BigDecimal tierMultiplier = TIER_POINT_MULTIPLIERS.getOrDefault(tier, BigDecimal.ONE);
        BigDecimal effectiveCampaignMultiplier =
                campaignMultiplier != null ? campaignMultiplier : DEFAULT_CAMPAIGN_MULTIPLIER;

        BigDecimal rawPoints = actualPaid
                .divide(EARN_RATE_BASE, 10, RoundingMode.DOWN)
                .multiply(tierMultiplier)
                .multiply(effectiveCampaignMultiplier);

        return rawPoints.setScale(0, RoundingMode.FLOOR).intValue();
    }

    @Override
    public void creditPointsForCompletedBooking(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch đặt không tồn tại."));

        if (!"COMPLETED".equals(booking.getStatus())) {
            throw new BadRequestException(
                    "Chỉ có thể cộng điểm cho lịch đặt đã ở trạng thái COMPLETED."
            );
        }

        if (booking.getPointsEarned() != null) {
            throw new ConflictException("Lịch đặt này đã được cộng điểm trước đó.");
        }

        Customer customer = booking.getCustomer();

        BigDecimal actualPaid = booking.getTotalPrice() != null
                ? booking.getTotalPrice()
                : BigDecimal.ZERO;

        // Kkm (hệ số khuyến mãi chủ động): mặc định 1.0 vì entity/bảng `promotions` hiện chưa có
        // cột lưu hệ số nhân điểm (chỉ có discount_percent - giảm giá tiền). Khi FR-013/schema
        // bổ sung cột này, truyền giá trị thật vào thay vì DEFAULT_CAMPAIGN_MULTIPLIER.
        int points = calculatePoints(actualPaid, customer.getTier(), DEFAULT_CAMPAIGN_MULTIPLIER);

        if (points > 0) {
            PointHistory pointHistory = new PointHistory();
            pointHistory.setCustomer(customer);
            pointHistory.setBooking(booking);
            pointHistory.setPoints(points);
            pointHistory.setActivityType("EARN");
            pointHistory.setDescription("Tích điểm từ lịch rửa xe " + booking.getBookingRef());
            pointHistory.setCreatedAt(LocalDateTime.now());
            pointHistoryRepository.save(pointHistory);

            customer.setAccumulatedPoints(customer.getAccumulatedPoints() + points);
        }

        // Số lần rửa và tổng chi tiêu (BR-005 tier progression) được tính bất kể có phát sinh
        // điểm hay không - ví dụ khách dùng voucher miễn phí vẫn tính là 1 lượt rửa.
        customer.setTotalSpent(customer.getTotalSpent().add(actualPaid));
        customer.setTotalWashes(customer.getTotalWashes() + 1);
        customer.setUpdatedAt(LocalDateTime.now());
        customerRepository.save(customer);

        booking.setPointsEarned(points);
        bookingRepository.save(booking);
    }
}
