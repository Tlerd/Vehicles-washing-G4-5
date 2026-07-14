import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { priceService } from '../../../services/customer/price.service';
import { bookingService } from '../../../services/customer/booking.service';
import { Button } from '../../../components/Button/Button';
import { CAR_TYPES, SERVICES, BRANCHES, LOYALTY_TIERS } from '../../../config/constants';
import { formatDate, formatTime } from '../../../utils/formatters';

interface StepConfirmationProps {
  onSubmit: () => void;
  onComplete: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({ onSubmit, onComplete: _onComplete }) => {
  const { draft, goToStep, prevStep, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const carType = CAR_TYPES.find(c => c.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => SERVICES.find(s => s.id === id))
    .filter(Boolean);
  const branch = BRANCHES.find(b => b.id === draft.branchId);
  const V = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
  const Kh = LOYALTY_TIERS.find(t => t.name === currentUser?.tier)?.multiplier || 1.0;
  const Kkm = 1.0; // Promotion multiplier default
  const pointsEarned = Math.floor((V / 1000) * Kh * Kkm);

  const handleConfirm = () => {
    setIsSubmitting(true);
    try {
      const booking = bookingService.createBooking(draft, currentUser?.id || 'guest');
      // Update draft with bookingId so Step Payment knows which booking it is
      updateDraft({ bookingId: booking.id });
      onSubmit();
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="py-6">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Booking Summary</h3>
      <p className="text-sm text-slate-500 mb-6">Please review the information before confirming</p>

      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">🚗 Vehicle type</span>
          <span className="text-sm text-slate-900 font-semibold text-right">
            {carType?.icon} {carType?.name} (×{carType?.multiplier})
            <button className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(1)}>Edit</button>
          </span>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">✨ Services</span>
          <div className="flex flex-col gap-1 items-end">
            {selectedServices.map(s => s && (
              <span key={s.id} className="text-xs bg-sky-100 text-sky-600 px-2.5 py-1 rounded-md font-semibold">
                {s.icon} {s.name} — {priceService.formatPrice(s.basePrice)}
              </span>
            ))}
            <button className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline mt-1" onClick={() => goToStep(2)}>Edit</button>
          </div>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">📍 Branch</span>
          <span className="text-sm text-slate-900 font-semibold text-right">
            {branch?.name}
            <button className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(3)}>Edit</button>
          </span>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">📅 Time slot</span>
          <span className="text-sm text-slate-900 font-semibold text-right">
            {draft.date ? formatDate(draft.date) : '—'} at {draft.time ? formatTime(draft.time) : '—'}
            <button className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(4)}>Edit</button>
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-5 flex items-center justify-between mt-5 rounded-xl">
        <span className="text-white/90 text-sm font-medium">Total amount</span>
        <span className="text-white text-3xl font-extrabold">{priceService.formatPrice(V)}</span>
      </div>

      {currentUser && (
        <section className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-slate-700">Expected points to earn</span>
            <div className="text-amber-500 font-bold text-lg flex items-center gap-1">
              ⭐ {pointsEarned} <span className="text-sm text-emerald-600 font-bold">pts</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <span className="bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200">K_h: {Kh}x</span>
              <span className="bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200">K_km: {Kkm}x</span>
            </div>
            <div className="text-[12px] text-slate-500 font-mono mt-1">
              P = ⌊{V.toLocaleString('vi-VN')} / 1,000⌋ × {Kh.toFixed(1)} × {Kkm.toFixed(1)}
            </div>
          </div>
        </section>
      )}

      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="secondary" onClick={prevStep}>
          ← Back
        </Button>
        <Button size="lg" onClick={handleConfirm} loading={isSubmitting}>
          ✅ Confirm booking
        </Button>
      </div>
    </div>
  );
};
