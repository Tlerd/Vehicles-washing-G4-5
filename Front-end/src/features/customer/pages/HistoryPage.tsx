import { Calendar, ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { formatBookingDayKey } from '@/lib/datetime';
import { BOOKING_STATUS_TONE } from '@/lib/bookingStatusTone';
import { useBookingHistory } from '@/lib/mock/customerApi';
import type { BookingRecord } from '@/types';

/** Newest first by dayKey, then by time within the same day. */
function sortByNewest(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort((a, b) => {
    if (a.dayKey !== b.dayKey) return a.dayKey > b.dayKey ? -1 : 1;
    return a.time > b.time ? -1 : 1;
  });
}

export function HistoryPage() {
  const { t, i18n } = useTranslation('history');
  const { data: bookings, isLoading, isError, refetch } = useBookingHistory();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('subtitle')}</p>
      </header>

      {isLoading && (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message={t('loadError')} onRetry={() => refetch()} />}

      {!isLoading && !isError && bookings && bookings.length === 0 && (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      )}

      {!isLoading && !isError && bookings && bookings.length > 0 && (
        <ul className="space-y-3">
          {sortByNewest(bookings).map((booking) => (
            <li key={booking.id}>
              <Link to={`/app/bookings/${booking.id}`} className="block">
                <Card interactive className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-text-primary">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{booking.branchName}</span>
                      </div>
                      <Badge tone={BOOKING_STATUS_TONE[booking.status]} className="shrink-0">
                        {t(`status.${booking.status}`)}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-text-secondary">
                      {booking.serviceNames.join(', ')}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatBookingDayKey(booking.dayKey, i18n.language)} · {booking.time}
                      </span>
                      <span className="font-semibold text-text-primary">
                        {formatVND(booking.total)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
