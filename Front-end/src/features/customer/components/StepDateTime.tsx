import React, { useEffect, useMemo, useState } from 'react';
import { TimeSlot } from '../../../types';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { bookingService } from '../../../services/customer/booking.service';
import styles from '../styles/StepDateTime.module.css';
import { useAuth } from '../../../context/AuthContext';
import { LOYALTY_TIERS } from '../../../config/constants';

export const StepDateTime: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();

  const bookingLimit=LOYALTY_TIERS.find(t=>t.name===currentUser?.tier)?.bookingAdvanceLimit||7;
  const days = useMemo(() => bookingService.getNextDays(bookingLimit), [bookingLimit]);

  const [timeSlots,setTimeSlots]=useState<TimeSlot[]>([]);
  useEffect(()=>{if(draft.branchId&&draft.date&&draft.selectedServices.length)bookingService.getAvailableSlots(draft.branchId,draft.date,draft.selectedServices).then(setTimeSlots);else setTimeSlots([])},[draft.branchId,draft.date,draft.selectedServices]);
  const filteredSlots = useMemo(() => {
    if (!draft.date || !timeSlots.length) return timeSlots;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localToday = `${year}-${month}-${day}`;
    
    // Only filter if the selected date is today
    if (draft.date !== localToday) return timeSlots;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    return timeSlots.filter(slot => {
      const [h, m] = slot.time.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      // Only show slots that are strictly after the current time
      return slotMinutes > currentMinutes;
    });
  }, [timeSlots, draft.date]);

  const handleDateSelect = (date: string) => {
    updateDraft({ date, time: null });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    updateDraft({ time:slot.time, endTime:slot.endTime, durationMinutes:slot.durationMinutes });
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
          {filteredSlots.length > 0 ? (
            filteredSlots.map(slot => (
              <button
                key={slot.time}
                className={`${styles.timeSlot} ${
                  draft.time === slot.time ? styles.timeSlotSelected : ''
                } ${!slot.available ? styles.timeSlotDisabled : ''}`}
                onClick={() => slot.available && handleTimeSelect(slot)}
                disabled={!slot.available}
              >
                {slot.time} – {slot.endTime}
              </button>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'center', color: '#64748b' }}>
              No more available slots today.
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noDate}>📅 Please select a date first</div>
      )}
    </div>
  );
};
