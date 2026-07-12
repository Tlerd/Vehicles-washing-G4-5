package com.autowashpro.service;

import java.math.BigDecimal;

public interface PointService {

    int calculatePoints(BigDecimal actualPaid, String tier, BigDecimal campaignMultiplier);

    void creditPointsForCompletedBooking(Long bookingId);
}
