import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from '@/components/ui';
import { nextTier, tierForPoints } from '@/lib/mock/customer';
import type { CustomerProfile } from '@/types';

interface TierProgressCardProps {
  customer: CustomerProfile;
}

export function TierProgressCard({ customer }: TierProgressCardProps) {
  const { t } = useTranslation('points');
  const tier = tierForPoints(customer.points);
  const next = nextTier(customer.points);
  const progress = next
    ? Math.min(
        100,
        Math.max(0, ((customer.points - tier.minPoints) / (next.minPoints - tier.minPoints)) * 100),
      )
    : 100;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-text-secondary">{t('tier.currentLabel')}</p>
            <p className="text-lg font-bold text-text-primary">{tier.name}</p>
          </div>
        </div>
        <Badge tone="primary">{t('tier.pointsBadge', { points: customer.points })}</Badge>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {next
            ? t('tier.progressToNext', {
                next: next.name,
                remaining: Math.max(0, next.minPoints - customer.points),
              })
            : t('tier.maxTier')}
        </p>
      </div>
    </Card>
  );
}
