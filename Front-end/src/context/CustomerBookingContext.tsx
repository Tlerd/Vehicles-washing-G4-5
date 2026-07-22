import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BookingDraft } from '../types';

interface CustomerBookingContextType {
  draft: BookingDraft;
  updateDraft: (updates: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialDraft: BookingDraft = {
  currentStep: 1,
  carSize: 'sedan',
  selectedServices: [],
  branchId: null,
  date: null,
  time: null,
  vehicleId: null,
  vehiclePlate: '',
  vehicleBrand: '',
  voucherId: null,
};

const CustomerBookingContext = createContext<CustomerBookingContextType | undefined>(undefined);

export const CustomerBookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const saved = localStorage.getItem('booking_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse booking_draft', e);
      }
    }
    return initialDraft;
  });

  useEffect(() => {
    localStorage.setItem('booking_draft', JSON.stringify(draft));
  }, [draft]);

  const updateDraft = useCallback((updates: Partial<BookingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
    localStorage.removeItem('booking_draft');
  }, []);

  const goToStep = useCallback((step: number) => {
    setDraft(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setDraft(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 6) }));
  }, []);

  const prevStep = useCallback(() => {
    setDraft(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  return (
    <CustomerBookingContext.Provider value={{
      draft,
      updateDraft,
      resetDraft,
      goToStep,
      nextStep,
      prevStep,
    }}>
      {children}
    </CustomerBookingContext.Provider>
  );
};

export const useCustomerBooking = () => {
  const context = useContext(CustomerBookingContext);
  if (!context) throw new Error('useCustomerBooking must be used within CustomerBookingProvider');
  return context;
};
