import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, ErrorState, Skeleton } from '@/components/ui';
<<<<<<< Updated upstream
import { useBranches } from '@/lib/mock/api';
=======
import { useBranches } from '@/lib/api/bookings';
>>>>>>> Stashed changes
import { useBookingStore } from '../store';

export function StepBranch() {
  const { t } = useTranslation('booking');
  const { data: branches, isLoading, isError, refetch } = useBranches();
  const branchId = useBookingStore((s) => s.branchId);
  const setBranch = useBookingStore((s) => s.setBranch);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (isError || !branches) {
    return <ErrorState message={t('branch.loadError')} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">{t('branch.description')}</p>
      {branches.map((branch) => (
        <Card
          key={branch.id}
          interactive
          selected={branchId === branch.id}
          onClick={() => setBranch(branch.id)}
        >
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">{branch.name}</p>
              <p className="text-sm text-text-secondary">{branch.address}</p>
              <p className="mt-1 text-xs text-text-muted">
                {t('branch.openHours', { open: branch.openTime, close: branch.closeTime })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
