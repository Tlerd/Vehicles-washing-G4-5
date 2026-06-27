import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { priceService } from '../../../services/customer/price.service';
import { bookingService } from '../../../services/customer/booking.service';
import { Button } from '../../../components/Button/Button';
import { CAR_TYPES, SERVICES, BRANCHES, LOYALTY_TIERS } from '../../../config/constants';
import { formatDate, formatTime } from '../../../utils/formatters';
import styles from '../styles/StepConfirmation.module.css';

interface StepConfirmationProps {
  onSubmit: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({ onSubmit }) => {
  const { draft, goToStep, prevStep, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const carType = CAR_TYPES.find(c => c.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => SERVICES.find(s => s.id === id))
    .filter(Boolean);
  const branch = BRANCHES.find(b => b.id === draft.branchId);
  const totalPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
  const tierMultiplier = LOYALTY_TIERS.find(t => t.name === currentUser?.tier)?.multiplier || 1.0;
  const pointsEarned = Math.floor((totalPrice / 1000) * tierMultiplier);

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
    <div className={styles.container}>
      <h3 className={styles.title}>Booking Summary</h3>
      <p className={styles.subtitle}>Please review the information before confirming</p>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>🚗 Vehicle type</span>
          <span className={styles.summaryValue}>
            {carType?.icon} {carType?.name} (×{carType?.multiplier})
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
            {draft.date ? formatDate(draft.date) : '—'} at {draft.time ? formatTime(draft.time) : '—'}
            <button className={styles.editBtn} onClick={() => goToStep(4)}>Edit</button>
          </span>
        </div>
      </div>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Total amount</span>
        <span className={styles.totalPrice}>{priceService.formatPrice(totalPrice)}</span>
      </div>

      {currentUser && (
        <div className={styles.pointsNote} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
          <div>
            Expected to earn: <span className={styles.pointsHighlight}>{pointsEarned} points</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Calculation: {Math.floor(totalPrice / 1000)} (base) × {tierMultiplier.toFixed(1)} (tier multiplier)
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
