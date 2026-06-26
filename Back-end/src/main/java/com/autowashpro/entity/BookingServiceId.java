package com.autowashpro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class BookingServiceId implements Serializable {

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "service_id")
    private Long serviceId;
}