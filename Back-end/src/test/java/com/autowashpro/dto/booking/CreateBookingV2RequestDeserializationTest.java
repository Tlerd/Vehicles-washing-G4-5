package com.autowashpro.dto.booking;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CreateBookingV2RequestDeserializationTest {

    private final ObjectMapper mapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

    @Test
    void canonicalBodyDeserializesWithBootsPermissiveMapperSetting() throws Exception {
        CreateBookingV2Request request = mapper.readValue("""
                {
                  "branchId": 1,
                  "startAt": "2026-07-25T03:00:00Z",
                  "items": [{"serviceId": 2, "quantity": 1}],
                  "vehicleId": 71,
                  "newVehicle": null,
                  "guest": null,
                  "guestVehicle": null,
                  "voucherId": null,
                  "note": "Xe moi"
                }
                """, CreateBookingV2Request.class);

        assertThat(request.branchId()).isEqualTo(1L);
        assertThat(request.items()).hasSize(1);
    }

    @Test
    void unknownAuthorityAndLegacyFieldsAreRejectedEvenWhenMapperIsPermissive() {
        for (String field : new String[]{
                "customerId", "role", "status", "totalPrice", "durationMinutes",
                "paymentStatus", "serviceCodes", "bookingDate", "bookingTime"}) {
            String json = """
                    {
                      "branchId": 1,
                      "startAt": "2026-07-25T03:00:00Z",
                      "items": [{"serviceId": 2, "quantity": 1}],
                      "vehicleId": 71,
                      "%s": "attacker-owned"
                    }
                    """.formatted(field);
            assertThatThrownBy(() -> mapper.readValue(json, CreateBookingV2Request.class))
                    .as("field %s", field)
                    .hasMessageContaining("Unknown booking field");
        }
    }

    @Test
    void unknownNestedFieldsAreRejected() {
        String json = """
                {
                  "branchId": 1,
                  "startAt": "2026-07-25T03:00:00Z",
                  "items": [{"serviceId": 2, "quantity": 1, "unitPrice": 1}],
                  "vehicleId": 71
                }
                """;

        assertThatThrownBy(() -> mapper.readValue(json, CreateBookingV2Request.class))
                .hasMessageContaining("Unknown booking field");
    }

    @Test
    void beanValidationAllowsEmailFormattingThatThePolicyNormalizes() throws Exception {
        CreateBookingV2Request request = mapper.readValue("""
                {
                  "branchId": 1,
                  "startAt": "2026-07-25T03:00:00Z",
                  "items": [{"serviceId": 2, "quantity": 1}],
                  "guest": {
                    "fullName": "Guest",
                    "phone": "0901 234 567",
                    "email": " USER@Example.COM "
                  },
                  "guestVehicle": {
                    "licensePlate": "51A-123.45",
                    "brand": "Kia",
                    "vehicleSize": "SEDAN"
                  }
                }
                """, CreateBookingV2Request.class);

        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(factory.getValidator().validate(request)).isEmpty();
        }
        assertThat(request.toString()).doesNotContain(
                "0901 234 567", "USER@Example.COM", "51A-123.45");
    }
}
