package com.autowashpro.controller;

import com.autowashpro.dto.vehicle.VehicleRequest;
import com.autowashpro.dto.vehicle.VehicleResponse;
import com.autowashpro.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://localhost:5173"
})
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getVehicles(
            @RequestParam Long customerId
    ) {
        return ResponseEntity.ok(
                vehicleService.getVehiclesByCustomer(customerId)
        );
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> createVehicle(
            @RequestBody VehicleRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        vehicleService.createVehicle(
                                request.getCustomerId(),
                                request
                        )
                );
    }

    @PatchMapping("/{vehicleId}")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable Long vehicleId,
            @RequestBody VehicleRequest request
    ) {
        return ResponseEntity.ok(
                vehicleService.updateVehicle(
                        vehicleId,
                        request
                )
        );
    }

   @DeleteMapping("/{vehicleId}")
public ResponseEntity<Void> deleteVehicle(
        @PathVariable Long vehicleId
) {
    vehicleService.deleteVehicle(vehicleId);
    return ResponseEntity.noContent().build();
}

    @PatchMapping("/{vehicleId}/default")
    public ResponseEntity<VehicleResponse> setDefaultVehicle(
            @PathVariable Long vehicleId,
            @RequestParam Long customerId
    ) {
        return ResponseEntity.ok(
                vehicleService.setDefaultVehicle(
                        vehicleId,
                        customerId
                )
        );
    }
}