package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "slot_reservations")
public class SlotReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Long reservationId;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "bay_id", nullable = false)
    private Bay bay;

    @Column(name = "slot_time", nullable = false)
    private LocalDateTime slotTime;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
