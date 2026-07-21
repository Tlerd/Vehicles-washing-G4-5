import { useState } from 'react';
import { Info } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { ErrorState, Skeleton } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { useCatalog, useCategories } from '@/lib/mock/api';
import { useBookingStore } from '../store';
import { useCartSummary } from '../selectors';
import { ServiceIconGrid } from '../components/ServiceIconGrid';
import { ServicePickerSheet } from '../components/ServicePickerSheet';

export function StepService() {
  const { t } = useTranslation('booking');
  const categories = useCategories();
  const catalog = useCatalog();
  const serviceIds = useBookingStore((s) => s.serviceIds);
  const comboIds = useBookingStore((s) => s.comboIds);
  const toggleService = useBookingStore((s) => s.toggleService);
  const toggleCombo = useBookingStore((s) => s.toggleCombo);
  const cart = useCartSummary();

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  if (categories.isLoading || catalog.isLoading) {
    return <Skeleton className="h-64" />;
  }
  if (categories.isError || catalog.isError || !categories.data || !catalog.data) {
    return <ErrorState message={t('service.loadError')} onRetry={() => categories.refetch()} />;
  }

  const countByCategory: Record<string, number> = {};
  for (const id of serviceIds) {
    const svc = catalog.data.services.find((s) => s.id === id);
    if (svc) countByCategory[svc.categoryId] = (countByCategory[svc.categoryId] ?? 0) + 1;
  }
  for (const id of comboIds) {
    const combo = catalog.data.combos.find((c) => c.id === id);
    if (combo) countByCategory[combo.categoryId] = (countByCategory[combo.categoryId] ?? 0) + 1;
  }

  const openCategory = categories.data.find((c) => c.id === openCategoryId) ?? null;

  return (
    <div className="space-y-5">
      <ServiceIconGrid
        categories={categories.data}
        countByCategory={countByCategory}
        onOpen={setOpenCategoryId}
      />

      {cart.items.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-primary-light/30 px-4 py-3 text-sm text-primary-dark">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            <Trans
              t={t}
              i18nKey="service.selectedSummary"
              values={{ count: cart.items.length, amount: formatVND(cart.fromTotal) }}
              components={{ bold: <strong /> }}
            />
          </span>
        </div>
      )}

      <ServicePickerSheet
        category={openCategory}
        services={catalog.data.services}
        combos={catalog.data.combos}
        selectedServiceIds={serviceIds}
        selectedComboIds={comboIds}
        onToggleService={toggleService}
        onToggleCombo={toggleCombo}
        onClose={() => setOpenCategoryId(null)}
      />
    </div>
  );
}
