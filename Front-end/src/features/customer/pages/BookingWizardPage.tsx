import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { Stepper } from '../../../components/Stepper/Stepper';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { StepCarType } from '../components/StepCarType';
import { StepServices } from '../components/StepServices';
import { StepBranch } from '../components/StepBranch';
import { StepDateTime } from '../components/StepDateTime';
import { StepConfirmation } from '../components/StepConfirmation';
import { StepPayment } from '../components/StepPayment';
import { priceService } from '../../../services/customer/price.service';
import styles from '../styles/BookingWizard.module.css';

const STEPS = [
  { label: 'Vehicle type', icon: '🚗' },
  { label: 'Services', icon: '✨' },
  { label: 'Branch', icon: '📍' },
  { label: 'Time slot', icon: '📅' },
  { label: 'Confirm', icon: '✅' },
  { label: 'Payment', icon: '💳' },
];

interface BookingWizardPageProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const BookingWizardPage: React.FC<BookingWizardPageProps> = ({ onComplete, onCancel }) => {
  const { draft, nextStep, prevStep, goToStep } = useCustomerBooking();

  const estimatedPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);

  const canProceed = (): boolean => {
    switch (draft.currentStep) {
      case 1: return !!draft.carSize || !!draft.vehicleId;
      case 2: return draft.selectedServices.length > 0;
      case 3: return !!draft.branchId;
      case 4: return !!draft.date && !!draft.time;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (draft.currentStep) {
      case 1: return <StepCarType />;
      case 2: return <StepServices />;
      case 3: return <StepBranch />;
      case 4: return <StepDateTime />;
      case 5: return <StepConfirmation onSubmit={nextStep} />;
      case 6: return <StepPayment onComplete={onComplete} />;
      default: return null;
    }
  };

  return (
    <div className={styles.wizard}>
      <Card variant="elevated" padding="lg">
        <Stepper
          steps={STEPS}
          currentStep={draft.currentStep}
          onStepClick={(step) => step < draft.currentStep && goToStep(step)}
        />

        {/* Price Preview */}
        {draft.selectedServices.length > 0 && draft.currentStep < 5 && (
          <div className={styles.pricePreview}>
            <span className={styles.priceLabel}>Estimated total</span>
            <span className={styles.priceValue}>{priceService.formatPrice(estimatedPrice)}</span>
          </div>
        )}

        {/* Step Content */}
        <div className={styles.stepContent} key={draft.currentStep}>
          {renderStep()}
        </div>

        {/* Navigation */}
        {draft.currentStep < 5 && (
          <div className={styles.navButtons}>
            {draft.currentStep > 1 ? (
              <Button variant="secondary" onClick={prevStep}>
                ← Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next step →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
