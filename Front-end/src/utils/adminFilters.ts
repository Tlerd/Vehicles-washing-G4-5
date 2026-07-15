import { Customer, Vehicle, Booking, BookingStatus } from '../types';

type CustomerTier = 'Member' | 'Silver' | 'Gold' | 'Platinum';
type CustomerTierFilter = 'ALL' | CustomerTier;
type CustomerSortKey = 'createdAt' | 'totalSpend' | 'points';
type BookingStatusFilter = 'ALL' | BookingStatus;
type BookingSortKey = 'time' | 'price';

interface GetFilteredCustomersParams {
  customers: Customer[];
  vehicles: Vehicle[];
  search: string;
  tier: CustomerTierFilter;
  sortBy: CustomerSortKey;
}

export function getFilteredCustomers({ customers, vehicles, search, tier, sortBy }: GetFilteredCustomersParams): Customer[] {
  const lower = search.toLowerCase();

  let result = customers.filter(customer => {
    if (tier !== 'ALL' && customer.tier !== tier) return false;
    if (!lower) return true;
    if (customer.name.toLowerCase().includes(lower)) return true;
    if (customer.phone.includes(lower)) return true;
    if (customer.email?.toLowerCase().includes(lower)) return true;
    const plates = vehicles
      .filter(v => v.customerId === customer.id)
      .map(v => v.licensePlate.toLowerCase());
    return plates.some(p => p.includes(lower));
  });

  result = [...result].sort((a, b) => {
    if (sortBy === 'totalSpend') return b.totalSpend - a.totalSpend;
    if (sortBy === 'points') return b.accumulatedPoints - a.accumulatedPoints;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return result;
}

interface BookingPageParams {
  bookings: Booking[];
  date: string;
  status: BookingStatusFilter;
  sortBy: BookingSortKey;
  page: number;
  size: number;
}

/** Shape expected by AdminCustomerRegistryPage */
export interface BookingPage {
  /** Items for pages 0..page combined (cumulative) */
  content: Booking[];
  /** Total items matching the filter */
  totalItems: number;
  /** True when there are no more pages */
  last: boolean;
}

export function getBookingPage({ bookings, date, status, sortBy, page, size }: BookingPageParams): BookingPage {
  let filtered = bookings.filter(b => {
    if (status !== 'ALL' && b.status !== status) return false;
    if (date && b.date !== date) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price') return b.totalPrice - a.totalPrice;
    return a.time.localeCompare(b.time);
  });

  const totalItems = filtered.length;
  const end = (page + 1) * size;
  const content = filtered.slice(0, end);

  return { content, totalItems, last: end >= totalItems };
}

interface ScrollParams {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  threshold: number;
}

export function shouldLoadNextPage({ scrollHeight, scrollTop, clientHeight, threshold }: ScrollParams): boolean {
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

export const tiers: Array<'ALL' | CustomerTier> = ['ALL', 'Member', 'Silver', 'Gold', 'Platinum'];
