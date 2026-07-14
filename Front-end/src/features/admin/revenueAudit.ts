import type { Booking, BookingStatus, PointsTransaction } from '../../types';

export type RevenuePeriod = 'day' | 'month' | 'year';
export type RevenueBranchFilter = 'ALL' | string;
export type PointAuditTypeFilter = PointsTransaction['type'] | 'ALL';

interface RevenueSummaryInput {
  bookings: Booking[];
  period: RevenuePeriod;
  anchorDate: string;
  branch: RevenueBranchFilter;
}

export interface RevenueSummary {
  revenue: number;
  completedWashes: number;
  averageTicket: number;
}

const completedStatus: BookingStatus = 'COMPLETED';

const isInPeriod = (bookingDate: string, anchorDate: string, period: RevenuePeriod) => {
  if (period === 'day') return bookingDate === anchorDate;
  if (period === 'month') return bookingDate.slice(0, 7) === anchorDate.slice(0, 7);
  return bookingDate.slice(0, 4) === anchorDate.slice(0, 4);
};

export function getRevenueSummary({
  bookings,
  period,
  anchorDate,
  branch,
}: RevenueSummaryInput): RevenueSummary {
  const completedBookings = bookings.filter(booking => {
    const matchesStatus = booking.status === completedStatus;
    const matchesPeriod = isInPeriod(booking.date, anchorDate, period);
    const matchesBranch = branch === 'ALL' || booking.branchId === branch;
    return matchesStatus && matchesPeriod && matchesBranch;
  });

  const revenue = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const completedWashes = completedBookings.length;

  return {
    revenue,
    completedWashes,
    averageTicket: completedWashes > 0 ? Math.round(revenue / completedWashes) : 0,
  };
}

export function getPointAuditRows(
  transactions: PointsTransaction[],
  type: PointAuditTypeFilter,
): PointsTransaction[] {
  return transactions
    .filter(transaction => type === 'ALL' || transaction.type === type)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
