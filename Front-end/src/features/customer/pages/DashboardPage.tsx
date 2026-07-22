import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Car,
  CalendarClock,
  CalendarPlus,
  Clock,
  MapPin,
  Star,
  Ticket,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { nextTier, tierForPoints } from '@/lib/mock/customer';
import { useBookingHistory, useCurrentCustomer } from '@/lib/mock/customerApi';
import { BOOKING_STATUS_TONE } from '@/lib/bookingStatusTone';
import { formatBookingDayKey } from '@/lib/datetime';
import type { BookingRecord, BookingStatus } from '@/types';

const UPCOMING_STATUSES: BookingStatus[] = ['CONFIRMED', 'CHECKED_IN'];

const QUICK_LINKS = [
  { to: '/app/garage', icon: Car, key: 'garage' as const },
  { to: '/app/points', icon: Star, key: 'points' as const },
  { to: '/app/vouchers', icon: Ticket, key: 'vouchers' as const },
  { to: '/app/history', icon: CalendarClock, key: 'history' as const },
];

/** Earliest CONFIRMED/CHECKED_IN booking by dayKey+time, not array order. */
function earliestUpcoming(bookings: BookingRecord[]): BookingRecord | undefined {
  return [...bookings]
    .filter((b) => UPCOMING_STATUSES.includes(b.status))
    .sort((a, b) => (a.dayKey === b.dayKey ? (a.time < b.time ? -1 : 1) : a.dayKey < b.dayKey ? -1 : 1))[0];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-28" />
      <Skeleton className="h-36" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const profileQuery = useCurrentCustomer();
  const bookingsQuery = useBookingHistory();

  if (profileQuery.isLoading || bookingsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState message={t('errors.profile')} onRetry={() => profileQuery.refetch()} />;
  }

  if (bookingsQuery.isError || !bookingsQuery.data) {
    return <ErrorState message={t('errors.bookings')} onRetry={() => bookingsQuery.refetch()} />;
  }

  const profile = profileQuery.data;
  const bookings = bookingsQuery.data;
  const tier = tierForPoints(profile.points);
  const upgrade = nextTier(profile.points);
  const upcoming = earliestUpcoming(bookings);

  const progressPct = upgrade
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((profile.points - tier.minPoints) / (upgrade.minPoints - tier.minPoints)) * 100,
          ),
        ),
      )
    : 100;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {t('greeting', { name: profile.name })}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t('subtitle')}</p>
      </header>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
            <Award className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-secondary">{t('tier.title')}</p>
              <Badge tone="primary">{tier.name}</Badge>
            </div>
            <p className="mt-0.5 text-2xl font-bold text-text-primary">
              {profile.points}{' '}
              <span className="text-sm font-medium text-text-muted">{t('tier.pointsLabel')}</span>
            </p>
          </div>
        </div>
        <div className="sm:w-64">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            {upgrade
              ? t('tier.toNextTier', {
                  points: upgrade.minPoints - profile.points,
                  tier: upgrade.name,
                })
              : t('tier.maxTierReached')}
          </p>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {t('upcoming.title')}
          </h2>
          <Button size="sm" onClick={() => navigate('/app/booking')}>
            <CalendarPlus className="h-4 w-4" />
            {t('cta.newBooking')}
          </Button>
        </div>

        {upcoming ? (
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-text-primary">{upcoming.branchName}</p>
                  <p className="text-sm text-text-secondary">
                    {upcoming.serviceNames.join(', ')}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {t('upcoming.dateTime', {
                      date: formatBookingDayKey(upcoming.dayKey, i18n.language),
                      time: upcoming.time,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <Badge tone={BOOKING_STATUS_TONE[upcoming.status]}>{t(`status.${upcoming.status}`)}</Badge>
                <Link
                  to={`/app/bookings/${upcoming.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('upcoming.viewDetail')}
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<CalendarClock className="h-8 w-8" />}
            title={t('upcoming.empty.title')}
            description={t('upcoming.empty.description')}
            action={
              <Button onClick={() => navigate('/app/booking')}>
                <CalendarPlus className="h-4 w-4" />
                {t('cta.newBooking')}
              </Button>
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t('quickLinks.title')}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {QUICK_LINKS.map(({ to, icon: Icon, key }) => (
            <Link key={to} to={to} className="block">
              <Card interactive className="h-full">
                <span className="inline-flex rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold text-text-primary">
                  {t(`quickLinks.${key}.title`)}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {t(`quickLinks.${key}.description`)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
