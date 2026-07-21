import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import { formatVND, SIZE_LABEL } from '@/lib/money';
import { useBranches } from '@/lib/mock/api';
import { useBookingStore } from '../store';
import { useCartSummary } from '../selectors';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}

const FALLBACK = '—';

export function StepReview() {
  const { t } = useTranslation('booking');
  const { branchId, dayKey, slotTime, vehicle, contact } = useBookingStore();
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const cart = useCartSummary();

  const time = slotTime ? slotTime.slice(11, 16) : FALLBACK;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border p-4">
        <p className="mb-2 font-semibold text-text-primary">{t('review.servicesTitle')}</p>
        {cart.items.map((item) => (
          <div key={item.refId} className="flex items-center justify-between py-1.5 text-sm">
            <span className="flex items-center gap-2 text-text-primary">
              {item.name}
              {item.kind === 'COMBO' && <Badge tone="primary">{t('review.comboBadge')}</Badge>}
            </span>
            <span className="font-semibold text-text-primary">{formatVND(item.unitPrice)}</span>
          </div>
        ))}
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex justify-between text-base font-bold text-text-primary">
            <span>{t('review.total')}</span>
            <span>{formatVND(cart.total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-text-secondary">
            <span>{t('review.deposit')}</span>
            <span className="font-semibold text-primary-dark">{formatVND(cart.deposit)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.appointmentTitle')}</p>
        <Row label={t('review.branch')} value={branch?.name ?? FALLBACK} />
        <Row label={t('review.day')} value={dayKey ?? FALLBACK} />
        <Row label={t('review.time')} value={time} />
        <Row label={t('review.vehicleSize')} value={SIZE_LABEL[vehicle.size]} />
        <Row label="Hãng xe" value={vehicle.brand || FALLBACK} />
        <Row label={t('review.plate')} value={vehicle.plate || FALLBACK} />
        <Row label={t('review.model')} value={vehicle.model || FALLBACK} />
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.contactTitle')}</p>
        <Row label={t('review.name')} value={contact.name || FALLBACK} />
        <Row label={t('review.phone')} value={contact.phone || FALLBACK} />
        <Row label={t('review.email')} value={contact.email || FALLBACK} />
      </section>
    </div>
  );
}
