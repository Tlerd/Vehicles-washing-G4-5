import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { priceService } from '../../../services/customer/price.service';
import { bookingService } from '../../../services/customer/booking.service';
import { Button } from '../../../components/Button/Button';
import { CAR_TYPES, SERVICES, BRANCHES, LOYALTY_TIERS } from '../../../config/constants';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Booking } from '../../../types';
import styles from '../styles/StepConfirmation.module.css';

interface StepConfirmationProps {
  onSubmit: () => void;
  onComplete: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({ onSubmit, onComplete }) => {
  const { draft, goToStep, prevStep, resetDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);
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
      setSubmittedBooking(booking);
      onSubmit();
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    resetDraft();
    onComplete();
  };

  // Success state after booking
  if (submittedBooking) {
    return (
      <div className={styles.successOverlay}>
        <span className={styles.successIcon}>🎉</span>
        <div className={styles.successTitle}>Đặt lịch thành công!</div>
        <div className={styles.successSub}>
          Lịch rửa xe của bạn đã được xác nhận.
        </div>
        <div className={styles.successRef}>{submittedBooking.bookingRef}</div>
        <div className={styles.actions} style={{ justifyContent: 'center' }}>
          <Button onClick={handleBackToDashboard} size="lg">
            ← Quay về Tổng quan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Tóm tắt Đặt lịch</h3>
      <p className={styles.subtitle}>Vui lòng kiểm tra lại thông tin trước khi xác nhận</p>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>🚗 Loại xe</span>
          <span className={styles.summaryValue}>
            {carType?.icon} {carType?.name} (×{carType?.multiplier})
            <button className={styles.editBtn} onClick={() => goToStep(1)}>Sửa</button>
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>✨ Dịch vụ</span>
          <div className={styles.serviceList}>
            {selectedServices.map(s => s && (
              <span key={s.id} className={styles.serviceTag}>
                {s.icon} {s.name} — {priceService.formatPrice(s.basePrice)}
              </span>
            ))}
            <button className={styles.editBtn} onClick={() => goToStep(2)}>Sửa</button>
          </div>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>📍 Chi nhánh</span>
          <span className={styles.summaryValue}>
            {branch?.name}
            <button className={styles.editBtn} onClick={() => goToStep(3)}>Sửa</button>
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>📅 Thời gian</span>
          <span className={styles.summaryValue}>
            {draft.date ? formatDate(draft.date) : '—'} lúc {draft.time ? formatTime(draft.time) : '—'}
            <button className={styles.editBtn} onClick={() => goToStep(4)}>Sửa</button>
          </span>
        </div>
      </div>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Tổng cộng</span>
        <span className={styles.totalPrice}>{priceService.formatPrice(totalPrice)}</span>
      </div>

      <div className={styles.pointsNote} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
        <div>
          Dự kiến nhận: <span className={styles.pointsHighlight}>{pointsEarned} điểm</span>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Phép tính: {Math.floor(totalPrice / 1000)} (cơ bản) × {tierMultiplier.toFixed(1)} (hệ số hạng)
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={prevStep}>
          ← Quay lại
        </Button>
        <Button size="lg" onClick={handleConfirm} loading={isSubmitting}>
          ✅ Xác nhận đặt lịch
        </Button>
      </div>
    </div>
  );
};
