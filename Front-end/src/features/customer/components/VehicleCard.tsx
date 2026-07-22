import { useState } from 'react';
import { Car, Check, Pencil, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '@/components/ui';
import type { Vehicle } from '@/lib/api/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: () => void;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
}

/** Vehicle card with edit + two-step (inline confirm) delete actions. */
export function VehicleCard({ vehicle, onEdit, onConfirmDelete, isDeleting }: VehicleCardProps) {
  const { t } = useTranslation('garage');
  const [confirming, setConfirming] = useState(false);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary-light/60 p-2.5 text-primary-dark">
          <Car className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">
            {vehicle.brand} · {vehicle.licensePlate}
          </p>
          {vehicle.notes && <p className="truncate text-sm text-text-secondary">{vehicle.notes}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="neutral">{t(`sizes.${vehicle.size}`)}</Badge>
            {vehicle.isDefault && <Badge tone="primary">{t('card.defaultBadge')}</Badge>}
          </div>
        </div>
      </div>

      {confirming ? (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-danger/5 px-3 py-2">
          <p className="text-xs font-medium text-danger">{t('card.deleteConfirm')}</p>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setConfirming(false)}
              aria-label={t('card.cancelAriaLabel')}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              aria-label={t('card.confirmDeleteAriaLabel')}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" size="md" onClick={onEdit} className="flex-1">
            <Pencil className="h-4 w-4" />
            {t('card.edit')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setConfirming(true)}
            className="flex-1 text-danger hover:border-danger/40"
          >
            <Trash2 className="h-4 w-4" />
            {t('card.delete')}
          </Button>
        </div>
      )}
    </Card>
  );
}
