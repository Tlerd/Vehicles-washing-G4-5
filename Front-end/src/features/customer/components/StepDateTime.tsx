import React, { useMemo } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { bookingService } from '../../../services/customer/booking.service';
import styles from '../styles/StepDateTime.module.css';

export const StepDateTime: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();

  const days = useMemo(() => bookingService.getNextSevenDays(), []);

  const timeSlots = useMemo(() => {
    if (!draft.branchId || !draft.date) return [];
    return bookingService.getAvailableSlots(draft.branchId, draft.date);
  }, [draft.branchId, draft.date]);

  const handleDateSelect = (date: string) => {
    updateDraft({ date, time: null });
  };

  const handleTimeSelect = (time: string) => {
    updateDraft({ time });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Select Date & Time</h3>
      <p className={styles.subtitle}>Choose the most convenient time slot</p>

      <span className={styles.sectionLabel}>📅 Select date</span>
      <div className={styles.calendar}>
        {days.map(day => (
          <div
            key={day.date}
            className={`${styles.dayCard} ${draft.date === day.date ? styles.dayCardSelected : ''}`}
            onClick={() => handleDateSelect(day.date)}
          >
            <span className={styles.dayName}>{day.dayName}</span>
            <span className={styles.dayNum}>{day.dayNum}</span>
            <span className={styles.dayMonth}>{day.monthName}</span>
            {day.isToday && <span className={styles.todayBadge}>TODAY</span>}
          </div>
        ))}
      </div>

      <span className={styles.sectionLabel}>🕐 Select time</span>
      {draft.date ? (
        <div className={styles.timeGrid}>
          {timeSlots.map(slot => (
            <button
              key={slot.time}
              className={`${styles.timeSlot} ${
                draft.time === slot.time ? styles.timeSlotSelected : ''
              } ${!slot.available ? styles.timeSlotDisabled : ''}`}
              onClick={() => slot.available && handleTimeSelect(slot.time)}
              disabled={!slot.available}
            >
              {slot.time}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.noDate}>📅 Please select a date first</div>
      )}
    </div>
  );
};
