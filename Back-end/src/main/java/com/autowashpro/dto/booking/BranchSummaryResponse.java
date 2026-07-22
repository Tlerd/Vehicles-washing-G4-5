package com.autowashpro.dto.booking;

import com.autowashpro.entity.Branch;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalTime;

@Schema(description = "Public branch booking summary without persistence internals.")
public record BranchSummaryResponse(
        Long branchId,
        String branchName,
        String address,
        String phone,
        LocalTime openTime,
        LocalTime closeTime,
        boolean bookingEnabled,
        String bookingNotice,
        int slotMinutes
) {
    public static BranchSummaryResponse from(Branch branch) {
        return new BranchSummaryResponse(
                branch.getBranchId(), branch.getBranchName(), branch.getAddress(), branch.getPhone(),
                branch.getOpenTime(), branch.getCloseTime(),
                Boolean.TRUE.equals(branch.getBookingEnabled()), branch.getBookingNotice(),
                branch.getSlotMinutes() == null ? 15 : branch.getSlotMinutes());
    }
}
