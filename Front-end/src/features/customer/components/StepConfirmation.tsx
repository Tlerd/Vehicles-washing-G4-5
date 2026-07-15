import React, { useEffect, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { priceService } from '../../../services/customer/price.service';
import { bookingService } from '../../../services/customer/booking.service';
import { catalogService } from '../../../services/customer/catalog.service';
import { platformService } from '../../../services/platform.service';
import { Button } from '../../../components/Button/Button';
import { CAR_TYPES, LOYALTY_TIERS } from '../../../config/constants';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Branch, ServiceItem } from '../../../types';

interface AvailableVoucher {
  voucherId: number;
  voucherCode: string;
  discountAmount: number;
  status: string;
  expiredAt: string;
}

interface StepConfirmationProps {
  onSubmit: () => void;
  onComplete: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({ onSubmit, onComplete: _onComplete }) => {
  const { draft, goToStep, prevStep, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>(catalogService.getCachedServices());
  const [branches, setBranches] = useState<Branch[]>(catalogService.getCachedBranches());
  const [vouchers, setVouchers] = useState<AvailableVoucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;

    catalogService.getServices()
      .then(items => {
        if (active) setServices(items);
      })
      .catch(error => console.error('Failed to refresh service catalog', error));

    catalogService.getBranches()
      .then(items => {
        if (active) setBranches(items);
      })
      .catch(error => console.error('Failed to refresh branch catalog', error));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!currentUser?.id || currentUser.id === 'guest') {
      setVouchers([]);
      return () => {
        active = false;
      };
    }

    setIsLoadingVouchers(true);
    platformService.vouchers(currentUser.id)
      .then((items: AvailableVoucher[]) => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        setVouchers(items.filter(voucher => voucher.status === 'ACTIVE' && voucher.expiredAt.slice(0, 10) >= today));
      })
      .catch(error => {
        console.error('Failed to load customer vouchers', error);
        if (active) setVouchers([]);
      })
      .finally(() => {
        if (active) setIsLoadingVouchers(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const carType = CAR_TYPES.find(car => car.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => services.find(service => service.id === id))
    .filter((service): service is ServiceItem => Boolean(service));
  const branch = branches.find(item => item.id === draft.branchId);
  const vehicleMultiplier = priceService.getCarMultiplier(draft.carSize);
  const estimatedTotal = Math.round(
    selectedServices.reduce((sum, service) => sum + service.basePrice, 0) * vehicleMultiplier,
  );
  const selectedVoucher = vouchers.find(voucher => String(voucher.voucherId) === draft.voucherId);
  const estimatedFinalPrice = Math.max(0, estimatedTotal - Number(selectedVoucher?.discountAmount || 0));
  const Kh = LOYALTY_TIERS.find(tier => tier.name === currentUser?.tier)?.multiplier || 1.0;
  const pointsEarned = Math.floor((estimatedFinalPrice / 1000) * Kh);
  const estimatedDuration = selectedServices.reduce((minutes, service) => minutes + service.duration, 0);

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (!currentUser || currentUser.id === 'guest') {
        throw new Error('Please log in before confirming your booking.');
      }

      const validation = bookingService.validateBooking(draft);
      if (!validation.valid) throw new Error(validation.errors.join('. '));
      if (!draft.vehicleId && (!draft.vehiclePlate.trim() || !draft.vehicleBrand.trim())) {
        throw new Error('Please select or add a vehicle with a license plate and brand/model.');
      }

      if (await bookingService.hasActiveBooking(currentUser.id)) {
        throw new Error('You already have an active booking.');
      }

      const booking = await bookingService.createBooking(draft, currentUser.id);
      updateDraft({
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        vietQrUrl: booking.vietQrUrl,
        confirmedTotalPrice: booking.totalPrice,
        endTime: booking.endTime,
        durationMinutes: booking.durationMinutes,
        vehicleId: booking.vehicleId,
        vehiclePlate: booking.licensePlate || draft.vehiclePlate,
        vehicleBrand: booking.vehicleBrand || draft.vehicleBrand,
      });
      onSubmit();
    } catch (error) {
      console.error('Booking failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'Booking failed. Please try again.');
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
            {carType?.icon} {draft.vehicleBrand} — {draft.vehiclePlate} / {carType?.name} (×{carType?.multiplier})
            <button type="button" className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(1)}>Edit</button>
          </span>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">✨ Services</span>
          <div className="flex flex-col gap-1 items-end">
            {selectedServices.map(service => (
              <span key={service.id} className="text-xs bg-sky-100 text-sky-600 px-2.5 py-1 rounded-md font-semibold">
                {service.icon} {service.name} — {priceService.formatPrice(service.basePrice)}
              </span>
            ))}
            <button type="button" className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline mt-1" onClick={() => goToStep(2)}>Edit</button>
          </div>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">📍 Branch</span>
          <span className="text-sm text-slate-900 font-semibold text-right">
            {branch?.name || draft.branchId}
            <button type="button" className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(3)}>Edit</button>
          </span>
        </div>

        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-200 last:border-b-0">
          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-2 min-w-[140px] shrink-0">📅 Time slot</span>
          <span className="text-sm text-slate-900 font-semibold text-right">
            {draft.date ? formatDate(draft.date) : '—'} · {draft.time ? formatTime(draft.time) : '—'}
            {draft.endTime ? ` – ${formatTime(draft.endTime)}` : ''}
            {' '}({draft.durationMinutes || estimatedDuration} min)
            <button type="button" className="text-[11px] text-sky-500 bg-transparent border-none cursor-pointer font-semibold ml-2 hover:underline" onClick={() => goToStep(4)}>Edit</button>
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="booking-voucher" className="mb-2 block text-sm font-bold text-slate-700">Reward voucher</label>
        <select
          id="booking-voucher"
          value={draft.voucherId || ''}
          onChange={event => updateDraft({ voucherId: event.target.value || null })}
          disabled={isLoadingVouchers || isSubmitting}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-wait disabled:bg-slate-100"
        >
          <option value="">{isLoadingVouchers ? 'Loading vouchers...' : 'Do not apply a voucher'}</option>
          {vouchers.map(voucher => (
            <option key={voucher.voucherId} value={voucher.voucherId}>
              {voucher.voucherCode} (-{priceService.formatPrice(Number(voucher.discountAmount))})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-5 flex items-center justify-between mt-5 rounded-xl">
        <span className="text-white/90 text-sm font-medium">Estimated total</span>
        <span className="text-white text-3xl font-extrabold">{priceService.formatPrice(estimatedFinalPrice)}</span>
      </div>

      {currentUser && (
        <section className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-slate-700">Estimated points before campaign</span>
            <div className="text-amber-500 font-bold text-lg flex items-center gap-1">
              ⭐ {pointsEarned} <span className="text-sm text-emerald-600 font-bold">pts</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <span className="bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200">K_h: {Kh}x</span>
            </div>
            <div className="text-[12px] text-slate-500 font-mono mt-1">
              Base estimate = ⌊{estimatedFinalPrice.toLocaleString('vi-VN')} / 1,000⌋ × {Kh.toFixed(1)}. The backend applies any active campaign when the wash is completed.
            </div>
          </div>
        </section>
      )}

      {submitError && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="secondary" onClick={prevStep} disabled={isSubmitting}>
          ← Back
        </Button>
        <Button size="lg" onClick={handleConfirm} loading={isSubmitting}>
          ✅ Confirm booking
        </Button>
      </div>
    </div>
  );
};
