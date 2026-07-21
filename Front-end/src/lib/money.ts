<<<<<<< Updated upstream
import type { VehicleSize } from '@/types';

/** BR-001 size multipliers. */
const SIZE_MULTIPLIER: Record<VehicleSize, number> = {
  S: 1.0,
  M: 1.2,
  L: 1.4,
};

export const SIZE_LABEL: Record<VehicleSize, string> = {
  S: 'Nhỏ (Sedan/Hatchback)',
  M: 'Vừa (SUV/Crossover)',
  L: 'Lớn (Bán tải/7 chỗ)',
};

/** Round to the nearest 1.000đ so derived prices look natural. */
export function priceForSize(
  basePrice: number,
  size: VehicleSize,
  isSizeDependent: boolean,
): number {
  if (!isSizeDependent) return basePrice;
  return Math.round((basePrice * SIZE_MULTIPLIER[size]) / 1000) * 1000;
=======
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
>>>>>>> Stashed changes
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
<<<<<<< Updated upstream

/** Deposit tier (D-26). deposit = MIN(tier, total). */
export function depositForTotal(total: number): number {
  let tier: number;
  if (total < 500_000) tier = 50_000;
  else if (total <= 2_000_000) tier = 200_000;
  else tier = 500_000;
  return Math.min(tier, total);
}
=======
>>>>>>> Stashed changes
