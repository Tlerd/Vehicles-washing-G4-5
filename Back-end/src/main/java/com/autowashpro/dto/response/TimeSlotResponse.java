package com.autowashpro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TimeSlotResponse {

    private String time;

    private boolean available;
}
