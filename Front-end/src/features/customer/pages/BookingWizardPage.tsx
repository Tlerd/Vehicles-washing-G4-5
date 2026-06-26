import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { Stepper } from '../../../components/Stepper/Stepper';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { StepCarType } from '../components/StepCarType';
import { StepServices } from '../components/StepServices';
import { StepBranch } from '../components/StepBranch';
import { StepDateTime } from '../components/StepDateTime';
import { StepConfirmation } from '../components/StepConfirmation';
import { priceService } from '../../../services/customer/price.service';
import styles from '../styles/BookingWizard.module.css';

const STEPS = [
  { label: 'Loại xe', icon: '🚗' },
  { label: 'Dịch vụ', icon: '✨' },
  { label: 'Chi nhánh', icon: '📍' },
  { label: 'Thời gian', icon: '📅' },
  { label: 'Xác nhận', icon: '✅' },
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
      case 1: return !!draft.carSize;
      case 2: return draft.selectedServices.length > 0;
      case 3: return !!draft.branchId;
      case 4: return !!draft.date && !!draft.time;
      case 5: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (draft.currentStep) {
      case 1: return <StepCarType />;
      case 2: return <StepServices />;
      case 3: return <StepBranch />;
      case 4: return <StepDateTime />;
      case 5: return <StepConfirmation onSubmit={() => {}} onComplete={onComplete} />;
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
            <span className={styles.priceLabel}>Tổng cộng dự kiến</span>
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
                ← Quay lại
              </Button>
            ) : (
              <Button variant="ghost" onClick={onCancel}>
                Huỷ
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Bước tiếp theo →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
