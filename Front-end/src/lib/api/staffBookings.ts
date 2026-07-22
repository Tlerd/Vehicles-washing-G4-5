import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type BookingStatusCode = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

interface StaffBookingApiResponse {
  id: number;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  vehicleBrand: string;
  serviceNames: string[];
  bookingTime: string;
  totalPrice: number;
  status: BookingStatusCode;
  paymentStatus: string | null;
}

export interface StaffBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  vehicleBrand: string;
  serviceNames: string[];
  bookingTime: string;
  totalPrice: number;
  status: BookingStatusCode;
  paymentStatus: string | null;
}

function mapStaffBooking(b: StaffBookingApiResponse): StaffBooking {
  return {
    id: String(b.id),
    bookingRef: b.bookingRef,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    licensePlate: b.licensePlate,
    vehicleBrand: b.vehicleBrand,
    serviceNames: b.serviceNames,
    bookingTime: b.bookingTime.slice(0, 5),
    totalPrice: b.totalPrice,
    status: b.status,
    paymentStatus: b.paymentStatus,
  };
}

/** GET /api/v1/washing-counter/queue — STAFF/ADMIN only, today's bookings. */
export function useStaffQueue(date: string) {
  return useQuery({
    queryKey: ['staff-queue', date],
    queryFn: async () =>
      (await apiClient.get<StaffBookingApiResponse[]>(`/washing-counter/queue?date=${date}`)).map(
        mapStaffBooking,
      ),
    refetchInterval: 15_000,
  });
}

/** PATCH /api/v1/washing-counter/bookings/{id}/status — drives the real
 *  booking lifecycle (PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED). */
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatusCode }) =>
      apiClient.patch(`/washing-counter/bookings/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-queue'] }),
  });
}
