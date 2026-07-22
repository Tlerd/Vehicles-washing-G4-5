import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type VehicleSizeCode = 'HATCHBACK' | 'SEDAN' | 'SUV' | 'PICKUP';

export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  size: VehicleSizeCode;
  notes?: string;
  isDefault: boolean;
}

export interface VehicleInput {
  licensePlate: string;
  brand: string;
  size: VehicleSizeCode;
  notes?: string;
  isDefault?: boolean;
}

interface VehicleApiResponse {
  id: number;
  customerId: number;
  licensePlate: string;
  brand: string;
  size: string;
  notes: string | null;
  isDefault: boolean;
}

function mapVehicle(v: VehicleApiResponse): Vehicle {
  return {
    id: String(v.id),
    licensePlate: v.licensePlate,
    brand: v.brand,
    // Backend data has been observed with inconsistent case (e.g. "sedan"
    // instead of the VehicleSize enum's "SEDAN") — normalize defensively so
    // i18n lookups and the edit form's <select> always match.
    size: v.size.toUpperCase() as VehicleSizeCode,
    notes: v.notes ?? undefined,
    isDefault: v.isDefault,
  };
}

/** Real /api/v1/vehicles CRUD (bug garage rewrite). The `customerId` query
 *  param the backend requires is ignored server-side in favor of the JWT
 *  subject (VehicleController overwrites it from @AuthenticationPrincipal),
 *  but Spring still requires it to be present and parseable. */
export function useVehicles(customerId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const rows = await apiClient.get<VehicleApiResponse[]>(
        `/vehicles?customerId=${customerId}`,
      );
      return rows.map(mapVehicle);
    },
  });
}

export function useAddVehicle(customerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) => apiClient.post<VehicleApiResponse>('/vehicles', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles', customerId] }),
  });
}

export function useUpdateVehicle(customerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: VehicleInput }) =>
      apiClient.patch<VehicleApiResponse>(`/vehicles/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles', customerId] }),
  });
}

export function useDeleteVehicle(customerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles', customerId] }),
  });
}
