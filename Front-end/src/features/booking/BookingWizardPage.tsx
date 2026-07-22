import { ArrowLeft, ArrowRight, CheckCircle2, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, LanguageToggle, Stepper, ThemeToggle } from '@/components/ui';
import { formatVND } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useCreateBooking, useCustomerBookings, type Booking } from '@/lib/api/bookings';
import { useAuth } from '@/features/auth/AuthContext';
import { LAST_STEP, WIZARD_STEPS, useBookingStore } from './store';
import { useCartSummary } from './selectors';
import { StepBranch } from './steps/StepBranch';
import { StepService } from './steps/StepService';
import { StepDateTime } from './steps/StepDateTime';
import { StepVehicle } from './steps/StepVehicle';
import { StepReview } from './steps/StepReview';
import { StepConfirm } from './steps/StepConfirm';

export function BookingWizardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('booking');
  const store = useBookingStore();
  const cart = useCartSummary();
  const createBooking = useCreateBooking();

  const stepLabels = [
    t('wizard.steps.branch'),
    t('wizard.steps.service'),
    t('wizard.steps.dateTime'),
    t('wizard.steps.vehicle'),
    t('wizard.steps.review'),
    t('wizard.steps.confirm'),
  ];

  const canProceed = ((): boolean => {
    switch (store.step) {
      case 0:
        return Boolean(store.branchId);
      case 1:
        return cart.lines.length > 0;
      case 2:
        return Boolean(store.dayKey && store.slotTime);
      case 3:
        return Boolean(
          store.savedVehicleId ||
            (store.manualVehicle.plate.trim().length > 0 && store.manualVehicle.brand.trim().length > 0),
        );
      default:
        return true;
    }
  })();

  const handleConfirm = () => {
    if (!store.branchId || !store.dayKey || !store.slotTime) return;
    createBooking.mutate({
      vehicleId: store.savedVehicleId,
      licensePlate: store.savedVehicleId ? undefined : store.manualVehicle.plate,
      brand: store.savedVehicleId ? undefined : store.manualVehicle.brand,
      vehicleSize: store.savedVehicleId ? undefined : store.manualVehicle.size,
      branchId: store.branchId,
      serviceCodes: store.serviceCodes,
      bookingDate: store.dayKey,
      bookingTime: store.slotTime,
    });
  };

  if (createBooking.isSuccess) {
    return (
      <BookingSuccess
        booking={createBooking.data}
        onHome={() => {
          store.reset();
          createBooking.reset();
          navigate('/');
        }}
        onAgain={() => {
          store.reset();
          createBooking.reset();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-primary"
          aria-label={t('wizard.homeAriaLabel')}
        >
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <Droplets className="h-5 w-5" />
          </span>
          <span className="font-display font-bold">AutoWash Pro</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-text-muted sm:inline">
            {t('wizard.stepCounter', { current: store.step + 1, total: WIZARD_STEPS.length })}
          </span>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="mb-6">
        <Stepper steps={stepLabels} current={store.step} />
      </div>

      <h1 className="mb-4 font-display text-2xl font-bold text-text-primary">
        {stepLabels[store.step]}
      </h1>

      <main className="flex-1">
        {store.step === 0 && <StepBranch />}
        {store.step === 1 && <StepService />}
        {store.step === 2 && <StepDateTime />}
        {store.step === 3 && <StepVehicle />}
        {store.step === 4 && <StepReview />}
        {store.step === 5 && <StepConfirm error={createBooking.error} />}
      </main>

      <footer
        className={cn(
          'sticky bottom-0 z-30 mt-6 flex items-center gap-3 border-t border-border bg-background/90 py-4 backdrop-blur',
        )}
      >
        {store.step > 0 && (
          <Button variant="secondary" onClick={store.prev} disabled={createBooking.isPending}>
            <ArrowLeft className="h-4 w-4" /> {t('wizard.back')}
          </Button>
        )}
        {cart.lines.length > 0 && (
          <div className="mr-auto text-sm">
            <span className="text-text-secondary">{t('wizard.cartTotalLabel')} </span>
            <span className="font-bold text-text-primary">{formatVND(cart.total)}</span>
          </div>
        )}
        {store.step < LAST_STEP ? (
          <Button disabled={!canProceed} onClick={store.next} className="ml-auto">
            {t('wizard.continue')} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="ml-auto" onClick={handleConfirm} disabled={createBooking.isPending}>
            {createBooking.isPending ? t('wizard.submitting') : t('wizard.confirmBooking')}
          </Button>
        )}
      </footer>
    </div>
  );
}

function BookingSuccess({
  booking,
  onHome,
  onAgain,
}: {
  booking: Booking;
  onHome: () => void;
  onAgain: () => void;
}) {
  const { t } = useTranslation('booking');
  const { customer } = useAuth();
  const {
    data: myBookings,
    isFetching: isCheckingStatus,
    refetch: refetchStatus,
  } = useCustomerBookings(customer?.id);
  const bookingStatus = myBookings?.find((b) => b.bookingRef === booking.bookingRef)?.status ?? booking.status;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">
        {t('wizard.success.title')}
      </h1>
      <p className="text-text-secondary">{t('wizard.success.ref', { ref: booking.bookingRef })}</p>
      <div className="mb-6 flex w-full max-w-sm items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{t('wizard.success.statusPanel.label')}</span>
          <Badge tone={bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED' ? 'success' : 'neutral'}>
            {bookingStatus}
          </Badge>
        </div>
        <button
          onClick={() => void refetchStatus()}
          disabled={isCheckingStatus}
          className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
        >
          {isCheckingStatus ? t('wizard.success.statusPanel.refreshing') : t('wizard.success.statusPanel.refresh')}
        </button>
      </div>

      <p className="mb-8 max-w-sm text-text-secondary">{t('wizard.success.description')}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onHome}>
          {t('wizard.success.home')}
        </Button>
        <Button onClick={onAgain}>{t('wizard.success.again')}</Button>
      </div>
    </div>
  );
}
