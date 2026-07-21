import { useTranslation } from 'react-i18next';
<<<<<<< Updated upstream
import { Badge } from '@/components/ui';
import { formatVND, SIZE_LABEL } from '@/lib/money';
import { useBranches } from '@/lib/mock/api';
=======
import { formatVND, SIZE_LABEL } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import { useBranches } from '@/lib/api/bookings';
import { useVehicles } from '@/lib/api/vehicles';
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  const { branchId, dayKey, slotTime, vehicle, contact } = useBookingStore();
  const { data: branches } = useBranches();
  const branch = branches?.find((b) => b.id === branchId);
  const cart = useCartSummary();

  const time = slotTime ? slotTime.slice(11, 16) : FALLBACK;
=======
  const { customer } = useAuth();
  const branchId = useBookingStore((s) => s.branchId);
  const dayKey = useBookingStore((s) => s.dayKey);
  const slotTime = useBookingStore((s) => s.slotTime);
  const savedVehicleId = useBookingStore((s) => s.savedVehicleId);
  const manualVehicle = useBookingStore((s) => s.manualVehicle);
  const { data: branches } = useBranches();
  const { data: savedVehicles } = useVehicles(customer?.id);
  const cart = useCartSummary();

  const branch = branches?.find((b) => b.id === branchId);
  const savedVehicle = savedVehicleId ? savedVehicles?.find((v) => v.id === savedVehicleId) : undefined;
  const vehicleLabel = savedVehicle
    ? `${savedVehicle.brand} · ${savedVehicle.licensePlate}`
    : `${manualVehicle.brand || FALLBACK} · ${manualVehicle.plate || FALLBACK}`;
  const vehicleSize = savedVehicle?.size ?? manualVehicle.size;
>>>>>>> Stashed changes

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border p-4">
        <p className="mb-2 font-semibold text-text-primary">{t('review.servicesTitle')}</p>
<<<<<<< Updated upstream
        {cart.items.map((item) => (
          <div key={item.refId} className="flex items-center justify-between py-1.5 text-sm">
            <span className="flex items-center gap-2 text-text-primary">
              {item.name}
              {item.kind === 'COMBO' && <Badge tone="primary">{t('review.comboBadge')}</Badge>}
            </span>
            <span className="font-semibold text-text-primary">{formatVND(item.unitPrice)}</span>
=======
        {cart.lines.map((line) => (
          <div key={line.code} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-text-primary">{line.name}</span>
            <span className="font-semibold text-text-primary">{formatVND(line.basePrice)}</span>
>>>>>>> Stashed changes
          </div>
        ))}
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex justify-between text-base font-bold text-text-primary">
            <span>{t('review.total')}</span>
            <span>{formatVND(cart.total)}</span>
          </div>
<<<<<<< Updated upstream
          <div className="mt-1 flex justify-between text-sm text-text-secondary">
            <span>{t('review.deposit')}</span>
            <span className="font-semibold text-primary-dark">{formatVND(cart.deposit)}</span>
          </div>
=======
>>>>>>> Stashed changes
        </div>
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.appointmentTitle')}</p>
        <Row label={t('review.branch')} value={branch?.name ?? FALLBACK} />
        <Row label={t('review.day')} value={dayKey ?? FALLBACK} />
<<<<<<< Updated upstream
        <Row label={t('review.time')} value={time} />
        <Row label={t('review.vehicleSize')} value={SIZE_LABEL[vehicle.size]} />
        <Row label="Hãng xe" value={vehicle.brand || FALLBACK} />
        <Row label={t('review.plate')} value={vehicle.plate || FALLBACK} />
        <Row label={t('review.model')} value={vehicle.model || FALLBACK} />
=======
        <Row label={t('review.time')} value={slotTime ?? FALLBACK} />
        <Row label={t('review.vehicleSize')} value={SIZE_LABEL[vehicleSize]} />
        <Row label={t('review.vehicle')} value={vehicleLabel} />
>>>>>>> Stashed changes
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.contactTitle')}</p>
<<<<<<< Updated upstream
        <Row label={t('review.name')} value={contact.name || FALLBACK} />
        <Row label={t('review.phone')} value={contact.phone || FALLBACK} />
        <Row label={t('review.email')} value={contact.email || FALLBACK} />
=======
        <Row label={t('review.name')} value={customer?.name ?? FALLBACK} />
        <Row label={t('review.phone')} value={customer?.phone ?? FALLBACK} />
>>>>>>> Stashed changes
      </section>
    </div>
  );
}
