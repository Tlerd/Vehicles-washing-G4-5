import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { VehicleSizeCode } from './vehicles';

interface BranchApiResponse {
  branchId: number;
  branchName: string;
  address: string | null;
  phone: string | null;
  openTime: string;
  closeTime: string;
  status: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  openTime: string;
  closeTime: string;
}

function mapBranch(b: BranchApiResponse): Branch {
  return {
    id: String(b.branchId),
    name: b.branchName,
    address: b.address ?? '',
    openTime: b.openTime.slice(0, 5),
    closeTime: b.closeTime.slice(0, 5),
  };
}

/** GET /api/v1/catalog/branches — real, ACTIVE-only branches. */
export function useBranches() {
  return useQuery({
    queryKey: ['booking-branches'],
    queryFn: async () => (await apiClient.get<BranchApiResponse[]>('/catalog/branches')).map(mapBranch),
  });
}

interface ServiceApiResponse {
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  description: string | null;
  basePrice: number;
  durationMinutes: number | null;
  status: string;
}

export interface CatalogService {
  code: string;
  name: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
}

function mapService(s: ServiceApiResponse): CatalogService {
  return {
    code: s.serviceCode,
    name: s.serviceName,
    description: s.description ?? '',
    basePrice: s.basePrice,
    durationMinutes: s.durationMinutes ?? 30,
  };
}

/** GET /api/v1/catalog/services — real, ACTIVE-only single services. Combos
 *  have no backend representation (Phase 1 decision: single services only). */
export function useServices() {
  return useQuery({
    queryKey: ['booking-services'],
    queryFn: async () => (await apiClient.get<ServiceApiResponse[]>('/catalog/services')).map(mapService),
  });
}

export interface AvailabilitySlot {
  time: string;
  endTime: string;
  durationMinutes: number;
  available: boolean;
}

/** GET /api/v1/bookings/availability — one branch/day at a time, real
 *  30-minute/branch-level granularity (no bay-aware 15-minute grid). */
export function useAvailability(
  branchId: string | undefined,
  date: string | undefined,
  serviceCodes: string[],
) {
  return useQuery({
    queryKey: ['booking-availability', branchId, date, serviceCodes.join(',')],
    enabled: Boolean(branchId && date && serviceCodes.length > 0),
    queryFn: async () => {
      const params = new URLSearchParams({ branchId: branchId!, date: date! });
      serviceCodes.forEach((code) => params.append('serviceCodes', code));
      return apiClient.get<AvailabilitySlot[]>(`/bookings/availability?${params.toString()}`);
    },
  });
}

export interface CreateBookingInput {
  vehicleId?: string;
  licensePlate?: string;
  brand?: string;
  vehicleSize?: VehicleSizeCode;
  branchId: string;
  serviceCodes: string[];
  bookingDate: string;
  bookingTime: string;
}

interface BookingApiResponse {
  id: number;
  bookingRef: string;
  branchId: number;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  vietQrUrl: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  branchId: string;
  serviceNames: string[];
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: string;
  vietQrUrl: string;
}

function mapBooking(b: BookingApiResponse): Booking {
  return {
    id: String(b.id),
    bookingRef: b.bookingRef,
    branchId: String(b.branchId),
    serviceNames: b.serviceNames,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime.slice(0, 5),
    totalPrice: b.totalPrice,
    status: b.status,
    vietQrUrl: b.vietQrUrl,
  };
}

/** POST /api/v1/bookings. `customerId` is required by the DTO's Bean
 *  Validation but always overwritten server-side from the JWT subject
 *  (BookingController.create()) — the placeholder value here is never used. */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      apiClient
        .post<BookingApiResponse>('/bookings', {
          customerId: 0,
          vehicleId: input.vehicleId ? Number(input.vehicleId) : undefined,
          licensePlate: input.licensePlate,
          brand: input.brand,
          vehicleSize: input.vehicleSize,
          branchId: Number(input.branchId),
          serviceCodes: input.serviceCodes,
          bookingDate: input.bookingDate,
          bookingTime: input.bookingTime,
        })
        .then(mapBooking),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
