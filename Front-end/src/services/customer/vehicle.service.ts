import apiClient from '../../config/axios';
import { Vehicle, CarSize } from '../../types';
import { mockStore } from '../mockStore';

export const vehicleService = {
  async getVehicles(customerId: string): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get(`/vehicles`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.warn('Bypassing API error, returning Mock Data for getVehicles');
      return mockStore.getVehiclesByCustomer(customerId);
    }
  },

  async addVehicle(customerId: string, licensePlate: string, brand: string, size: CarSize, notes?: string): Promise<Vehicle> {
    try {
      const response = await apiClient.post('/vehicles', {
        customerId,
        licensePlate,
        brand,
        size,
        notes,
      });
      return response.data;
    } catch (error) {
      console.warn('Bypassing API error, saving to Mock Data for addVehicle');
      const newVehicle: Vehicle = {
        id: `v_${Date.now()}`,
        customerId,
        licensePlate,
        brand,
        size,
        notes,
        isDefault: false
      };
      mockStore.addVehicle(newVehicle);
      return newVehicle;
    }
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await apiClient.patch(`/vehicles/${id}`, updates);
      return response.data;
    } catch (error) {
      console.warn('Bypassing API error, updating Mock Data for updateVehicle');
      mockStore.updateVehicle(id, updates);
      return { id, ...updates } as Vehicle;
    }
  },

  async deleteVehicle(id: string): Promise<void> {
    try {
      await apiClient.delete(`/vehicles/${id}`);
    } catch (error) {
      console.warn('Bypassing API error, deleting from Mock Data');
      mockStore.deleteVehicle(id);
    }
  }
};
