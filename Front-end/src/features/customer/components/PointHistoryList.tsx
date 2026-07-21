import { format, parseISO } from 'date-fns';
import { Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PointEntry } from '@/types';

interface PointHistoryListProps {
  entries: PointEntry[];
}

export function PointHistoryList({ entries }: PointHistoryListProps) {
  const { t } = useTranslation('points');

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Coins className="h-8 w-8" />}
        title={t('history.empty.title')}
        description={t('history.empty.description')}
      />
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Card className="!p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{entry.reason}</p>
                <p className="text-xs text-text-muted">
                  {format(parseISO(entry.dayKey), 'dd/MM/yyyy')}
                </p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  entry.points >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                {entry.points >= 0 ? `+${entry.points}` : entry.points}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
