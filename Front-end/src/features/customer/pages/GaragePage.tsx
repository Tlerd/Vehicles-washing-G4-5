import { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import {
  useAddVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
  type Vehicle,
  type VehicleInput,
} from '@/lib/api/vehicles';
import { useAuth } from '@/features/auth/AuthContext';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFormSheet } from '../components/VehicleFormSheet';

type SheetState = { mode: 'add' } | { mode: 'edit'; vehicle: Vehicle } | null;

/** Vehicle management ("garage") — real /api/v1/vehicles CRUD, scoped to the
 *  signed-in customer by the backend JWT. */
export function GaragePage() {
  const { t } = useTranslation('garage');
  const { customer } = useAuth();
  const { data: vehicles, isLoading, isError, refetch } = useVehicles(customer?.id);
  const addVehicle = useAddVehicle(customer?.id);
  const updateVehicle = useUpdateVehicle(customer?.id);
  const deleteVehicle = useDeleteVehicle(customer?.id);

  const [sheet, setSheet] = useState<SheetState>(null);

  const closeSheet = () => setSheet(null);
  const formError = addVehicle.isError || updateVehicle.isError ? t('form.saveError') : undefined;

  const handleSubmit = (values: VehicleInput) => {
    if (sheet?.mode === 'edit') {
      updateVehicle.mutate({ id: sheet.vehicle.id, patch: values }, { onSuccess: closeSheet });
      return;
    }
    addVehicle.mutate(values, { onSuccess: closeSheet });
  };

  const addButton = (
    <Button type="button" onClick={() => setSheet({ mode: 'add' })}>
      <Plus className="h-4 w-4" />
      {t('addButton')}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-sm text-text-secondary">{t('description')}</p>
        </div>
        {addButton}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message={t('loadError')} onRetry={() => refetch()} />}

      {!isLoading && !isError && vehicles && vehicles.length === 0 && (
        <EmptyState
          icon={<Car className="h-8 w-8" />}
          title={t('empty.title')}
          description={t('empty.description')}
          action={addButton}
        />
      )}

      {deleteVehicle.isError && <p className="text-sm text-danger">{t('card.deleteError')}</p>}

      {!isLoading && !isError && vehicles && vehicles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => setSheet({ mode: 'edit', vehicle })}
              onConfirmDelete={() => deleteVehicle.mutate(vehicle.id)}
              isDeleting={deleteVehicle.isPending && deleteVehicle.variables === vehicle.id}
            />
          ))}
        </div>
      )}

      <VehicleFormSheet
        open={sheet !== null}
        title={sheet?.mode === 'edit' ? t('form.editTitle') : t('form.addTitle')}
        initialValues={sheet?.mode === 'edit' ? sheet.vehicle : null}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        isSubmitting={addVehicle.isPending || updateVehicle.isPending}
        submitError={formError}
      />
    </div>
  );
}
