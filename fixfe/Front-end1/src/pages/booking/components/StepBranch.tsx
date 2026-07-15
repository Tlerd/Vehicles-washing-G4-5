import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import { MapPin, Clock } from 'lucide-react';

const branches = [
  { id: 'b1', name: 'VinaWash District 1', hours: '8:00 AM - 8:00 PM', address: '123 Nguyen Hue, Ben Nghe, D1' },
  { id: 'b2', name: 'VinaWash District 7', hours: '8:00 AM - 8:00 PM', address: '456 Nguyen Van Linh, Tan Phong, D7' }
];

export const StepBranch: React.FC = () => {
  const { state, updateState } = useBooking();

  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-2 text-center">Select Location Branch</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Choose the wash branch closest to you.</p>

      <div className="space-y-4">
        {branches.map((b) => {
          const isSelected = state.branchId === b.id;
          return (
            <div 
              key={b.id}
              onClick={() => updateState({ branchId: b.id })}
              className={`glass-card p-6 cursor-pointer border-2 transition-all flex justify-between items-start ${
                isSelected ? 'border-brand-orange ring-1 ring-brand-orange bg-orange-50/5 dark:bg-orange-500/5' : 'border-transparent'
              }`}
            >
              <div className="flex gap-4">
                <MapPin className={`w-6 h-6 mt-1 ${isSelected ? 'text-brand-orange' : 'text-slate-400'}`} />
                <div>
                  <h3 className="font-bold text-lg">{b.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{b.address}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.hours}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                Available Slots
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button 
          disabled={!state.branchId}
          onClick={() => updateState({ currentStep: 2 })}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Schedule
        </button>
      </div>
    </div>
  );
};
