package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActor;
import com.autowashpro.domain.booking.NormalizedBookingCreateCommand;
import com.autowashpro.dto.booking.BookingItemSelection;
import com.autowashpro.dto.booking.CreateBookingV2Request;
import com.autowashpro.dto.booking.GuestContactInput;
import com.autowashpro.dto.booking.GuestVehicleInput;
import com.autowashpro.dto.booking.NewVehicleInput;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingCreateRequestPolicyTest {

    private static final Instant START = Instant.parse("2026-07-25T03:00:00Z");
    private static final BookingActor.Member MEMBER = new BookingActor.Member(42L);
    private static final BookingActor.Guest GUEST = new BookingActor.Guest(
            "+84901234567", "a".repeat(64));

    private final BookingCreateRequestPolicy policy = new BookingCreateRequestPolicy();

    @Test
    void memberSavedVehicle_isAcceptedAndItemsAreCanonicalized() {
        CreateBookingV2Request request = request(
                List.of(new BookingItemSelection(9L, 2), new BookingItemSelection(3L, 1)),
                71L, null, null, null, 5L, "  Xe mo\u031b\u0301i \t \n");

        NormalizedBookingCreateCommand result = policy.normalize(request, MEMBER);

        assertThat(result.items()).extracting(NormalizedBookingCreateCommand.Item::serviceId)
                .containsExactly(3L, 9L);
        assertThat(result.note()).isEqualTo("Xe m\u1edbi");
        assertThat(result.vehicleId()).isEqualTo(71L);
        assertThat(result.voucherId()).isEqualTo(5L);
        assertThat(result.actor()).isEqualTo(MEMBER);
    }

    @Test
    void memberInlineVehicle_isNormalized() {
        NewVehicleInput vehicle = new NewVehicleInput(
                " 51a-123.45 ", "  Ki\u0301a  Morning ", VehicleSize.SUV);

        NormalizedBookingCreateCommand result = policy.normalize(
                request(items(), null, vehicle, null, null, null, null), MEMBER);

        assertThat(result.newVehicle().licensePlate()).isEqualTo("51A-123.45");
        assertThat(result.newVehicle().brand()).isEqualTo("K\u00eda Morning");
        assertThat(result.newVehicle().vehicleSize()).isEqualTo(VehicleSize.SUV);
    }

    @Test
    void guestShape_isNormalizedAndBoundToVerifiedPhone() {
        GuestContactInput contact = new GuestContactInput(
                "  Nguy\u1ec5n   V\u0103n A ", "0901 234 567", " USER@Example.COM ");
        GuestVehicleInput vehicle = new GuestVehicleInput(
                " 51a-123.45 ", " Kia ", VehicleSize.SEDAN);

        NormalizedBookingCreateCommand result = policy.normalize(
                request(items(), null, null, contact, vehicle, null, " "), GUEST);

        assertThat(result.guest().fullName()).isEqualTo("Nguy\u1ec5n V\u0103n A");
        assertThat(result.guest().phone()).isEqualTo("+84901234567");
        assertThat(result.guest().email()).isEqualTo("user@example.com");
        assertThat(result.note()).isNull();
        assertThat(result.actor()).isEqualTo(GUEST);
        assertThat(result.toString()).doesNotContain(
                "+84901234567", "user@example.com", "51A-123.45");
        assertThat(contact.toString()).doesNotContain(
                "0901 234 567", "USER@Example.COM", "Nguy\u1ec5n");
        assertThat(vehicle.toString()).doesNotContain("51a-123.45", "Kia");
    }

    @Test
    void invalidMemberAndGuestShapesAreRejected() {
        NewVehicleInput inline = new NewVehicleInput("51A-123.45", "Kia", VehicleSize.SEDAN);
        GuestContactInput contact = new GuestContactInput("Guest", "0901234567", null);
        GuestVehicleInput guestVehicle = new GuestVehicleInput(
                "51A-123.45", "Kia", VehicleSize.SEDAN);

        assertRejected(request(items(), null, null, null, null, null, null), MEMBER);
        assertRejected(request(items(), 1L, inline, null, null, null, null), MEMBER);
        assertRejected(request(items(), 1L, null, contact, guestVehicle, null, null), MEMBER);
        assertRejected(request(items(), 1L, null, null, null, null, null), GUEST);
        assertRejected(request(items(), null, null, contact, null, null, null), GUEST);
        assertRejected(request(items(), null, null, contact, guestVehicle, 2L, null), GUEST);
        assertRejected(request(items(), null, inline, contact, guestVehicle, null, null), GUEST);
    }

    @Test
    void itemBoundsIdentifiersDuplicatesAndQuantitiesAreRejected() {
        assertRejected(request(List.of(), 1L, null, null, null, null, null), MEMBER);
        assertRejected(request(java.util.Collections.nCopies(
                21, new BookingItemSelection(1L, 1)), 1L, null, null, null, null, null), MEMBER);
        assertRejected(request(List.of(new BookingItemSelection(0L, 1)),
                1L, null, null, null, null, null), MEMBER);
        assertRejected(request(List.of(new BookingItemSelection(1L, 0)),
                1L, null, null, null, null, null), MEMBER);
        assertRejected(request(List.of(new BookingItemSelection(1L, 21)),
                1L, null, null, null, null, null), MEMBER);
        assertRejected(request(List.of(
                new BookingItemSelection(1L, 1), new BookingItemSelection(1L, 2)),
                1L, null, null, null, null, null), MEMBER);
    }

    @Test
    void proofPhoneMismatchAndUnsafeTextAreRejected() {
        GuestContactInput wrongPhone = new GuestContactInput("Guest", "0909999999", null);
        GuestVehicleInput vehicle = new GuestVehicleInput("51A-123.45", "Kia", VehicleSize.SEDAN);
        assertRejected(request(items(), null, null, wrongPhone, vehicle, null, null), GUEST);

        CreateBookingV2Request unsafe = request(items(), 1L, null, null, null, null,
                "hello\u0000world");
        assertRejected(unsafe, MEMBER);
    }

    private void assertRejected(CreateBookingV2Request request, BookingActor actor) {
        assertThatThrownBy(() -> policy.normalize(request, actor))
                .isInstanceOf(BadRequestException.class);
    }

    private CreateBookingV2Request request(
            List<BookingItemSelection> items,
            Long vehicleId,
            NewVehicleInput newVehicle,
            GuestContactInput guest,
            GuestVehicleInput guestVehicle,
            Long voucherId,
            String note) {
        return new CreateBookingV2Request(
                1L, START, items, vehicleId, newVehicle, guest, guestVehicle, voucherId, note);
    }

    private List<BookingItemSelection> items() {
        return List.of(new BookingItemSelection(1L, 1));
    }
}
