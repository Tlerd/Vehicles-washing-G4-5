import React, { useState } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';

const vinawashMenu = {
  wash_combo: {
    title: 'Wash and combo',
    items: [
      { id: 'vw_basic', name: 'VW Basic Wash', price: 180000, duration: '20 mins', detail: 'Includes exterior wash, underbody rinse, vacuuming, and interior wipe-down.' },
      { id: 'vw_detail', name: 'VW Detail Wash', price: 280000, duration: '20 mins', detail: 'A deeper wash for vehicles that need stronger exterior, underbody, and basic interior cleaning.' },
      { id: 'vw_ultimate', name: 'VW Ultimate Wash', price: 640000, duration: '40 mins', detail: 'A comprehensive wash with odor treatment and paint gloss enhancement.' },
      { id: 'exterior_wash', name: 'Exterior wash', price: 90000, duration: '20 mins', detail: 'Basic exterior cleaning.' },
      { id: 'underbody_wash', name: 'Underbody wash', price: 50000, duration: '20 mins', detail: 'High-pressure cleaning for mud and dirt under the vehicle.' }
    ]
  },
  interior: {
    title: 'Interior cleaning',
    items: [
      { id: 'interior_super', name: 'Super Clean interior', price: 1400000, duration: 'Flexible', detail: 'Core deep-clean package for seats, roof liner, dashboard, door panels, vents, odor treatment, and trim conditioning.' },
      { id: 'interior_ultimate', name: 'Ultimate Clean interior', price: 1900000, duration: 'Flexible', detail: 'Premium deep-clean package with seat removal, floor and roof cleaning, vent cleaning, and trim conditioning.' },
      { id: 'interior_plus', name: 'Ultimate Clean Plus interior', price: 2300000, duration: 'Flexible', detail: 'Maximum interior reset for heavy odor, moisture, spills, or flood recovery.' },
      { id: 'seat_spot', name: 'Single-seat spot treatment', price: 350000, duration: 'Flexible', detail: 'Localized stain treatment for one seat position.' },
      { id: 'evaporator_cleaning', name: 'Evaporator camera cleaning', price: 1200000, duration: 'Flexible', detail: 'Air-conditioning evaporator cleaning with inspection camera technology.' }
    ]
  },
  exterior: {
    title: 'Exterior detailing',
    items: [
      { id: 'engine_bay', name: 'Engine bay cleaning', price: 800000, duration: 'Flexible', detail: 'Removes dust, grease, and buildup from the engine bay with hot steam.' },
      { id: 'tar_removal', name: 'Tar removal', price: 400000, duration: 'Flexible', detail: 'Removes road tar from vehicle side panels.' }
    ]
  },
  correction: {
    title: 'Surface correction',
    items: [
      { id: 'polish_basic', name: 'Basic paint polish', price: 1500000, duration: 'Flexible', detail: 'One-step polish with clay treatment and tar adhesive removal. Reduces light swirls by 60-70%.' },
      { id: 'polish_correction', name: 'Corrective paint polish', price: 2200000, duration: 'Flexible', detail: 'Three-step paint correction for deeper defects, fine scratches, and heavy swirls.' }
    ]
  },
  protection: {
    title: 'Protection',
    items: [
      { id: 'ceramic_2', name: 'Pro Coating (2-layer ceramic)', price: 8500000, duration: 'Flexible', detail: 'Durable ceramic coating for paint protection.' },
      { id: 'ppf_dopon', name: 'PPF Dopon Save Protection 7.5 mil', price: 21000000, duration: '7.5 mil', detail: 'Paint protection film against scratches and stone chips.' },
      { id: 'film_3m', name: '3M Crystalline window film', price: 15600000, duration: 'Flexible', detail: 'Premium optical-grade heat rejection film from 3M.' }
    ]
  }
};

