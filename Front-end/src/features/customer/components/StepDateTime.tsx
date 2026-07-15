import React, { useEffect, useMemo, useState } from 'react';
import { TimeSlot } from '../../../types';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { bookingService } from '../../../services/customer/booking.service';
import styles from '../styles/StepDateTime.module.css';

export const StepDateTime: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');

  const days = useMemo(() => bookingService.getNextDays(14), []);
  const earliestDate = days[0]?.date;

  useEffect(() => {
    let active = true;

    if (!draft.branchId || !draft.date || draft.selectedServices.length === 0) {
      setTimeSlots([]);
      setSlotError('');
      setIsLoadingSlots(false);
      return () => {
        active = false;
      };
    }

    setIsLoadingSlots(true);
    setSlotError('');
    bookingService.getAvailableSlots(draft.branchId, draft.date, draft.selectedServices)
      .then(slots => {
        if (active) setTimeSlots(slots);
      })
      .catch(error => {
        console.error('Failed to load booking availability', error);
        if (active) {
          setTimeSlots([]);
          setSlotError('Unable to load available time slots. Please try another date.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [draft.branchId, draft.date, draft.selectedServices]);

  const handleDateSelect = (date: string) => {
    updateDraft({ date, time: null, endTime: undefined, durationMinutes: undefined });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    updateDraft({
      time: slot.time,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
    });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Select Date & Time</h3>
      <p className={styles.subtitle}>Choose a quick date or any future date accepted by the booking API.</p>

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

      <label className={styles.customDate}>
        <span>Choose another date</span>
        <input
          type="date"
          min={earliestDate}
          value={draft.date || ''}
          onChange={event => handleDateSelect(event.target.value)}
        />
      </label>

      <span className={styles.sectionLabel}>🕐 Select time</span>
      {!draft.date ? (
        <div className={styles.noDate}>📅 Please select a date first</div>
      ) : isLoadingSlots ? (
        <div className={styles.noDate}>Loading available time slots...</div>
      ) : slotError ? (
        <div className={`${styles.noDate} ${styles.errorNotice}`}>{slotError}</div>
      ) : timeSlots.length === 0 ? (
        <div className={styles.noDate}>No time slots are available for this date.</div>
      ) : (
        <div className={styles.timeGrid}>
          {timeSlots.map(slot => (
            <button
              type="button"
              key={`${slot.time}-${slot.endTime}`}
              className={`${styles.timeSlot} ${
                draft.time === slot.time ? styles.timeSlotSelected : ''
              } ${!slot.available ? styles.timeSlotDisabled : ''}`}
              onClick={() => slot.available && handleTimeSelect(slot)}
              disabled={!slot.available}
              title={`${slot.durationMinutes} minutes`}
            >
              {slot.time} – {slot.endTime}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
