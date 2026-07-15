import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { BookingHeader } from './components/BookingHeader';
import { StepBranch } from './components/StepBranch';
import { StepSchedule } from './components/StepSchedule';
import { StepServices } from './components/StepServices';
import { StepContact } from './components/StepContact';
import { StepPayment } from './components/StepPayment';

interface BookingPageProps {
  onComplete: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ onComplete }) => {
  const { state } = useBooking();

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <BookingHeader />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 mt-6">
        {state.currentStep === 1 && <StepBranch />}
        {state.currentStep === 2 && <StepSchedule />}
        {state.currentStep === 3 && <StepServices />}
        {state.currentStep === 4 && <StepContact />}
        {state.currentStep === 5 && <StepPayment onCompleteBooking={onComplete} />}
      </main>
    </div>
  );
};
