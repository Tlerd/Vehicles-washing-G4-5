package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingActor;
import com.autowashpro.domain.booking.NormalizedBookingCreateCommand;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingIdempotencyCodecTest {

    private static final String VALID_PROOF = "gvp_" + "A".repeat(43);
    private final BookingIdempotencyCodec codec = new BookingIdempotencyCodec();

    @Test
    void keyBoundsAndVisibleAsciiAreEnforcedWithoutTrimming() {
        assertThat(codec.clientKeyHash("a".repeat(8))).hasSize(64);
        assertThat(codec.clientKeyHash("~".repeat(128))).hasSize(64);

        for (String invalid : List.of(
                "a".repeat(7), "a".repeat(129), " abcdefgh", "abcdefgh ",
                "abcd efgh", "abcd\ndef", "kh\u00f3a-key")) {
            assertThatThrownBy(() -> codec.clientKeyHash(invalid))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void everyDigestIsStableLowercaseAndDomainSeparated() {
        String clientKey = codec.clientKeyHash("abcdefgh");
        String proof = codec.guestProofHash(VALID_PROOF);
        String member = codec.memberPrincipalScopeHash(42L);
        String guest = codec.guestPrincipalScopeHash("+84901234567");
        String scoped = codec.scopedKeyHash("/api/v1/bookings", guest, clientKey);

        assertThat(List.of(clientKey, proof, member, guest, scoped))
                .allSatisfy(value -> assertThat(value).matches("[0-9a-f]{64}"))
                .doesNotHaveDuplicates();
        assertThat(codec.clientKeyHash("abcdefgh")).isEqualTo(clientKey);
    }

    @Test
    void equivalentNormalizedCommandsHashIdenticallyRegardlessOfInputItemOrder() {
        NormalizedBookingCreateCommand first = command(List.of(
                new NormalizedBookingCreateCommand.Item(2L, 1),
                new NormalizedBookingCreateCommand.Item(1L, 2)), "note");
        NormalizedBookingCreateCommand second = command(List.of(
                new NormalizedBookingCreateCommand.Item(1L, 2),
                new NormalizedBookingCreateCommand.Item(2L, 1)), "note");

        assertThat(codec.requestHash(first)).isEqualTo(codec.requestHash(second));
    }

    @Test
    void everySemanticFieldAffectsRequestHashButActorProofAndClientKeyDoNot() {
        NormalizedBookingCreateCommand base = command(
                List.of(new NormalizedBookingCreateCommand.Item(1L, 1)), "note");
        NormalizedBookingCreateCommand otherActor = new NormalizedBookingCreateCommand(
                new BookingActor.Member(99L), base.branchId(), base.startAt(), base.items(),
                base.vehicleId(), base.newVehicle(), base.guest(), base.guestVehicle(),
                base.voucherId(), base.note());
        NormalizedBookingCreateCommand changedNote = command(base.items(), "another");

        assertThat(codec.requestHash(otherActor)).isEqualTo(codec.requestHash(base));
        assertThat(codec.requestHash(changedNote)).isNotEqualTo(codec.requestHash(base));
        assertThat(codec.clientKeyHash("abcdefgh"))
                .isNotEqualTo(codec.clientKeyHash("abcdefgi"));
    }

    @Test
    void eachCanonicalBodyFieldHasIndependentHashCoverage() {
        NormalizedBookingCreateCommand guestBase = command(
                List.of(new NormalizedBookingCreateCommand.Item(1L, 1)), "note");
        List<NormalizedBookingCreateCommand> guestMutations = List.of(
                copy(guestBase, 2L, guestBase.startAt(), guestBase.items(), null,
                        null, guestBase.guest(), guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt().plusSeconds(1),
                        guestBase.items(), null, null, guestBase.guest(), guestBase.guestVehicle(),
                        null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(),
                        List.of(new NormalizedBookingCreateCommand.Item(2L, 1)), null,
                        null, guestBase.guest(), guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(),
                        List.of(new NormalizedBookingCreateCommand.Item(1L, 2)), null,
                        null, guestBase.guest(), guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, new NormalizedBookingCreateCommand.GuestContact(
                                "Another", guestBase.guest().phone(), guestBase.guest().email()),
                        guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, new NormalizedBookingCreateCommand.GuestContact(
                                guestBase.guest().fullName(), "+84909999999", guestBase.guest().email()),
                        guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, new NormalizedBookingCreateCommand.GuestContact(
                                guestBase.guest().fullName(), guestBase.guest().phone(), "other@example.com"),
                        guestBase.guestVehicle(), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, guestBase.guest(), new NormalizedBookingCreateCommand.Vehicle(
                                "51A-999.99", guestBase.guestVehicle().brand(),
                                guestBase.guestVehicle().vehicleSize()), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, guestBase.guest(), new NormalizedBookingCreateCommand.Vehicle(
                                guestBase.guestVehicle().licensePlate(), "Ford",
                                guestBase.guestVehicle().vehicleSize()), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, guestBase.guest(), new NormalizedBookingCreateCommand.Vehicle(
                                guestBase.guestVehicle().licensePlate(), guestBase.guestVehicle().brand(),
                                VehicleSize.SUV), null, guestBase.note()),
                copy(guestBase, guestBase.branchId(), guestBase.startAt(), guestBase.items(), null,
                        null, guestBase.guest(), guestBase.guestVehicle(), null, "changed"));
        assertEveryHashChanges(guestBase, guestMutations);

        NormalizedBookingCreateCommand savedVehicleMember = memberCommand(7L, null, 9L);
        assertEveryHashChanges(savedVehicleMember, List.of(
                copy(savedVehicleMember, savedVehicleMember.branchId(), savedVehicleMember.startAt(),
                        savedVehicleMember.items(), 8L, null, null, null, 9L, savedVehicleMember.note()),
                copy(savedVehicleMember, savedVehicleMember.branchId(), savedVehicleMember.startAt(),
                        savedVehicleMember.items(), 7L, null, null, null, 10L, savedVehicleMember.note())));

        NormalizedBookingCreateCommand.Vehicle inlineVehicle =
                new NormalizedBookingCreateCommand.Vehicle("51A-123.45", "Kia", VehicleSize.SEDAN);
        NormalizedBookingCreateCommand inlineVehicleMember = memberCommand(null, inlineVehicle, 9L);
        assertEveryHashChanges(inlineVehicleMember, List.of(
                copy(inlineVehicleMember, inlineVehicleMember.branchId(), inlineVehicleMember.startAt(),
                        inlineVehicleMember.items(), null,
                        new NormalizedBookingCreateCommand.Vehicle(
                                "51A-999.99", inlineVehicle.brand(), inlineVehicle.vehicleSize()),
                        null, null, 9L, inlineVehicleMember.note()),
                copy(inlineVehicleMember, inlineVehicleMember.branchId(), inlineVehicleMember.startAt(),
                        inlineVehicleMember.items(), null,
                        new NormalizedBookingCreateCommand.Vehicle(
                                inlineVehicle.licensePlate(), "Ford", inlineVehicle.vehicleSize()),
                        null, null, 9L, inlineVehicleMember.note()),
                copy(inlineVehicleMember, inlineVehicleMember.branchId(), inlineVehicleMember.startAt(),
                        inlineVehicleMember.items(), null,
                        new NormalizedBookingCreateCommand.Vehicle(
                                inlineVehicle.licensePlate(), inlineVehicle.brand(), VehicleSize.SUV),
                        null, null, 9L, inlineVehicleMember.note())));
    }

    private NormalizedBookingCreateCommand command(
            List<NormalizedBookingCreateCommand.Item> items, String note) {
        return new NormalizedBookingCreateCommand(
                new BookingActor.Guest("+84901234567", "a".repeat(64)),
                1L,
                Instant.parse("2026-07-25T03:00:00Z"),
                items,
                null,
                null,
                new NormalizedBookingCreateCommand.GuestContact(
                        "Guest", "+84901234567", "guest@example.com"),
                new NormalizedBookingCreateCommand.Vehicle(
                        "51A-123.45", "Kia", VehicleSize.SEDAN),
                null,
                note);
    }

    private NormalizedBookingCreateCommand memberCommand(
            Long vehicleId, NormalizedBookingCreateCommand.Vehicle newVehicle, Long voucherId) {
        return new NormalizedBookingCreateCommand(
                new BookingActor.Member(42L),
                1L,
                Instant.parse("2026-07-25T03:00:00Z"),
                List.of(new NormalizedBookingCreateCommand.Item(1L, 1)),
                vehicleId,
                newVehicle,
                null,
                null,
                voucherId,
                "note");
    }

    private void assertEveryHashChanges(
            NormalizedBookingCreateCommand base,
            List<NormalizedBookingCreateCommand> mutations) {
        String baseHash = codec.requestHash(base);
        assertThat(mutations).allSatisfy(
                mutation -> assertThat(codec.requestHash(mutation)).isNotEqualTo(baseHash));
    }

    private NormalizedBookingCreateCommand copy(
            NormalizedBookingCreateCommand base,
            long branchId,
            Instant startAt,
            List<NormalizedBookingCreateCommand.Item> items,
            Long vehicleId,
            NormalizedBookingCreateCommand.Vehicle newVehicle,
            NormalizedBookingCreateCommand.GuestContact guest,
            NormalizedBookingCreateCommand.Vehicle guestVehicle,
            Long voucherId,
            String note) {
        return new NormalizedBookingCreateCommand(
                base.actor(), branchId, startAt, items, vehicleId, newVehicle,
                guest, guestVehicle, voucherId, note);
    }
}
