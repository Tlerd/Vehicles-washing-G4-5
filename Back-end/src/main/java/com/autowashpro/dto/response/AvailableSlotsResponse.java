package com.autowashpro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class AvailableSlotsResponse {

    private LocalDate date;

    private Long branchId;

    private List<TimeSlotResponse> slots;
}
