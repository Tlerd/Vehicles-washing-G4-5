package com.autowashpro.controller;
import com.autowashpro.dto.admin.CampaignRequest;import com.autowashpro.entity.Promotion;import com.autowashpro.service.AdminService;import jakarta.validation.Valid;import lombok.RequiredArgsConstructor;import org.springframework.data.domain.Page;import org.springframework.web.bind.annotation.*;import java.time.LocalDate;import java.util.*;
@RestController @RequestMapping("/api/v1/admin") @RequiredArgsConstructor public class AdminController {
 private final AdminService admin;
 @GetMapping("/customers") public List<Map<String,Object>> customers(@RequestParam(defaultValue="")String q){return admin.customers(q);}
 @PatchMapping("/customers/{id}") public Map<String,Object> update(@PathVariable Long id,@RequestBody Map<String,String>r){return admin.updateCustomer(id,r);}
 @GetMapping("/bookings") public Page<Map<String,Object>> bookings(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(required=false)String status,@RequestParam(required=false)LocalDate date){return admin.bookingLog(page,Math.min(size,100),status,date==null?LocalDate.now():date);}
 @GetMapping("/revenue") public Map<String,Object> revenue(@RequestParam(defaultValue="month")String period){return admin.revenue(period);}
 @GetMapping("/audit-logs") public List<Map<String,Object>> audit(){return admin.audit();}
 @GetMapping("/audit/points") public List<Map<String,Object>> pointAudit(){return admin.audit();}
 @GetMapping("/campaigns") public List<Promotion> campaigns(){return admin.campaigns();}
 @PostMapping("/campaigns") public Promotion campaign(@Valid @RequestBody CampaignRequest r){return admin.campaign(r);}
 @DeleteMapping("/campaigns/{id}") public void delete(@PathVariable Long id){admin.deleteCampaign(id);}
}
