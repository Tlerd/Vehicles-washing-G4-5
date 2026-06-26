import { Vehicle, CarSize } from '../../types';
import { mockStore } from '../mockStore';

export const vehicleService = {
  getVehicles(customerId: string): Vehicle[] {
    return mockStore.getVehiclesByCustomer(customerId);
  },

  addVehicle(customerId: string, licensePlate: string, brand: string, size: CarSize, notes?: string): Vehicle {
    const vehicle: Vehicle = {
      id: `v_${Date.now()}`,
      customerId,
      licensePlate,
      brand,
      size,
      notes,
      isDefault: false,
    };
    mockStore.addVehicle(vehicle);
    return vehicle;
  },

  updateVehicle(id: string, updates: Partial<Vehicle>): void {
    mockStore.updateVehicle(id, updates);
  },

  deleteVehicle(id: string): void {
    mockStore.deleteVehicle(id);
  }
};
