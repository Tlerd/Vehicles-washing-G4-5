import apiClient from '../config/axios';
import { Booking, BookingStatus, CustomerTier, PointsTransaction } from '../types';

export interface CustomerVoucher {
  voucherId: number;
  voucherCode: string;
  voucherType: string;
  discountAmount: number;
  status: string;
  expiredAt: string;
  redeemedAt?: string | null;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: CustomerTier;
  accumulatedPoints: number;
  totalSpend: number;
  totalWashes: number;
  vehicles: string[];
}

export interface AdminBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  licensePlate: string;
  branch: string;
  date: string;
  time: string;
  totalPrice: number;
  status: BookingStatus;
}

export interface AdminBookingPage {
  content: AdminBooking[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  completedBookings: number;
  series: Record<string, number>;
}

export interface CampaignApiResponse {
  promotionId: number;
  promotionName: string;
  description: string;
  discountPercent: number;
  targetTier: string;
  startDate: string;
  endDate: string;
  status: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface CreateCampaignPayload {
  name: string;
  goal: string;
  multiplier: number;
  targetTier: string;
  startDate: string;
  endDate: string;
}

const toBranchCode = (branchId: unknown): string => {
  if (String(branchId) === '1') return 'D1';
  if (String(branchId) === '2') return 'D7';
  return String(branchId || '');
};

const mapBooking = (data: Record<string, unknown>): Booking => ({
  id: String(data.id),
  bookingRef: String(data.bookingRef || ''),
  customerId: String(data.customerId || ''),
  vehicleId: String(data.vehicleId || ''),
  customerName: String(data.customerName || ''),
  customerPhone: String(data.customerPhone || ''),
  licensePlate: String(data.licensePlate || ''),
  vehicleBrand: String(data.vehicleBrand || ''),
  services: Array.isArray(data.serviceNames) ? data.serviceNames.map(String) : [],
  carSize: String(data.vehicleSize || 'SEDAN').toLowerCase() as Booking['carSize'],
  branchId: toBranchCode(data.branchId),
  date: String(data.bookingDate || data.date || ''),
  time: String(data.bookingTime || data.time || ''),
  endTime: String(data.endTime || ''),
  durationMinutes: Number(data.durationMinutes || 0),
  totalPrice: Number(data.totalPrice || 0),
  status: data.status as BookingStatus,
  pointsEarned: Number(data.pointsEarned || 0),
  appliedVoucherId: data.appliedVoucherId ? String(data.appliedVoucherId) : undefined,
  createdAt: String(data.createdAt || new Date().toISOString()),
});

const mapAdminCustomer = (data: Record<string, unknown>): AdminCustomer => ({
  id: String(data.id),
  name: String(data.name || ''),
  phone: String(data.phone || ''),
  email: data.email ? String(data.email) : '',
  tier: String(data.tier || 'Member') as CustomerTier,
  accumulatedPoints: Number(data.accumulatedPoints || 0),
  totalSpend: Number(data.totalSpend || 0),
  totalWashes: Number(data.totalWashes || 0),
  vehicles: Array.isArray(data.vehicles) ? data.vehicles.map(String) : [],
});

const mapAdminBooking = (data: Record<string, unknown>): AdminBooking => ({
  id: String(data.id),
  bookingRef: String(data.bookingRef || ''),
  customerName: String(data.customerName || ''),
  licensePlate: String(data.licensePlate || ''),
  branch: String(data.branch || ''),
  date: String(data.date || ''),
  time: String(data.time || ''),
  totalPrice: Number(data.totalPrice || 0),
  status: data.status as BookingStatus,
});

export const platformService = {
  async points(customerId: string): Promise<PointsTransaction[]> {
    const { data } = await apiClient.get<Record<string, unknown>[]>(`/loyalty/customers/${customerId}/points`);
    return data.map((item) => ({
      id: String(item.pointHistoryId),
      customerId,
      type: String(item.activityType || '').toLowerCase() as PointsTransaction['type'],
      points: Number(item.points || 0),
      description: String(item.description || ''),
      createdAt: String(item.createdAt || ''),
    }));
  },

  async vouchers(customerId: string): Promise<CustomerVoucher[]> {
    const { data } = await apiClient.get<CustomerVoucher[]>(`/loyalty/customers/${customerId}/vouchers`);
    return data.map((item) => ({ ...item, discountAmount: Number(item.discountAmount) }));
  },

  async redeem(customerId: string, voucherType: string, pointsCost: number): Promise<CustomerVoucher> {
    const { data } = await apiClient.post<CustomerVoucher>('/loyalty/vouchers/redeem', {
      customerId: Number(customerId),
      voucherType,
      pointsCost,
    });
    return { ...data, discountAmount: Number(data.discountAmount) };
  },

  async queue(date: string): Promise<Booking[]> {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/washing-counter/queue', { params: { date } });
    return data.map(mapBooking);
  },

  async status(id: string, status: BookingStatus): Promise<Booking> {
    const { data } = await apiClient.patch<Record<string, unknown>>(`/washing-counter/bookings/${id}/status`, { status });
    return mapBooking(data);
  },

  async customers(q = ''): Promise<AdminCustomer[]> {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/admin/customers', { params: { q } });
    return data.map(mapAdminCustomer);
  },

  async updateAdminCustomer(id: string, body: { name?: string; email?: string }): Promise<AdminCustomer> {
    const { data } = await apiClient.patch<Record<string, unknown>>(`/admin/customers/${id}`, body);
    return mapAdminCustomer(data);
  },

  async adminBookings(page = 0, status = '', date?: string, size = 20): Promise<AdminBookingPage> {
    const { data } = await apiClient.get<Record<string, unknown>>('/admin/bookings', {
      params: { page, size, status: status || undefined, date: date || undefined },
    });
    return {
      content: Array.isArray(data.content)
        ? (data.content as Record<string, unknown>[]).map(mapAdminBooking)
        : [],
      number: Number(data.number || 0),
      size: Number(data.size || size),
      totalElements: Number(data.totalElements || 0),
      totalPages: Number(data.totalPages || 0),
      last: Boolean(data.last),
    };
  },

  async revenue(period = 'month'): Promise<RevenueReport> {
    const { data } = await apiClient.get<RevenueReport>('/admin/revenue', { params: { period } });
    return {
      ...data,
      totalRevenue: Number(data.totalRevenue || 0),
      completedBookings: Number(data.completedBookings || 0),
      series: Object.fromEntries(
        Object.entries(data.series || {}).map(([key, value]) => [key, Number(value)]),
      ),
    };
  },

  async audit(): Promise<PointsTransaction[]> {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/admin/audit-logs');
    return data.map((item) => ({
      id: String(item.id),
      customerId: String(item.customerId || ''),
      type: String(item.type || '').toLowerCase() as PointsTransaction['type'],
      points: Number(item.points || 0),
      description: String(item.description || ''),
      createdAt: String(item.createdAt || ''),
    }));
  },

  async campaigns(): Promise<CampaignApiResponse[]> {
    return (await apiClient.get<CampaignApiResponse[]>('/admin/campaigns')).data;
  },

  async createCampaign(body: CreateCampaignPayload): Promise<CampaignApiResponse> {
    return (await apiClient.post<CampaignApiResponse>('/admin/campaigns', body)).data;
  },

  async deleteCampaign(id: string | number): Promise<void> {
    await apiClient.delete(`/admin/campaigns/${id}`);
  },
};