export const StepServices: React.FC = () => {
  const { state, updateState, multiplier } = useBooking();
  const [openedCategories, setOpenedCategories] = useState<Record<string, boolean>>({ wash_combo: true });
  const [openedDetails, setOpenedDetails] = useState<Record<string, boolean>>({});

  const toggleCategory = (catKey: string) => {
    setOpenedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const toggleDetails = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenedDetails(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleServiceToggle = (itemId: string) => {
    updateState(prev => {
      const isSelected = prev.selectedServices.includes(itemId);
      const selectedServices = isSelected
        ? prev.selectedServices.filter(id => id !== itemId)
        : [...prev.selectedServices, itemId];
      return { selectedServices };
    });
  };

  const allItems = Object.values(vinawashMenu).flatMap(cat => cat.items);
  const selectedItemsDetails = allItems.filter(item => state.selectedServices.includes(item.id));
  const totalTime = selectedItemsDetails.reduce((sum, item) => {
    const minutes = parseInt(item.duration) || 0;
    return sum + minutes;
  }, 0);
  const totalPrice = selectedItemsDetails.reduce((sum, item) => sum + (item.price * multiplier), 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 py-4">
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Select Care Services</h2>
        <p className="text-slate-555 mb-6">Service prices are automatically adjusted based on selected car size.</p>

        {Object.entries(vinawashMenu).map(([catKey, cat]) => {
          const isCatOpen = !!openedCategories[catKey];
          return (
            <div key={catKey} className="glass-card overflow-hidden">
              <div
                onClick={() => toggleCategory(catKey)}
                className="flex justify-between items-center px-6 py-4 cursor-pointer bg-slate-100/30 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{cat.title}</span>
                  <span className="text-xs bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded-full font-semibold">
                    {cat.items.length} items
                  </span>
                </div>
                {isCatOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>

              {isCatOpen && (
                <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {cat.items.map((item) => {
                    const isSelected = state.selectedServices.includes(item.id);
                    const isDetailOpen = !!openedDetails[item.id];
                    const adjustedPrice = item.price * multiplier;

                    return (
                      <div key={item.id} className="p-4 transition-colors hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => handleServiceToggle(item.id)}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange border-slate-300 dark:border-slate-800 accent-orange-500 mt-1 cursor-pointer"
                            />
                            <div>
                              <span className={`font-semibold text-base ${isSelected ? 'text-brand-orange' : ''}`}>{item.name}</span>
                              <div className="text-xs text-slate-400 dark:text-slate-500 flex gap-2 items-center mt-1">
                                <span>{item.duration}</span>
                                <span>-</span>
                                <span>{cat.title}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <span className="font-bold text-brand-orange">{adjustedPrice.toLocaleString('vi-VN')} VND</span>
                            <button
                              onClick={(e) => toggleDetails(item.id, e)}
                              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-800 flex items-center gap-1"
                            >
                              {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {isDetailOpen && (
                          <div className="mt-3 p-4 bg-amber-500/5 text-amber-950 dark:text-amber-100/90 text-sm border border-amber-500/10 rounded-xl leading-relaxed">
                            {item.detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full md:w-80 shrink-0">
        <div className="glass-card p-6 sticky top-24">
          <h3 className="font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-brand-orange w-5 h-5" /> Booking Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Size multiplier:</span>
              <span className="font-semibold uppercase text-brand-orange">{state.vehicleSize} (x{multiplier})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> {totalTime} mins</span>
            </div>
            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Selected Packages</span>
              {selectedItemsDetails.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No services selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {selectedItemsDetails.map(item => (
                    <span key={item.id} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full block border border-slate-200 dark:border-slate-700">
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 mt-4 flex justify-between items-end">
              <span className="font-bold text-slate-500">Total Price:</span>
              <span className="font-extrabold text-xl text-brand-orange">{totalPrice.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>

          <button
            disabled={selectedItemsDetails.length === 0}
            onClick={() => updateState({ currentStep: 4 })}
            className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Details
          </button>
          <button onClick={() => updateState({ currentStep: 2 })} className="w-full btn-secondary mt-2 text-sm py-2">
            Back to Date & Time
          </button>
        </div>
      </div>
    </div>
  );
};
