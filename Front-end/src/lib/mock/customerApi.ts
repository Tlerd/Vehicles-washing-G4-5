import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VehicleInfo } from '@/types';
import { store, tierForPoints } from './customer';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** [GIẢ ĐỊNH] 1 điểm / 10.000đ chi tiêu — số giả định, chưa có nguồn, chỉ để
 *  demo D-01 (khách tự complete → cộng điểm) hoạt động end-to-end. */
const POINTS_PER_VND = 1 / 10_000;

export function useCurrentCustomer() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => delay({ ...store.profile }),
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ['customer', 'vehicles'],
    queryFn: () => delay([...store.vehicles]),
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInfo) => {
      store.vehicles.push({ id: `veh-${Date.now()}`, ...input });
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<VehicleInfo> }) => {
      const idx = store.vehicles.findIndex((v) => v.id === id);
      if (idx >= 0) store.vehicles[idx] = { ...store.vehicles[idx], ...patch };
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      store.vehicles = store.vehicles.filter((v) => v.id !== id);
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'vehicles'] }),
  });
}

export function useBookingHistory() {
  return useQuery({
    queryKey: ['customer', 'bookings'],
    queryFn: () => delay([...store.bookings]),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', 'bookings', id],
    enabled: Boolean(id),
    queryFn: () => delay(store.bookings.find((b) => b.id === id) ?? null),
  });
}

interface BookingActionInput {
  id: string;
  /** BR-028: forwarded to the real POST as 'Idempotency-Key' in Phase 3; the
   *  mock ignores it (no network layer to dedupe against yet). */
  idempotencyKey: string;
}

/** D-01: customer self check-in (staff no longer approves/rejects). */
export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: BookingActionInput) => {
      const booking = store.bookings.find((b) => b.id === id);
      if (booking && booking.status === 'CONFIRMED') booking.status = 'CHECKED_IN';
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'bookings'] }),
  });
}

/** D-01: customer self-confirms completion; this credits points (lỗi #14
 *  link booking↔point) and re-evaluates tier immediately (lỗi #15). */
export function useCompleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: BookingActionInput) => {
      const booking = store.bookings.find((b) => b.id === id);
      if (booking && booking.status === 'CHECKED_IN') {
        booking.status = 'COMPLETED';
        const earned = Math.round(booking.total * POINTS_PER_VND);
        store.profile.points += earned;
        store.profile.tierId = tierForPoints(store.profile.points).id;
        store.pointHistory.unshift({
          id: `pt-${Date.now()}`,
          dayKey: booking.dayKey,
          points: earned,
          reason: `Hoàn thành đơn ${booking.id}`,
        });
      }
      return delay(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['customer', 'profile'] });
      qc.invalidateQueries({ queryKey: ['customer', 'points'] });
    },
  });
}

/** lỗi #13: feedback opens right after the customer confirms completion. */
export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment: string }) => {
      const booking = store.bookings.find((b) => b.id === id);
      if (booking) {
        booking.feedbackRating = rating;
        booking.feedbackComment = comment;
      }
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'bookings'] }),
  });
}

export function usePointHistory() {
  return useQuery({
    queryKey: ['customer', 'points'],
    queryFn: () => delay([...store.pointHistory]),
  });
}

export function useVouchers() {
  return useQuery({
    queryKey: ['customer', 'vouchers'],
    queryFn: () => delay([...store.vouchers]),
  });
}

export function useRedeemVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (costPoints: number) => {
      if (store.profile.points < costPoints) throw new Error('Không đủ điểm để đổi voucher.');
      store.profile.points -= costPoints;
      return delay(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'profile'] }),
  });
}
