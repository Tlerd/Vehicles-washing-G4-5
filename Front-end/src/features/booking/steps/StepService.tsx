import { Check, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { useServices } from '@/lib/api/bookings';
import { useBookingStore } from '../store';

export function StepService() {
  const { t } = useTranslation('booking');
  const { data: services, isLoading, isError, refetch } = useServices();
  const serviceCodes = useBookingStore((s) => s.serviceCodes);
  const toggleService = useBookingStore((s) => s.toggleService);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  if (isError || !services) {
    return <ErrorState message={t('service.loadError')} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">{t('service.description')}</p>
      {services.map((service) => {
        const selected = serviceCodes.includes(service.code);
        return (
          <Card
            key={service.code}
            interactive
            selected={selected}
            onClick={() => toggleService(service.code)}
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
                  (selected ? 'bg-primary text-white' : 'bg-surface-soft text-text-muted')
                }
              >
                {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-text-secondary">{service.description}</p>
                )}
              </div>
              <span className="shrink-0 font-bold text-primary-dark">
                {formatVND(service.basePrice)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
