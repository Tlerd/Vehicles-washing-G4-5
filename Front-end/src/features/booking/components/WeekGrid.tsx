import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import type { Slot, SlotStatus } from '@/types';
import { formatDayKey, formatDayShort } from '@/lib/datetime';
import { daySlotTimes } from '@/lib/slot';
import { cn } from '@/lib/utils';

interface WeekGridProps {
  days: Date[];
  openTime: string;
  closeTime: string;
  slotDurationMin: number;
  slotsByDay: Record<string, Slot[]>;
  selected?: string; // selected slot ISO time
  onPick: (dayKey: string, iso: string) => void;
}

const CELL_TONE: Record<SlotStatus, string> = {
  free: 'bg-slot-free/10 text-slot-free hover:bg-slot-free/20 cursor-pointer',
  held: 'bg-slot-held/10 text-slot-held cursor-not-allowed',
  full: 'bg-surface-soft text-text-muted/50 cursor-not-allowed',
  picked: 'bg-primary text-white ring-2 ring-primary cursor-pointer',
};

/**
 * D-15: sticky-header weekly grid, 15-minute rows, one column per day.
 *
 * Implemented with CSS Grid (not a table) because position:sticky on native
 * table/thead/th/td cells inside a clipped, scrollable ancestor is unreliable
 * across browsers and can paint outside the rounded border. A single CSS
 * Grid container with every cell as a direct child keeps sticky positioning
 * correctly scoped to the scrolling ancestor.
 */
export function WeekGrid({
  days,
  openTime,
  closeTime,
  slotDurationMin,
  slotsByDay,
  selected,
  onPick,
}: WeekGridProps) {
  const { t } = useTranslation('booking');
  const times = daySlotTimes(openTime, closeTime, slotDurationMin);

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="max-h-[60vh] overflow-auto">
        <div
          className="grid w-full text-center text-xs"
          style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(64px, 1fr))` }}
        >
          <div className="sticky left-0 top-0 z-20 bg-surface p-2 font-medium text-text-muted">
            {t('weekGrid.hourColumn')}
          </div>
          {days.map((d) => (
            <div
              key={formatDayKey(d)}
              className="sticky top-0 z-10 bg-surface p-2 font-semibold text-text-primary"
            >
              {formatDayShort(d)}
            </div>
          ))}
          {times.map((hm) => (
            <Fragment key={hm}>
              <div className="sticky left-0 z-10 bg-surface p-1.5 font-medium text-text-muted">
                {hm}
              </div>
              {days.map((d) => {
                const key = formatDayKey(d);
                const slot = slotsByDay[key]?.find((s) => s.time.endsWith(`T${hm}:00`));
                const status: SlotStatus = !slot
                  ? 'full'
                  : slot.time === selected
                    ? 'picked'
                    : slot.status;
                const disabled = status === 'full' || status === 'held';
                return (
                  <div key={key} className="p-0.5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => slot && onPick(key, slot.time)}
                      className={cn(
                        'flex h-8 w-full items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                        CELL_TONE[status],
                      )}
                      title={
                        slot
                          ? t('weekGrid.remainingSlots', { count: slot.remaining })
                          : t('weekGrid.unavailable')
                      }
                    >
                      {status === 'free' && slot ? slot.remaining : ''}
                    </button>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
