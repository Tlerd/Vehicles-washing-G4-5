import { useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useServices } from '@/lib/api/bookings';
import { useVehicles } from '@/lib/api/vehicles';
import { sizeMultiplier } from '@/lib/money';
import { useBookingStore } from './store';

export interface CartLine {
  code: string;
  name: string;
  basePrice: number;
}

export interface CartSummary {
  lines: CartLine[];
  total: number;
}

/** Mirrors BookingManagementService.create(): sum the selected services'
 *  base prices, then apply the vehicle-size multiplier once to the total
 *  (not per line item — the backend has no per-service size flag). */
export function useCartSummary(): CartSummary {
  const serviceCodes = useBookingStore((s) => s.serviceCodes);
  const savedVehicleId = useBookingStore((s) => s.savedVehicleId);
  const manualSize = useBookingStore((s) => s.manualVehicle.size);
  const { customer } = useAuth();
  const { data: services } = useServices();
  const { data: savedVehicles } = useVehicles(customer?.id);

  return useMemo<CartSummary>(() => {
    const catalog = services ?? [];
    const lines: CartLine[] = serviceCodes
      .map((code) => catalog.find((s) => s.code === code))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ code: s.code, name: s.name, basePrice: s.basePrice }));

    const rawTotal = lines.reduce((sum, line) => sum + line.basePrice, 0);
    const savedVehicle = savedVehicleId
      ? savedVehicles?.find((v) => v.id === savedVehicleId)
      : undefined;
    const vehicleSize = savedVehicle?.size ?? manualSize;
    const total = Math.round(rawTotal * sizeMultiplier(vehicleSize));

    return { lines, total };
  }, [serviceCodes, services, savedVehicleId, savedVehicles, manualSize]);
}
