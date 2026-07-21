import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Select } from '@/components/ui';
import type { VehicleInput, VehicleSizeCode } from '@/lib/api/vehicles';
import { VEHICLE_BRANDS } from '../vehicleBrands';

interface VehicleFormSheetProps {
  open: boolean;
  title: string;
  initialValues: VehicleInput | null;
  onClose: () => void;
  onSubmit: (values: VehicleInput) => void;
  isSubmitting: boolean;
  submitError?: string;
}

interface FormErrors {
  brand?: string;
  licensePlate?: string;
}

const DEFAULT_SIZE: VehicleSizeCode = 'SEDAN';
const VEHICLE_SIZES: VehicleSizeCode[] = ['HATCHBACK', 'SEDAN', 'SUV', 'PICKUP'];

/** Modal-style overlay for both add and edit vehicle flows, backed by the
 *  real /api/v1/vehicles contract (brand is free text via a curated picker;
 *  size is the backend's HATCHBACK/SEDAN/SUV/PICKUP taxonomy). */
export function VehicleFormSheet({
  open,
  title,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: VehicleFormSheetProps) {
  const { t } = useTranslation('garage');
  const [brand, setBrand] = useState(initialValues?.brand ?? VEHICLE_BRANDS[0]);
  const [licensePlate, setLicensePlate] = useState(initialValues?.licensePlate ?? '');
  const [size, setSize] = useState<VehicleSizeCode>(initialValues?.size ?? DEFAULT_SIZE);
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setBrand(initialValues?.brand ?? VEHICLE_BRANDS[0]);
    setLicensePlate(initialValues?.licensePlate ?? '');
    setSize(initialValues?.size ?? DEFAULT_SIZE);
    setNotes(initialValues?.notes ?? '');
    setErrors({});
  }, [open, initialValues]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedPlate = licensePlate.trim();
    const nextErrors: FormErrors = {};
    if (!brand) nextErrors.brand = t('form.brandRequired');
    if (!trimmedPlate) nextErrors.licensePlate = t('form.plateRequired');
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ brand, licensePlate: trimmedPlate, size, notes: notes.trim() || undefined });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-text-primary">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-soft"
                aria-label={t('form.closeAriaLabel')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label={t('form.brandLabel')} error={errors.brand}>
                <Select value={brand} onChange={(event) => setBrand(event.target.value)}>
                  {VEHICLE_BRANDS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('form.plateLabel')} error={errors.licensePlate}>
                <Input
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(event.target.value)}
                  placeholder={t('form.platePlaceholder')}
                  autoFocus
                />
              </Field>

              <Field label={t('form.sizeLabel')}>
                <Select
                  value={size}
                  onChange={(event) => setSize(event.target.value as VehicleSizeCode)}
                >
                  {VEHICLE_SIZES.map((sizeOption) => (
                    <option key={sizeOption} value={sizeOption}>
                      {t(`sizes.${sizeOption}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('form.notesLabel')}>
                <Input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t('form.notesPlaceholder')}
                />
              </Field>

              {submitError && <p className="text-sm text-danger">{submitError}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  {t('form.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? t('form.saving') : t('form.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
