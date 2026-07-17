import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { bookingService } from '../../../services/customer/booking.service';
import { priceService } from '../../../services/customer/price.service';

export const useBookingWizard = () => {
  const { draft, updateDraft, resetDraft, goToStep, nextStep, prevStep } = useCustomerBooking();

  const estimatedPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);

  const validation = bookingService.validateBooking(draft);

  const canProceed = (): boolean => {
    switch (draft.currentStep) {
      case 1: return !!draft.carSize;
      case 2: return draft.selectedServices.length > 0;
      case 3: return !!draft.branchId;
      case 4: return !!draft.date && !!draft.time;
      case 5: return validation.valid;
      default: return false;
    }
  };

  return {
    draft,
    updateDraft,
    resetDraft,
    goToStep,
    nextStep,
    prevStep,
    estimatedPrice,
    validation,
    canProceed,
  };
};
