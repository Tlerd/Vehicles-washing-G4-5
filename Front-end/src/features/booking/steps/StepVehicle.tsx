import { useTranslation } from 'react-i18next';
import { Field, Input, Select } from '@/components/ui';
import { SIZE_LABEL } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { VehicleSize } from '@/types';
import { VEHICLE_BRANDS } from '@/features/customer/vehicleBrands';
import { useBookingStore } from '../store';

const SIZES: VehicleSize[] = ['S', 'M', 'L'];

export function StepVehicle() {
  const { t } = useTranslation('booking');
  const vehicle = useBookingStore((s) => s.vehicle);
  const contact = useBookingStore((s) => s.contact);
  const setSize = useBookingStore((s) => s.setSize);
  const setVehicle = useBookingStore((s) => s.setVehicle);
  const setContact = useBookingStore((s) => s.setContact);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">{t('vehicle.sizeLabel')}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSize(size)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left text-sm transition-all',
                vehicle.size === size
                  ? 'border-primary bg-primary-light/20 font-semibold text-primary-dark'
                  : 'border-border text-text-secondary hover:border-primary/50',
              )}
            >
              {SIZE_LABEL[size]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-text-muted">{t('vehicle.sizeNote')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Hãng xe">
          <Select value={vehicle.brand} onChange={(e) => setVehicle({ brand: e.target.value })}>
            <option value="">Chọn hãng xe</option>
            {VEHICLE_BRANDS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </Select>
        </Field>
        <Field label={t('vehicle.plateLabel')}>
          <Input
            placeholder={t('vehicle.platePlaceholder')}
            value={vehicle.plate}
            onChange={(e) => setVehicle({ plate: e.target.value })}
          />
        </Field>
        <Field label={t('vehicle.modelLabel')}>
          <Input
            placeholder={t('vehicle.modelPlaceholder')}
            value={vehicle.model}
            onChange={(e) => setVehicle({ model: e.target.value })}
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-border bg-surface-soft/40 p-4">
        <p className="mb-3 text-sm font-medium text-text-primary">{t('vehicle.contactTitle')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('vehicle.nameLabel')}>
            <Input
              placeholder={t('vehicle.namePlaceholder')}
              value={contact.name}
              onChange={(e) => setContact({ name: e.target.value })}
            />
          </Field>
          <Field label={t('vehicle.phoneLabel')}>
            <Input
              placeholder={t('vehicle.phonePlaceholder')}
              inputMode="tel"
              value={contact.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
            />
          </Field>
          <Field label={t('vehicle.emailLabel')}>
            <Input
              type="email"
              placeholder={t('vehicle.emailPlaceholder')}
              value={contact.email ?? ''}
              onChange={(e) => setContact({ email: e.target.value })}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-text-muted">{t('vehicle.contactNote')}</p>
      </div>
    </div>
  );
}
