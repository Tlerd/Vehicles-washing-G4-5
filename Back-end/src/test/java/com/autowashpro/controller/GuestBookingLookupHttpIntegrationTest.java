package com.autowashpro.controller;

import com.autowashpro.config.JwtTokenProvider;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.entity.VerificationPurpose;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.GuestRepository;
import com.autowashpro.repository.PhoneVerificationProofRepository;
import com.autowashpro.repository.VehicleRepository;
import com.autowashpro.service.FirebaseTokenVerifier;
import com.autowashpro.service.VerifiedFirebaseIdentity;
import com.autowashpro.utils.ProofTokenCodec;
import com.autowashpro.utils.ProofTokenGenerator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GuestBookingLookupHttpIntegrationTest {

    private static final AtomicInteger PHONE_SEQUENCE = new AtomicInteger(1_000_000);
    private static final String PROOF_HEADER = "X-Guest-Verification-Proof";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private GuestRepository guestRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private PhoneVerificationProofRepository proofRepository;

    @MockitoBean
    private FirebaseTokenVerifier firebaseTokenVerifier;

    private final List<Long> bookingIds = new ArrayList<>();
    private final List<Long> guestIds = new ArrayList<>();
    private final List<Long> vehicleIds = new ArrayList<>();
    private final List<Long> customerIds = new ArrayList<>();
    private final List<Long> branchIds = new ArrayList<>();
    private final List<String> proofDigests = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        bookingRepository.deleteAllById(bookingIds);
        bookingRepository.flush();
        guestRepository.deleteAllById(guestIds);
        guestRepository.flush();
        vehicleRepository.deleteAllById(vehicleIds);
        vehicleRepository.flush();
        customerRepository.deleteAllById(customerIds);
        customerRepository.flush();
        branchRepository.deleteAllById(branchIds);
        branchRepository.flush();
        proofRepository.deleteAllById(proofDigests);
        proofRepository.flush();
    }

    @Test
    void matchingGuestProof_returnsMinimizedBookingAndBurnsProof() throws Exception {
        TestBooking testBooking = createGuestBooking();
        String proof = saveProof(testBooking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/{bookingRef}", testBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL,
                        org.hamcrest.Matchers.containsString("no-store")))
                .andExpect(jsonPath("$.bookingRef").value(testBooking.booking().getBookingRef()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.licensePlate").value(testBooking.vehicle().getLicensePlate()))
                .andExpect(jsonPath("$.customerId").doesNotExist())
                .andExpect(jsonPath("$.customerPhone").doesNotExist())
                .andExpect(jsonPath("$.guestPhone").doesNotExist())
                .andExpect(jsonPath("$.proofToken").doesNotExist());

        mvc.perform(get("/api/v1/bookings/{bookingRef}", testBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void wrongGuestProof_isForbiddenAndStillBurned() throws Exception {
        TestBooking ownerBooking = createGuestBooking();
        TestBooking otherBooking = createGuestBooking();
        String proof = saveProof(ownerBooking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/{bookingRef}", otherBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mvc.perform(get("/api/v1/bookings/{bookingRef}", ownerBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownReference_returnsNotFoundAndStillBurnsProof() throws Exception {
        TestBooking ownerBooking = createGuestBooking();
        String proof = saveProof(ownerBooking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/AWP-00000000").header(PROOF_HEADER, proof))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mvc.perform(get("/api/v1/bookings/{bookingRef}", ownerBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isBadRequest());
    }

    @Test
    void guestProof_cannotAccessMemberBooking() throws Exception {
        TestBooking guestBooking = createGuestBooking();
        TestBooking memberBooking = createMemberBooking();
        String proof = saveProof(guestBooking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/{bookingRef}", memberBooking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerBearer_isAuthorizedOnlyForPrincipalOwnedBooking() throws Exception {
        TestBooking ownerBooking = createMemberBooking();
        TestBooking otherBooking = createMemberBooking();
        String ownerToken = jwtTokenProvider.generateToken(
                ownerBooking.customer().getCustomerId(), ownerBooking.customer().getPhone(), "CUSTOMER");

        mvc.perform(get("/api/v1/bookings/{bookingRef}", ownerBooking.booking().getBookingRef())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/bookings/{bookingRef}", otherBooking.booking().getBookingRef())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingCredential_isUnauthorized() throws Exception {
        TestBooking booking = createGuestBooking();

        mvc.perform(get("/api/v1/bookings/{bookingRef}", booking.booking().getBookingRef()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void invalidBearer_doesNotFallBackToValidGuestProof() throws Exception {
        TestBooking booking = createGuestBooking();
        String proof = saveProof(booking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/{bookingRef}", booking.booking().getBookingRef())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/bookings/{bookingRef}", booking.booking().getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isOk());
    }

    @Test
    void proofIssuance_verifiesFirebaseServerSideAndStoresOnlyDigest() throws Exception {
        String phone = nextPhone();
        when(firebaseTokenVerifier.verify("firebase-test-token"))
                .thenReturn(new VerifiedFirebaseIdentity(phone, null));

        String body = mvc.perform(post("/api/v1/guest-verification-proofs/booking-lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"" + phone + "\",\"firebaseIdToken\":\"firebase-test-token\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL,
                        org.hamcrest.Matchers.containsString("no-store")))
                .andReturn().getResponse().getContentAsString();

        JsonNode response = objectMapper.readTree(body);
        String rawProof = response.path("proofToken").asText();
        assertThat(ProofTokenCodec.isValid(rawProof)).isTrue();
        String digest = ProofTokenCodec.digest(rawProof);
        proofDigests.add(digest);
        assertThat(proofRepository.findById(digest)).isPresent();
        assertThat(proofRepository.findById(rawProof)).isEmpty();
    }

    @Test
    void sixCharacterReference_remainsCompatibleWithApprovedContract() throws Exception {
        TestBooking ownerBooking = createGuestBooking();
        bookingRepository.deleteById(ownerBooking.booking().getBookingId());
        bookingRepository.flush();
        bookingIds.remove(ownerBooking.booking().getBookingId());
        Booking sixCharacterBooking = saveBooking(
                null, ownerBooking.guest(), ownerBooking.vehicle(), ownerBooking.booking().getBranch(), "AWP-381927");
        String proof = saveProof(ownerBooking.guest().getPhone(), VerificationPurpose.GUEST_BOOKING_LOOKUP);

        mvc.perform(get("/api/v1/bookings/{bookingRef}", sixCharacterBooking.getBookingRef())
                        .header(PROOF_HEADER, proof))
                .andExpect(status().isOk());
    }

    @Test
    void uniqueGarbageProofFlood_fromOneOriginIsCoarselyThrottled() throws Exception {
        for (int i = 0; i < 60; i++) {
            String proof = "gvp_" + String.format("%043d", i);
            mvc.perform(get("/api/v1/bookings/AWP-381927")
                            .with(request -> { request.setRemoteAddr("192.0.2.44"); return request; })
                            .header(PROOF_HEADER, proof))
                    .andExpect(status().isBadRequest());
        }

        mvc.perform(get("/api/v1/bookings/AWP-381927")
                        .with(request -> { request.setRemoteAddr("192.0.2.44"); return request; })
                        .header(PROOF_HEADER, "gvp_" + "9".repeat(43)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void authenticatedCustomerReferenceProbes_arePrincipalRateLimited() throws Exception {
        String token = jwtTokenProvider.generateToken(9_990_123L, "+84900000999", "CUSTOMER");

        for (int i = 0; i < 60; i++) {
            mvc.perform(get("/api/v1/bookings/AWP-QZQZQZ")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isNotFound());
        }

        mvc.perform(get("/api/v1/bookings/AWP-QZQZQZ")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    private TestBooking createGuestBooking() {
        Customer vehicleOwner = saveCustomer();
        Branch branch = saveBranch();
        Vehicle vehicle = saveVehicle(vehicleOwner);
        Guest guest = new Guest();
        guest.setFullName("Guest Test");
        guest.setPhone(nextPhone());
        guest.setEmail(unique("guest") + "@example.test");
        guest.setLicensePlate(vehicle.getLicensePlate());
        guest.setVehicleSize(VehicleSize.SEDAN);
        guest.setCreatedAt(LocalDateTime.now());
        guest = guestRepository.saveAndFlush(guest);
        guestIds.add(guest.getGuestId());

        Booking booking = saveBooking(null, guest, vehicle, branch);
        return new TestBooking(booking, null, guest, vehicle);
    }

    private TestBooking createMemberBooking() {
        Customer customer = saveCustomer();
        Branch branch = saveBranch();
        Vehicle vehicle = saveVehicle(customer);
        Booking booking = saveBooking(customer, null, vehicle, branch);
        return new TestBooking(booking, customer, null, vehicle);
    }

    private Customer saveCustomer() {
        Customer customer = new Customer();
        customer.setFullName("Customer Test");
        customer.setPhone(nextPhone());
        customer.setEmail(unique("customer") + "@example.test");
        customer.setPasswordHash("test-only-hash");
        customer.setTier("MEMBER");
        customer.setRole("CUSTOMER");
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customer = customerRepository.saveAndFlush(customer);
        customerIds.add(customer.getCustomerId());
        return customer;
    }

    private Branch saveBranch() {
        Branch branch = new Branch();
        branch.setBranchName(unique("Lookup Branch"));
        branch.setAddress("Test address");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        branch.setStatus("ACTIVE");
        branch = branchRepository.saveAndFlush(branch);
        branchIds.add(branch.getBranchId());
        return branch;
    }

    private Vehicle saveVehicle(Customer customer) {
        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setLicensePlate(unique("TST").substring(0, 11));
        vehicle.setBrand("Toyota");
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        vehicle.setIsDefault(true);
        vehicle = vehicleRepository.saveAndFlush(vehicle);
        vehicleIds.add(vehicle.getVehicleId());
        return vehicle;
    }

    private Booking saveBooking(Customer customer, Guest guest, Vehicle vehicle, Branch branch) {
        return saveBooking(customer, guest, vehicle, branch,
                "AWP-" + UUID.randomUUID().toString().replace("-", "")
                        .substring(0, 8).toUpperCase());
    }

    private Booking saveBooking(Customer customer, Guest guest, Vehicle vehicle, Branch branch, String bookingRef) {
        Booking booking = new Booking();
        booking.setBookingRef(bookingRef);
        booking.setCustomer(customer);
        booking.setGuest(guest);
        booking.setVehicle(vehicle);
        booking.setBranch(branch);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setBookingTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(9, 30));
        booking.setDurationMinutes(30);
        booking.setTotalPrice(new BigDecimal("150000.00"));
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(LocalDateTime.now());
        booking = bookingRepository.saveAndFlush(booking);
        bookingIds.add(booking.getBookingId());
        return booking;
    }

    private String saveProof(String phone, VerificationPurpose purpose) {
        String raw = ProofTokenGenerator.generate();
        String digest = ProofTokenCodec.digest(raw);
        PhoneVerificationProof proof = new PhoneVerificationProof();
        proof.setProofToken(digest);
        proof.setPhone(phone);
        proof.setPurpose(purpose);
        proof.setIssuedAt(LocalDateTime.now());
        proof.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        proofRepository.saveAndFlush(proof);
        proofDigests.add(digest);
        return raw;
    }

    private String nextPhone() {
        return "+8491" + String.format("%07d", PHONE_SEQUENCE.getAndIncrement());
    }

    private String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private record TestBooking(Booking booking, Customer customer, Guest guest, Vehicle vehicle) {
    }
}
