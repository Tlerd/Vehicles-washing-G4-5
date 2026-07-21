import { useTranslation } from 'react-i18next';
import { ErrorState, Skeleton } from '@/components/ui';
import { useCurrentCustomer, usePointHistory } from '@/lib/mock/customerApi';
import { PointHistoryList } from '../components/PointHistoryList';
import { TierProgressCard } from '../components/TierProgressCard';

export function PointsPage() {
  const { t } = useTranslation('points');
  const {
    data: customer,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    refetch: refetchCustomer,
  } = useCurrentCustomer();
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = usePointHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>

      {isCustomerLoading && <Skeleton className="h-32" />}
      {!isCustomerLoading && (isCustomerError || !customer) && (
        <ErrorState message={t('tier.loadError')} onRetry={() => refetchCustomer()} />
      )}
      {!isCustomerLoading && customer && <TierProgressCard customer={customer} />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary">{t('history.title')}</h2>

        {isHistoryLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}
        {!isHistoryLoading && (isHistoryError || !history) && (
          <ErrorState message={t('history.loadError')} onRetry={() => refetchHistory()} />
        )}
        {!isHistoryLoading && history && <PointHistoryList entries={history} />}
      </section>
    </div>
  );
}
