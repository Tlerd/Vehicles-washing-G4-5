import type { Booking, BookingStatus } from '../../types';

export type BookingStatusFilter = BookingStatus | 'ALL';
export type BookingSortKey = 'time' | 'price';

interface BookingPageInput {
  bookings: Booking[];
  date: string;
  status: BookingStatusFilter;
  sortBy: BookingSortKey;
  page: number;
  size: number;
}

interface ScrollBoundaryInput {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  threshold: number;
}

export interface BookingPage {
  content: Booking[];
  page: number;
  size: number;
  last: boolean;
  totalItems: number;
}

export function getBookingPage({
  bookings,
  date,
  status,
  sortBy,
  page,
  size,
}: BookingPageInput): BookingPage {
  const filtered = bookings
    .filter(booking => booking.date === date)
    .filter(booking => status === 'ALL' || booking.status === status)
    .sort((left, right) => {
      if (sortBy === 'price') return right.totalPrice - left.totalPrice;
      return left.time.localeCompare(right.time);
    });

  const start = page * size;
  const end = start + size;
  const content = filtered.slice(start, end);

  return {
    content,
    page,
    size,
    last: end >= filtered.length,
    totalItems: filtered.length,
  };
}

export function shouldLoadNextPage({
  scrollHeight,
  scrollTop,
  clientHeight,
  threshold,
}: ScrollBoundaryInput): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}
