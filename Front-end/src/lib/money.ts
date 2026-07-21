import type { VehicleSizeCode } from './api/vehicles';

/** Mirrors BookingManagementService.create()'s multiplier, applied once to
 *  the summed service total — not per line item. */
const SIZE_MULTIPLIER: Record<VehicleSizeCode, number> = {
  HATCHBACK: 0.9,
  SEDAN: 1.0,
  SUV: 1.2,
  PICKUP: 1.4,
};

export const SIZE_LABEL: Record<VehicleSizeCode, string> = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV / Crossover',
  PICKUP: 'Bán tải',
};

export function sizeMultiplier(size: VehicleSizeCode): number {
  return SIZE_MULTIPLIER[size];
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
