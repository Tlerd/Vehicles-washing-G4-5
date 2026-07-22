import { useTranslation } from 'react-i18next';
import { Car, Check } from 'lucide-react';
import { Field, Input, Select, Skeleton } from '@/components/ui';
import { SIZE_LABEL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useVehicles, type VehicleSizeCode } from '@/lib/api/vehicles';
import { useAuth } from '@/features/auth/AuthContext';
import { VEHICLE_BRANDS } from '@/features/customer/vehicleBrands';
import { useBookingStore } from '../store';

const SIZES: VehicleSizeCode[] = ['HATCHBACK', 'SEDAN', 'SUV', 'PICKUP'];

export function StepVehicle() {
  const { t } = useTranslation('booking');
  const { customer } = useAuth();
  const { data: savedVehicles, isLoading } = useVehicles(customer?.id);
  const savedVehicleId = useBookingStore((s) => s.savedVehicleId);
  const manualVehicle = useBookingStore((s) => s.manualVehicle);
  const selectSavedVehicle = useBookingStore((s) => s.selectSavedVehicle);
  const setManualVehicle = useBookingStore((s) => s.setManualVehicle);

  const usingManualEntry = !savedVehicleId;

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-24" />}

      {!isLoading && savedVehicles && savedVehicles.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">{t('vehicle.savedTitle')}</p>
          <div className="space-y-2">
            {savedVehicles.map((v) => {
              const selected = savedVehicleId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectSavedVehicle(v.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary-light/20'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      selected ? 'bg-primary text-white' : 'bg-surface-soft text-text-muted',
                    )}
                  >
                    {selected ? <Check className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      {v.brand} · {v.licensePlate}
                    </span>
                    <span className="block text-xs text-text-secondary">{SIZE_LABEL[v.size]}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => selectSavedVehicle(undefined)}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-left text-sm transition-all',
                usingManualEntry
                  ? 'border-primary bg-primary-light/20 font-semibold text-primary-dark'
                  : 'border-border text-text-secondary hover:border-primary/50',
              )}
            >
              {t('vehicle.useOtherVehicle')}
            </button>
          </div>
        </div>
      )}

      {usingManualEntry && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">{t('vehicle.sizeLabel')}</p>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setManualVehicle({ size })}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-left text-sm transition-all',
                    manualVehicle.size === size
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
            <Field label={t('vehicle.brandLabel')}>
              <Select
                value={manualVehicle.brand}
                onChange={(e) => setManualVehicle({ brand: e.target.value })}
              >
                <option value="">{t('vehicle.brandPlaceholder')}</option>
                {VEHICLE_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('vehicle.plateLabel')}>
              <Input
                placeholder={t('vehicle.platePlaceholder')}
                value={manualVehicle.plate}
                onChange={(e) => setManualVehicle({ plate: e.target.value })}
              />
            </Field>
          </div>
        </>
      )}

      {customer && (
        <div className="rounded-2xl border border-border bg-surface-soft/40 p-4">
          <p className="mb-1 text-sm font-medium text-text-primary">{t('vehicle.contactTitle')}</p>
          <p className="text-sm text-text-secondary">
            {customer.name} · {customer.phone}
          </p>
        </div>
      )}
    </div>
  );
}
