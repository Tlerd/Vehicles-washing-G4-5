package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "booking_services")
public class BookingService {

    @EmbeddedId
    private BookingServiceId id;

    @ManyToOne
    @MapsId("bookingId")
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne
    @MapsId("serviceId")
    @JoinColumn(name = "service_id")
    private Service service;
}