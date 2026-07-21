import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

  if (!branch) {
    return <ErrorState message={t('dateTime.branchRequired')} />;
  }
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
