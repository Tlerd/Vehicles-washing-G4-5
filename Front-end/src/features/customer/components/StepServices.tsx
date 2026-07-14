import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { SERVICES, LOYALTY_TIERS, CAR_TYPES } from '../../../config/constants';
import { priceService } from '../../../services/customer/price.service';
import { ServiceItem } from '../../../types';
import { ChevronDown, ShoppingCart, X } from 'lucide-react';
import styles from '../styles/StepServices.module.css';

export const StepServices: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Wash & Combo': true, // Open by default
  });
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const carTypeObj = CAR_TYPES.find(c => c.id === draft.carSize);
  
  // FR-006: Promotion and Tier Multipliers for points calculation
  const Kh = LOYALTY_TIERS.find(t => t.name === currentUser?.tier)?.multiplier || 1.0;
  const Kkm = 1.0; // Default active promotional multiplier

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleDetails = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDetails(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  const toggleService = (serviceId: string) => {
    const current = draft.selectedServices;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    updateDraft({ selectedServices: updated });
  };

  const groupedServices = () => {
    const groups: Record<string, ServiceItem[]> = {};

    SERVICES.forEach(s => {
      const groupName = s.group || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(s);
    });

    // Sort to match requested order if possible, or leave as dynamically inserted
    const order = ['Wash & Combo', 'Interior Cleaning', 'Exterior Cleaning', 'Surface Correction', 'Protection', 'Other'];
    return Object.entries(groups).sort(([a], [b]) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  };

  const renderServiceCard = (service: ServiceItem) => {
    const isSelected = draft.selectedServices.includes(service.id);
    const isExpanded = expandedDetails[service.id];
    const servicePrice = priceService.calculateFinalPrice([service.id], draft.carSize);

    return (
      <div
        key={service.id}
        className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${service.isPremium ? styles.cardPremium : ''}`}
        onClick={() => toggleService(service.id)}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <span className={styles.cardIcon}>{service.icon}</span>
            <div>
              <div className={styles.cardName}>
                {service.name}
                {service.isPremium && <span className={styles.premiumBadge}>PREMIUM</span>}
              </div>
              <div className={styles.cardMeta}>
                {service.duration} min &middot; {service.category === 'combo' ? 'Wash & Combo' : 'Single Service'}
              </div>
              <button
                className={styles.toggleDetailsBtn}
                onClick={(e) => toggleDetails(service.id, e)}
              >
                {isExpanded ? 'Hide details' : 'View details'}
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={styles.cardPrice}>{priceService.formatPrice(servicePrice)}</span>
            <div className={`${styles.cardCheck} ${isSelected ? (service.isPremium ? styles.cardCheckPremium : styles.cardCheckSelected) : ''}`}>
              {isSelected ? '✓' : ''}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.cardExpanded} onClick={(e) => e.stopPropagation()}>
            <p style={{ margin: 0 }}>{service.description}</p>

            {service.includes && service.includes.length > 0 && (
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Includes:</div>
                <ul className={styles.detailList}>
                  {service.includes.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            )}

            {service.suitableFor && (
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Best for:</div>
                <p className="m-0 pl-5">{service.suitableFor}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate panel values
  const V = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
  const estimatedPoints = Math.floor((V / 1000) * Kh * Kkm);

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-24">
      {/* Services List */}
      <div className="w-full">
        <header className="mb-6">
          <h3 className={styles.title}>Service Selection</h3>
          <p className={styles.subtitle}>Choose one or multiple services for your vehicle</p>
        </header>

        <div>
          {groupedServices().map(([groupName, items]) => {
            const isOpen = expandedGroups[groupName];
            return (
              <div key={groupName} className={styles.group}>
                <div className={styles.groupHeader} onClick={() => toggleGroup(groupName)}>
                  <div className={styles.groupTitle}>
                    {groupName}
                    <span className={styles.groupCount}>{items.length} services</span>
                  </div>
                  <ChevronDown
                    className={`${styles.groupIcon} ${isOpen ? styles.groupIconOpen : ''}`}
                    size={20}
                  />
                </div>

                {isOpen && (
                  <div className={styles.groupContent}>
                    {items.map(renderServiceCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Floating Cart Button */}
      {!isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-blue-500 transition-all z-50 group border border-blue-400"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            {draft.selectedServices.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600">
                {draft.selectedServices.length}
              </span>
            )}
          </div>
          <span className="font-bold pr-2 hidden sm:inline">
            {priceService.formatPrice(V)}
          </span>
        </button>
      )}

      {/* Floating Cart Panel Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <aside className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-blue-600" />
                Cart Summary
              </h4>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  {draft.selectedServices.length} {draft.selectedServices.length === 1 ? 'service' : 'services'} selected
                </span>
                <ul className="space-y-3">
                  {draft.selectedServices.map(id => {
                    const s = SERVICES.find(srv => srv.id === id);
                    if (!s) return null;
                    const sp = priceService.calculateFinalPrice([id], draft.carSize);
                    return (
                      <li key={id} className="flex justify-between text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">{s.name}</span>
                        <span className="font-bold text-slate-900">{priceService.formatPrice(sp)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex justify-between items-end py-4 border-y border-slate-100 mb-6">
                <span className="text-sm font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Total Amount:</span>
                <span className="text-2xl font-black text-blue-600">
                  {priceService.formatPrice(V)}
                </span>
              </div>

              {currentUser && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-2">
                  <div className="text-sm font-bold text-emerald-800">Expected Points (FR-006)</div>
                  
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/50 px-2.5 py-1.5 rounded-md border border-emerald-200 w-fit">
                    <span>Loyalty (K_h): {Kh}x</span>
                    <span>&bull;</span>
                    <span>Promo (K_km): {Kkm}x</span>
                  </div>
                  
                  <div className="text-lg font-black text-amber-500 flex items-center gap-1.5 mt-1">
                    ⭐ {estimatedPoints} <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">pts</span>
                  </div>
                  
                  <div className="text-[10px] text-emerald-600/70 font-mono mt-1">
                    Formula: ⌊Total / 1,000⌋ × {Kh} × {Kkm}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm uppercase tracking-wider"
              >
                Continue Booking
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
