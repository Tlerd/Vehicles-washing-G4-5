package com.autowashpro.controller;

import com.autowashpro.dto.booking.*;
import com.autowashpro.entity.*;
import com.autowashpro.repository.*;
import com.autowashpro.service.BookingManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor
public class BookingController {
    private final BookingManagementService bookings;
    private final BranchRepository branches;
    private final ServiceRepository services;

    @GetMapping("/catalog/branches") public List<Branch> branches() { return branches.findByStatusIgnoreCase("ACTIVE"); }
    @GetMapping("/catalog/services") public List<com.autowashpro.entity.Service> services() { return services.findByStatusIgnoreCase("ACTIVE"); }
    @PostMapping("/bookings") public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest r,@AuthenticationPrincipal String callerId) { r.setCustomerId(Long.valueOf(callerId)); return ResponseEntity.status(HttpStatus.CREATED).body(bookings.create(r)); }
    @GetMapping("/bookings/availability") public List<Map<String,Object>> availability(@RequestParam Long branchId,@RequestParam LocalDate date,@RequestParam List<String> serviceCodes) {
        Branch branch=branches.findById(branchId).orElseThrow();
        List<com.autowashpro.entity.Service> selected=services.findByServiceCodeIn(serviceCodes);
        if(selected.size()!=new HashSet<>(serviceCodes).size()) throw new IllegalArgumentException("Invalid service codes");
        int duration=selected.stream().mapToInt(s -> Optional.ofNullable(s.getDurationMinutes()).orElse(30)).sum();
        List<BookingResponse> existing=bookings.queue(date).stream().filter(b->b.getBranchId().equals(branchId)&&!"CANCELLED".equals(b.getStatus())).toList();
        List<Map<String,Object>> result=new ArrayList<>();
        for(LocalTime t=branch.getOpenTime();!t.plusMinutes(duration).isAfter(branch.getCloseTime());t=t.plusMinutes(30)) {
            LocalTime start=t,end=t.plusMinutes(duration);
            boolean overlap=existing.stream().anyMatch(b->{LocalTime oldEnd=b.getEndTime()!=null?b.getEndTime():b.getBookingTime().plusMinutes(Optional.ofNullable(b.getDurationMinutes()).orElse(30));return start.isBefore(oldEnd)&&end.isAfter(b.getBookingTime());});
            result.add(Map.of("time",t.toString(),"endTime",end.toString(),"durationMinutes",duration,"available",!overlap));
        }
        return result;
    }
    @GetMapping("/bookings/customer/{customerId}") public List<BookingResponse> customer(@PathVariable Long customerId,@AuthenticationPrincipal String callerId) { return bookings.customerBookings(Long.valueOf(callerId)); }
    @GetMapping("/washing-counter/queue") public List<BookingResponse> queue(@RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}") LocalDate date) { return bookings.queue(date); }
    @PatchMapping("/washing-counter/bookings/{id}/status") public BookingResponse status(@PathVariable Long id, @Valid @RequestBody StatusRequest r) { return bookings.transition(id, r.getStatus()); }
}
