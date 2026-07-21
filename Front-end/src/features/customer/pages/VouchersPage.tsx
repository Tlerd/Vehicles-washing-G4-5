import { Gift, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { TIERS } from '@/lib/mock/customer';
import { useCurrentCustomer, useRedeemVoucher, useVouchers } from '@/lib/mock/customerApi';
import type { TierId } from '@/types';
import { VoucherCard } from '../components/VoucherCard';

function tierRank(tierId: TierId): number {
  return TIERS.findIndex((tier) => tier.id === tierId);
}

export function VouchersPage() {
  const { t } = useTranslation('vouchers');
  const vouchersQuery = useVouchers();
  const customerQuery = useCurrentCustomer();
  const redeemMutation = useRedeemVoucher();

  const isLoading = vouchersQuery.isLoading || customerQuery.isLoading;
  const isError = vouchersQuery.isError || customerQuery.isError;

  function handleRetry(): void {
    void vouchersQuery.refetch();
    void customerQuery.refetch();
  }

  const vouchers = vouchersQuery.data;
  const customer = customerQuery.data;
  const customerRank = customer ? tierRank(customer.tierId) : -1;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-secondary">{t('subtitle')}</p>
        {customer && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary-light/60 px-3 py-1.5 text-sm font-semibold text-primary-dark">
            <Wallet className="h-4 w-4" aria-hidden />
            {t('yourPoints', { points: customer.points.toLocaleString('vi-VN') })}
          </div>
        )}
      </header>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy aria-label={t('loading')}>
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}

      {!isLoading && (isError || !vouchers || !customer) && (
        <ErrorState message={t('errors.load')} onRetry={handleRetry} />
      )}

      {!isLoading && !isError && vouchers && customer && vouchers.length === 0 && (
        <EmptyState
          icon={<Gift className="h-8 w-8" />}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      )}

      {!isLoading && !isError && vouchers && customer && vouchers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => {
            const requiredTier = TIERS.find((tier) => tier.id === voucher.minTierId);
            const tierOk = customerRank >= tierRank(voucher.minTierId);
            const pointsOk = customer.points >= voucher.costPoints;
            return (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                tierOk={tierOk}
                pointsOk={pointsOk}
                requiredTierName={requiredTier?.name ?? voucher.minTierId}
                pointsNeeded={Math.max(0, voucher.costPoints - customer.points)}
                onRedeem={async () => {
                  await redeemMutation.mutateAsync(voucher.costPoints);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
