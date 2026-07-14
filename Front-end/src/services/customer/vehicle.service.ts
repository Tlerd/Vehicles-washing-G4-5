import apiClient from '../../config/axios';
import { Vehicle, CarSize } from '../../types';

export const vehicleService = {
  async getVehicles(customerId: string): Promise<Vehicle[]> {
    const response = await apiClient.get(`/vehicles`, {
      params: { customerId }
    });
    return response.data;
  },

  async addVehicle(customerId: string, licensePlate: string, brand: string, size: CarSize, notes?: string): Promise<Vehicle> {
    const response = await apiClient.post('/vehicles', {
      customerId,
      licensePlate,
      brand,
      size,
      notes,
    });
    return response.data;
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const response = await apiClient.patch(`/vehicles/${id}`, updates);
    return response.data;
  },

  async deleteVehicle(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  }
};
