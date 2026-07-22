import apiClient from '../../config/axios';
import { Vehicle, CarSize } from '../../types';

export const vehicleService = {
  async getVehicles(customerId: string): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get(`/vehicles`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  async addVehicle(customerId: string, licensePlate: string, brand: string, size: CarSize, notes?: string, isDefault = false): Promise<Vehicle> {
    const response = await apiClient.post('/vehicles', {
      customerId,
      licensePlate,
      brand,
      size,
      notes,
      isDefault,
    });
    return response.data;
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await apiClient.patch(`/vehicles/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  async setDefaultVehicle(vehicleId: string, customerId: string): Promise<void> {
    try {
      await apiClient.patch(`/vehicles/${vehicleId}/default`, { customerId });
    } catch (error) {
      console.error('Error setting default vehicle:', error);
      throw error;
    }
  },

  async deleteVehicle(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
