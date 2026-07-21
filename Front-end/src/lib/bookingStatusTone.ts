import type { Tone } from '@/components/ui/Badge';
import type { BookingStatus } from '@/types';

/** Single source of truth for BookingStatus -> Badge tone, shared by
 *  DashboardPage, HistoryPage and BookingDetailPage (previously duplicated
 *  in all three). Each page still owns its own i18n label for the status. */
export const BOOKING_STATUS_TONE: Record<BookingStatus, Tone> = {
  CONFIRMED: 'primary',
  CHECKED_IN: 'warning',
  COMPLETED: 'success',
  NO_SHOW: 'danger',
  CHANGE_REQUESTED: 'neutral',
};
