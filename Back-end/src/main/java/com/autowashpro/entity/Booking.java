package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_ref", nullable = false, unique = true, length = 50)
    private String bookingRef;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "guest_id")
    private Guest guest;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "booking_time", nullable = false)
    private LocalTime bookingTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "total_price")
    private BigDecimal totalPrice;

    @Column(name = "status", length = 30)
    private String status;

    @ManyToOne
    @JoinColumn(name = "applied_voucher_id")
    private Voucher appliedVoucher;

    @Column(name = "points_earned")
    private Integer pointsEarned;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "applied_promotion_id")
    private Promotion appliedPromotion;

    @Column(name = "guest_license_plate", length = 20)
    private String guestLicensePlate;

    @Column(name = "guest_vehicle_brand", length = 100)
    private String guestVehicleBrand;

    @Enumerated(EnumType.STRING)
    @Column(name = "guest_vehicle_size", length = 20)
    private VehicleSize guestVehicleSize;

    @Column(name = "booking_mode", nullable = false, length = 20)
    private String bookingMode = "SLOT";

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "size_adjustment", nullable = false, precision = 12, scale = 2)
    private BigDecimal sizeAdjustment = BigDecimal.ZERO;

    @Column(name = "voucher_discount", nullable = false, precision = 12, scale = 2)
    private BigDecimal voucherDiscount = BigDecimal.ZERO;

    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "counter_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal counterBalance = BigDecimal.ZERO;

    @Column(name = "deposit_expires_at")
    private LocalDateTime depositExpiresAt;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "legacy_financial_snapshot", nullable = false)
    private Boolean legacyFinancialSnapshot = false;
}
