package com.autowashpro.service;
import com.autowashpro.dto.admin.CampaignRequest;
import com.autowashpro.entity.*;
import com.autowashpro.exception.custom.*;
import com.autowashpro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class AdminService {
 private final CustomerRepository customers; private final VehicleRepository vehicles; private final BookingRepository bookings; private final PointHistoryRepository points; private final PromotionRepository promotions;
 @Transactional(readOnly=true) public List<Map<String,Object>> customers(String q) {
  List<Customer> list = customers.findAll().stream().filter(c->"CUSTOMER".equals(c.getRole())).filter(c->q==null||q.isBlank()||c.getFullName().toLowerCase().contains(q.toLowerCase())||c.getPhone().contains(q)||vehicles.findByCustomerCustomerId(c.getCustomerId()).stream().anyMatch(v->v.getLicensePlate().toLowerCase().contains(q.toLowerCase()))).toList();
  return list.stream().map(c -> { Map<String,Object> m=new LinkedHashMap<>(); m.put("id",c.getCustomerId());m.put("name",c.getFullName());m.put("phone",c.getPhone());m.put("email",c.getEmail());m.put("tier",c.getTier());m.put("accumulatedPoints",c.getAccumulatedPoints());m.put("totalSpend",c.getTotalSpent());m.put("totalWashes",c.getTotalWashes());m.put("vehicles",vehicles.findByCustomerCustomerId(c.getCustomerId()).stream().map(Vehicle::getLicensePlate).toList());return m; }).toList();
 }
 public Map<String,Object> updateCustomer(Long id, Map<String,String> r) { Customer c=customers.findById(id).orElseThrow(()->new ResourceNotFoundException("Customer not found")); if(r.containsKey("name"))c.setFullName(r.get("name"));if(r.containsKey("email")){String email=r.get("email");if(email!=null&&!email.isBlank()&&!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))throw new BadRequestException("Invalid email format");c.setEmail(email);}c.setUpdatedAt(LocalDateTime.now());customers.save(c);return customers("").stream().filter(x->x.get("id").equals(id)).findFirst().orElseThrow(); }
 @Transactional(readOnly=true) public Page<Map<String,Object>> bookingLog(int page,int size,String status,LocalDate date){ List<Booking> all=bookings.findAll().stream().filter(b->status==null||status.isBlank()||b.getStatus().equalsIgnoreCase(status)).filter(b->date==null||b.getBookingDate().equals(date)).sorted(Comparator.comparing(Booking::getCreatedAt).reversed()).toList();int from=Math.min(page*size,all.size()),to=Math.min(from+size,all.size());List<Map<String,Object>> content=all.subList(from,to).stream().map(this::bookingMap).toList();return new PageImpl<>(content,PageRequest.of(page,size),all.size()); }
 @Transactional(readOnly=true) public Map<String,Object> revenue(String period){ List<Booking> done=bookings.findAll().stream().filter(b->"COMPLETED".equals(b.getStatus())).toList();Map<String,BigDecimal> groups=new TreeMap<>();for(Booking b:done){String key="year".equals(period)?String.valueOf(b.getBookingDate().getYear()):"month".equals(period)?b.getBookingDate().toString().substring(0,7):b.getBookingDate().toString();groups.merge(key,b.getTotalPrice(),BigDecimal::add);}BigDecimal total=done.stream().map(Booking::getTotalPrice).reduce(BigDecimal.ZERO,BigDecimal::add);return Map.of("period",period,"totalRevenue",total,"completedBookings",done.size(),"series",groups); }
 @Transactional(readOnly=true) public List<Map<String,Object>> audit(){return points.findAll().stream().sorted(Comparator.comparing(PointHistory::getCreatedAt).reversed()).map(h->Map.<String,Object>of("id",h.getPointHistoryId(),"customerId",h.getCustomer().getCustomerId(),"points",h.getPoints(),"type",h.getActivityType(),"description",h.getDescription()==null?"":h.getDescription(),"createdAt",h.getCreatedAt())).toList();}
 public Promotion campaign(CampaignRequest r){if(r.getEndDate().isBefore(r.getStartDate()))throw new BadRequestException("End date must be after start date");Promotion p=new Promotion();p.setPromotionName(r.getName());p.setDescription(generateTagline(r.getGoal()));p.setDiscountPercent(r.getMultiplier());p.setTargetTier(r.getTargetTier().toUpperCase());p.setStartDate(r.getStartDate());p.setEndDate(r.getEndDate());p.setStatus("ACTIVE");return promotions.save(p);}
 @Transactional(readOnly=true) public List<Promotion> campaigns(){return promotions.findAll();} public void deleteCampaign(Long id){Promotion p=promotions.findById(id).orElseThrow(()->new ResourceNotFoundException("Campaign not found"));p.setStatus("INACTIVE");promotions.save(p);} private String generateTagline(String goal){String clean=goal.trim().replaceAll("\\s+"," ");return "AutoWash smarter — "+Character.toUpperCase(clean.charAt(0))+clean.substring(1)+".";}
 private Map<String,Object> bookingMap(Booking b){Map<String,Object>m=new LinkedHashMap<>();m.put("id",b.getBookingId());m.put("bookingRef",b.getBookingRef());m.put("customerName",b.getCustomer()!=null?b.getCustomer().getFullName():b.getGuest().getFullName());m.put("licensePlate",b.getVehicle()!=null?b.getVehicle().getLicensePlate():b.getGuestLicensePlate());m.put("branch",b.getBranch().getBranchName());m.put("date",b.getBookingDate());m.put("time",b.getBookingTime());m.put("totalPrice",b.getTotalPrice());m.put("status",b.getStatus());return m;}
}
