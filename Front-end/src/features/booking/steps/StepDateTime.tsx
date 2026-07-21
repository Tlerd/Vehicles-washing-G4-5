import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
<<<<<<< Updated upstream
import { Badge, ErrorState, Skeleton } from '@/components/ui';
import { upcomingDays } from '@/lib/datetime';
import { useBranches, useWeekSlots } from '@/lib/mock/api';
import { useBookingStore } from '../store';
import { useCartSummary } from '../selectors';
import { WeekGrid } from '../components/WeekGrid';

const WEEK_LENGTH = 7;

export function StepDateTime() {
  const { t } = useTranslation('booking');
  const branchId = useBookingStore((s) => s.branchId);
  const slotTime = useBookingStore((s) => s.slotTime);
  const setSlot = useBookingStore((s) => s.setSlot);
  const cart = useCartSummary();

  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const days = upcomingDays(WEEK_LENGTH);
  const { data: slotsByDay, isLoading, isError, refetch } = useWeekSlots(branch, days);
=======
import { ErrorState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatBookingDayKey, formatDayKey, upcomingDays } from '@/lib/datetime';
import { useAvailability, useBranches } from '@/lib/api/bookings';
import { useBookingStore } from '../store';

const DAYS_AHEAD = 7;

export function StepDateTime() {
  const { t, i18n } = useTranslation('booking');
  const branchId = useBookingStore((s) => s.branchId);
  const serviceCodes = useBookingStore((s) => s.serviceCodes);
  const dayKey = useBookingStore((s) => s.dayKey);
  const slotTime = useBookingStore((s) => s.slotTime);
  const setSlot = useBookingStore((s) => s.setSlot);
  const viewDay = useBookingStore((s) => s.viewDay);

  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const days = upcomingDays(DAYS_AHEAD);
  // Before the user has picked a day, default the displayed grid to today
  // without writing to the store yet.
  const selectedDayKey = dayKey ?? formatDayKey(days[0]);

  const { data: slots, isLoading, isError, refetch } = useAvailability(
    branchId,
    selectedDayKey,
    serviceCodes,
  );
>>>>>>> Stashed changes

  if (!branch) {
    return <ErrorState message={t('dateTime.branchRequired')} />;
  }
<<<<<<< Updated upstream
  if (isLoading || !slotsByDay) {
    return <Skeleton className="h-72" />;
  }
  if (isError) {
    return <ErrorState message={t('dateTime.loadError')} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <CalendarClock className="h-4 w-4" />
        <span>{t('dateTime.slotInfo')}</span>
        {cart.requiredSlots > 0 && (
          <Badge tone="primary">{t('dateTime.requiredSlots', { count: cart.requiredSlots })}</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
        <LegendDot className="bg-slot-free/30" label={t('dateTime.legend.free')} />
        <LegendDot className="bg-slot-held/30" label={t('dateTime.legend.held')} />
        <LegendDot className="bg-surface-soft" label={t('dateTime.legend.full')} />
      </div>

      <WeekGrid
        days={days}
        openTime={branch.openTime}
        closeTime={branch.closeTime}
        slotDurationMin={branch.slotDurationMin}
        slotsByDay={slotsByDay}
        selected={slotTime}
        onPick={setSlot}
      />
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </span>
  );
}
=======

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <CalendarClock className="h-4 w-4" />
        <span>{t('dateTime.slotInfo')}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const key = formatDayKey(day);
          const active = key === selectedDayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => viewDay(key)}
              className={cn(
                'shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                active
                  ? 'border-primary bg-primary-light/20 text-primary-dark'
                  : 'border-border text-text-secondary hover:border-primary/50',
              )}
            >
              {formatBookingDayKey(key, i18n.language)}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      {isError && <ErrorState message={t('dateTime.loadError')} onRetry={() => refetch()} />}

      {!isLoading && !isError && slots && slots.length === 0 && (
        <p className="text-sm text-text-secondary">{t('dateTime.noSlots')}</p>
      )}

      {!isLoading && !isError && slots && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const selected = dayKey === selectedDayKey && slotTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSlot(selectedDayKey, slot.time)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                  !slot.available &&
                    'cursor-not-allowed border-border bg-surface-soft text-text-muted opacity-50',
                  slot.available &&
                    !selected &&
                    'border-border text-text-primary hover:border-primary/50',
                  selected && 'border-primary bg-primary-light/20 text-primary-dark',
                )}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
>>>>>>> Stashed changes
