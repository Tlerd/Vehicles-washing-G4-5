import React from 'react';
import { useBooking, VehicleSize } from '../../../context/BookingContext';
import { Car, Check } from 'lucide-react';

const steps = [
  { number: 1, name: 'Branch' },
  { number: 2, name: 'Date & Time' },
  { number: 3, name: 'Services' },
  { number: 4, name: 'Information' },
  { number: 5, name: 'Confirmation' }
];

export const BookingHeader: React.FC = () => {
  const { state, updateState } = useBooking();

  return (
    <header className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-50 bg-white/70 dark:bg-darkBg/70">
      <div className="flex items-center gap-2">
        <Car className="text-brand-orange w-8 h-8" />
        <span className="text-xl font-bold tracking-tight">AutoWash <span className="text-brand-orange">Pro</span></span>
      </div>

      {/* 5-Step Stepper */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto max-w-full pb-2 md:pb-0">
        {steps.map((s, index) => {
          const isCompleted = state.currentStep > s.number;
          const isActive = state.currentStep === s.number;

          return (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-brand-orange border-brand-orange text-white' :
                  'border-slate-300 dark:border-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-brand-orange font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {s.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-4 md:w-8 h-0.5 ${state.currentStep > s.number ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vehicle Size Selector Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Car Size:</label>
        <select 
          value={state.vehicleSize} 
          onChange={(e) => updateState({ vehicleSize: e.target.value as VehicleSize })}
          className="glass-input py-1 text-sm font-semibold border-slate-300 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="hatchback">Hatchback (x0.9)</option>
          <option value="sedan">Sedan (x1.0)</option>
          <option value="suv">SUV / CUV (x1.2)</option>
          <option value="pickup">Pickup / Luxury (x1.4)</option>
        </select>
      </div>
    </header>
  );
};
