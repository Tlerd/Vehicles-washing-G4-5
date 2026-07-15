import type { BookingStatus } from '../../types';

export type AdminTier = 'Member' | 'Silver' | 'Gold' | 'Platinum';

export interface AdminCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: AdminTier;
  accumulatedPoints: number;
  totalSpend: number;
  totalWashes: number;
  vehicles: string[];
}

export interface AdminBookingRecord {
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
  content: AdminBookingRecord[];
  page: number;
  size: number;
  totalItems: number;
  last: boolean;
}

export interface AdminRevenueSnapshot {
  period: 'day' | 'month' | 'year';
  totalRevenue: number;
  completedBookings: number;
  series: Record<string, number>;
}

export interface AdminAuditRecord {
  id: string;
  customerId: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface AdminCampaignRecord {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  targetTier: string;
  startDate: string;
  endDate: string;
  status: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown, fallback = '') =>
  value === undefined || value === null ? fallback : String(value);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const normalizeTier = (value: unknown): AdminTier => {
  const normalized = toText(value, 'MEMBER').trim().toUpperCase();
  if (normalized === 'SILVER') return 'Silver';
  if (normalized === 'GOLD') return 'Gold';
  if (normalized === 'PLATINUM') return 'Platinum';
  return 'Member';
};

const normalizeStatus = (value: unknown): BookingStatus => {
  const normalized = toText(value, 'PENDING').trim().toUpperCase();
  if (normalized === 'CONFIRMED') return 'CONFIRMED';
  if (normalized === 'CHECKED_IN') return 'CHECKED_IN';
  if (normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
};

const parseVehiclePlate = (value: unknown) => {
  if (isRecord(value)) return toText(value.licensePlate ?? value.plate);
  return toText(value);
};

export function parseAdminCustomers(payload: unknown): AdminCustomerRecord[] {
  if (!Array.isArray(payload)) return [];

  return payload.filter(isRecord).map(customer => ({
    id: toText(customer.id ?? customer.customerId),
    name: toText(customer.name ?? customer.fullName, 'Unnamed customer'),
    phone: toText(customer.phone),
    email: toText(customer.email),
    tier: normalizeTier(customer.tier),
    accumulatedPoints: toNumber(customer.accumulatedPoints),
    totalSpend: toNumber(customer.totalSpend ?? customer.totalSpent),
    totalWashes: toNumber(customer.totalWashes),
    vehicles: Array.isArray(customer.vehicles)
      ? customer.vehicles.map(parseVehiclePlate).filter(Boolean)
      : [],
  }));
}

const parseAdminBooking = (payload: Record<string, unknown>): AdminBookingRecord => ({
  id: toText(payload.id ?? payload.bookingId),
  bookingRef: toText(payload.bookingRef ?? payload.id ?? payload.bookingId),
  customerName: toText(payload.customerName, 'Guest'),
  licensePlate: toText(payload.licensePlate, 'Vehicle unavailable'),
  branch: toText(payload.branch ?? payload.branchName ?? payload.branchId, 'Unknown branch'),
  date: toText(payload.date ?? payload.bookingDate),
  time: toText(payload.time ?? payload.bookingTime),
  totalPrice: toNumber(payload.totalPrice),
  status: normalizeStatus(payload.status),
});

export function parseAdminBookingPage(payload: unknown): AdminBookingPage {
  if (Array.isArray(payload)) {
    const content = payload.filter(isRecord).map(parseAdminBooking);
    return { content, page: 0, size: content.length, totalItems: content.length, last: true };
  }

  if (!isRecord(payload)) {
    return { content: [], page: 0, size: 0, totalItems: 0, last: true };
  }

  const content = Array.isArray(payload.content)
    ? payload.content.filter(isRecord).map(parseAdminBooking)
    : [];

  return {
    content,
    page: toNumber(payload.number ?? payload.page),
    size: toNumber(payload.size, content.length),
    totalItems: toNumber(payload.totalElements ?? payload.totalItems, content.length),
    last: toBoolean(payload.last, true),
  };
}

export function parseAdminRevenue(
  payload: unknown,
  fallbackPeriod: AdminRevenueSnapshot['period'] = 'month',
): AdminRevenueSnapshot {
  if (!isRecord(payload)) {
    return { period: fallbackPeriod, totalRevenue: 0, completedBookings: 0, series: {} };
  }

  const rawSeries = isRecord(payload.series) ? payload.series : {};
  const series = Object.fromEntries(
    Object.entries(rawSeries).map(([key, value]) => [key, toNumber(value)]),
  );
  const rawPeriod = toText(payload.period, fallbackPeriod);
  const period = rawPeriod === 'day' || rawPeriod === 'year' ? rawPeriod : 'month';

  return {
    period,
    totalRevenue: toNumber(payload.totalRevenue),
    completedBookings: toNumber(payload.completedBookings),
    series,
  };
}

export function parseAdminAudit(payload: unknown): AdminAuditRecord[] {
  if (!Array.isArray(payload)) return [];

  return payload.filter(isRecord).map(entry => ({
    id: toText(entry.id ?? entry.pointHistoryId),
    customerId: toText(entry.customerId),
    points: toNumber(entry.points),
    type: toText(entry.type ?? entry.activityType).trim().toLowerCase(),
    description: toText(entry.description, 'Points activity'),
    createdAt: toText(entry.createdAt),
  }));
}

export function parseAdminCampaigns(payload: unknown): AdminCampaignRecord[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map(parseAdminCampaign)
    .filter((campaign): campaign is AdminCampaignRecord => campaign !== null);
}

export function parseAdminCampaign(payload: unknown): AdminCampaignRecord | null {
  if (!isRecord(payload)) return null;
  return {
    id: toText(payload.promotionId ?? payload.id),
    title: toText(payload.promotionName ?? payload.title, 'Untitled campaign'),
    description: toText(payload.description),
    multiplier: toNumber(payload.discountPercent ?? payload.multiplier, 1),
    targetTier: toText(payload.targetTier, 'ALL').toUpperCase(),
    startDate: toText(payload.startDate),
    endDate: toText(payload.endDate ?? payload.validUntil),
    status: toText(payload.status, 'ACTIVE').toUpperCase(),
  };
}

export function getAdminErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error)) return fallback;
  const response = isRecord(error.response) ? error.response : null;
  const data = response && isRecord(response.data) ? response.data : null;
  const apiMessage = data ? toText(data.message ?? data.error) : '';
  const directMessage = toText(error.message);
  return apiMessage || directMessage || fallback;
}
