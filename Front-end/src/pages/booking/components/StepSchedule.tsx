import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Calendar, Clock, Info } from 'lucide-react';

// Helper to generate next 7 days
const getDates = () => {
  const dates = [];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      value: d.toISOString().split('T')[0],
      dayName: weekdays[d.getDay()],
      dateNum: d.getDate(),
      month: months[d.getMonth()]
    });
  }
  return dates;
};

// Helper to generate 30 minute time slots
const getTimeSlots = () => {
  const slots = [];
  for (let h = 8; h < 20; h++) {
    const hStr = h.toString().padStart(2, '0');
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
};

const datesList = getDates();
const timeSlots = getTimeSlots();

export const StepSchedule: React.FC = () => {
  const { state, updateState } = useBooking();

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-2 text-center">Select Date & Time</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-6">Times are formatted in 30-minute intervals.</p>

      {/* Date Selector Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 1. Select Date</h3>
          <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded">
            <Info className="w-3.5 h-3.5 text-brand-orange" />
            <span>Gold/Platinum tiers unlock 12-14 days booking window.</span>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {datesList.map((d) => {
            const isSelected = state.selectedDate === d.value;
            return (
              <div 
                key={d.value}
                onClick={() => updateState({ selectedDate: d.value })}
                className={`glass-card p-3 text-center cursor-pointer border-2 transition-all flex flex-col justify-center ${
                  isSelected ? 'border-brand-orange bg-orange-50/5 dark:bg-orange-500/5' : 'border-transparent'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">{d.dayName}</span>
                <span className="text-lg font-bold my-1">{d.dateNum}</span>
                <span className="text-[10px] text-slate-400">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Selector Grid */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-550 flex items-center gap-1.5 mb-3"><Clock className="w-4 h-4" /> 2. Select Time</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {timeSlots.map((ts) => {
            const isSelected = state.selectedTime === ts;
            // Mock fully booked slots (e.g. 10:00 and 10:30)
            const isBooked = ts === '10:00' || ts === '10:30';

            return (
              <button
                key={ts}
                disabled={isBooked}
                onClick={() => updateState({ selectedTime: ts })}
                className={`py-2 px-3 border rounded-lg text-sm font-semibold transition-all ${
                  isBooked ? 'bg-slate-100 text-slate-300 border-slate-200 dark:bg-slate-900/30 dark:text-slate-800 dark:border-slate-900/50 cursor-not-allowed opacity-55' :
                  isSelected ? 'border-brand-orange bg-brand-orange text-white' :
                  'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                {ts}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
        <button onClick={() => updateState({ currentStep: 1 })} className="btn-secondary">Back</button>
        <button 
          disabled={!state.selectedDate || !state.selectedTime}
          onClick={() => updateState({ currentStep: 3 })}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Services
        </button>
      </div>
    </div>
  );
};
