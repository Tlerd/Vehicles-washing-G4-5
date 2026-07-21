import { useMemo } from 'react';
import type { CartItem } from '@/types';
import { depositForTotal, priceForSize } from '@/lib/money';
import { occupiedSlots } from '@/lib/slot';
import { useCatalog } from '@/lib/mock/api';
import { useBookingStore } from './store';

const SLOT_MIN = 15;

export interface CartSummary {
  items: CartItem[];
  total: number;
  fromTotal: number; // size S estimate for the "từ X đ" hint at step 2
  deposit: number;
  requiredSlots: number;
  occupiedMinutes: number;
}

/** Derive the cart (line items, totals, slot occupancy) from the selection and
 *  the chosen vehicle size. Recomputes exactly at step 5 (D-08). */
export function useCartSummary(): CartSummary {
  const serviceIds = useBookingStore((s) => s.serviceIds);
  const comboIds = useBookingStore((s) => s.comboIds);
  const size = useBookingStore((s) => s.vehicle.size);
  const { data } = useCatalog();

  return useMemo<CartSummary>(() => {
    const services = data?.services ?? [];
    const combos = data?.combos ?? [];
    const items: CartItem[] = [];
    let occupiedMinutes = 0;
    let fromTotal = 0;

    for (const id of serviceIds) {
      const svc = services.find((s) => s.id === id);
      if (!svc) continue;
      items.push({
        refId: svc.id,
        kind: 'SINGLE',
        name: svc.name,
        unitPrice: priceForSize(svc.basePrice, size, svc.isSizeDependent),
      });
      fromTotal += svc.basePrice;
      occupiedMinutes += svc.durationMin + svc.bufferMin;
    }
    for (const id of comboIds) {
      const combo = combos.find((c) => c.id === id);
      if (!combo) continue;
      items.push({ refId: combo.id, kind: 'COMBO', name: combo.name, unitPrice: combo.price });
      fromTotal += combo.price;
      occupiedMinutes += combo.durationMin + combo.bufferMin;
    }

    const total = items.reduce((sum, i) => sum + i.unitPrice, 0);
    return {
      items,
      total,
      fromTotal,
      deposit: depositForTotal(total),
      requiredSlots: occupiedMinutes ? occupiedSlots(occupiedMinutes, 0, SLOT_MIN) : 0,
      occupiedMinutes,
    };
  }, [serviceIds, comboIds, size, data]);
}
