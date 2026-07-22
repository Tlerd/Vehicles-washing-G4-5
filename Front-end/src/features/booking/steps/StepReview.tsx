import { useTranslation } from 'react-i18next';
import { formatVND, SIZE_LABEL } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import { useBranches } from '@/lib/api/bookings';
import { useVehicles } from '@/lib/api/vehicles';
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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border p-4">
        <p className="mb-2 font-semibold text-text-primary">{t('review.servicesTitle')}</p>
        {cart.lines.map((line) => (
          <div key={line.code} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-text-primary">{line.name}</span>
            <span className="font-semibold text-text-primary">{formatVND(line.basePrice)}</span>
          </div>
        ))}
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex justify-between text-base font-bold text-text-primary">
            <span>{t('review.total')}</span>
            <span>{formatVND(cart.total)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.appointmentTitle')}</p>
        <Row label={t('review.branch')} value={branch?.name ?? FALLBACK} />
        <Row label={t('review.day')} value={dayKey ?? FALLBACK} />
        <Row label={t('review.time')} value={slotTime ?? FALLBACK} />
        <Row label={t('review.vehicleSize')} value={SIZE_LABEL[vehicleSize]} />
        <Row label={t('review.vehicle')} value={vehicleLabel} />
      </section>

      <section className="rounded-2xl border border-border p-4">
        <p className="mb-1 font-semibold text-text-primary">{t('review.contactTitle')}</p>
        <Row label={t('review.name')} value={customer?.name ?? FALLBACK} />
        <Row label={t('review.phone')} value={customer?.phone ?? FALLBACK} />
      </section>
    </div>
  );
}
