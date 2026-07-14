import React, { useEffect, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { priceService } from '../../../services/customer/price.service';
import { bookingService } from '../../../services/customer/booking.service';
import { Button } from '../../../components/Button/Button';
import { CAR_TYPES, BRANCHES, LOYALTY_TIERS } from '../../../config/constants';
import { catalogService } from '../../../services/customer/catalog.service';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Booking } from '../../../types';
import styles from '../styles/StepConfirmation.module.css';
import { platformService } from '../../../services/platform.service';

interface AvailableVoucher { voucherId:number; voucherCode:string; discountAmount:number; status:string; expiredAt:string; }

interface StepConfirmationProps {
  onSubmit: () => void;
  onComplete: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({ onSubmit, onComplete }) => {
  const { draft, goToStep, prevStep, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vouchers,setVouchers]=useState<AvailableVoucher[]>([]);
  useEffect(()=>{if(currentUser?.id) platformService.vouchers(currentUser.id).then((items:AvailableVoucher[])=>setVouchers(items.filter(v=>v.status==='ACTIVE'&&v.expiredAt>=new Date().toISOString().slice(0,10))));},[currentUser?.id]);

  const carType = CAR_TYPES.find(c => c.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => catalogService.getCachedServices().find(s => s.id === id))
    .filter(Boolean);
  const branch = BRANCHES.find(b => b.id === draft.branchId);
  const totalPrice = selectedServices.reduce((sum,s)=>sum+(s?.basePrice||0),0)*(carType?.multiplier||1);
  const tierMultiplier = LOYALTY_TIERS.find(t => t.name === currentUser?.tier)?.multiplier || 1.0;
  const selectedVoucher=vouchers.find(v=>String(v.voucherId)===draft.voucherId);
  const finalPrice=Math.max(0,totalPrice-Number(selectedVoucher?.discountAmount||0));
  const pointsEarned = Math.floor((finalPrice / 1000) * tierMultiplier);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if(await bookingService.hasActiveBooking(currentUser?.id||'')) throw new Error('You already have an active booking.');
      const booking = await bookingService.createBooking(draft, currentUser?.id || 'guest');
      // Update draft with bookingId so Step Payment knows which booking it is
      updateDraft({ bookingId: booking.id, bookingRef: booking.bookingRef, vietQrUrl: booking.vietQrUrl, confirmedTotalPrice: booking.totalPrice });
      onSubmit();
    } catch (err) {
      console.error('Booking failed:', err);
      alert(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Booking Summary</h3>
      <p className={styles.subtitle}>Please review the information before confirming</p>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>🚗 Vehicle type</span>
          <span className={styles.summaryValue}>
            {carType?.icon} {draft.vehicleBrand} — {draft.vehiclePlate} / {carType?.name} (×{carType?.multiplier})
            <button className={styles.editBtn} onClick={() => goToStep(1)}>Edit</button>
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>✨ Services</span>
          <div className={styles.serviceList}>
            {selectedServices.map(s => s && (
              <span key={s.id} className={styles.serviceTag}>
                {s.icon} {s.name} — {priceService.formatPrice(s.basePrice)}
              </span>
            ))}
            <button className={styles.editBtn} onClick={() => goToStep(2)}>Edit</button>
          </div>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>📍 Branch</span>
          <span className={styles.summaryValue}>
            {branch?.name}
            <button className={styles.editBtn} onClick={() => goToStep(3)}>Edit</button>
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>📅 Time slot</span>
          <span className={styles.summaryValue}>
            {draft.date ? formatDate(draft.date) : '—'} · {draft.time ? formatTime(draft.time) : '—'} – {draft.endTime ? formatTime(draft.endTime) : '—'} ({draft.durationMinutes || selectedServices.reduce((n,s)=>n+(s?.duration||0),0)} min)
            <button className={styles.editBtn} onClick={() => goToStep(4)}>Edit</button>
          </span>
        </div>
      </div>

      <label className={styles.voucherField}>Voucher
        <select value={draft.voucherId||''} onChange={e=>updateDraft({voucherId:e.target.value||null})}>
          <option value="">Do not apply a voucher</option>
          {vouchers.map(v=><option key={v.voucherId} value={v.voucherId}>{v.voucherCode} (-{priceService.formatPrice(Number(v.discountAmount))})</option>)}
        </select>
      </label>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Total amount</span>
        <span className={styles.totalPrice}>{priceService.formatPrice(finalPrice)}</span>
      </div>

      {currentUser && (
        <div className={styles.pointsNote} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
          <div>
            Expected to earn: <span className={styles.pointsHighlight}>{pointsEarned} points</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Calculation after voucher: {Math.floor(finalPrice / 1000)} × {tierMultiplier.toFixed(1)}
          </div>
        </div>
      )}

      <div className={styles.actions}>
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
