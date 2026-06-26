import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { useBooking } from '../../../context/BookingContext';
import { SERVICES, LOYALTY_TIERS, CAR_TYPES } from '../../../config/constants';
import { priceService } from '../../../services/customer/price.service';
import { ServiceItem } from '../../../types';
import { ChevronDown } from 'lucide-react';
import styles from '../styles/StepServices.module.css';

export const StepServices: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const { vouchers } = useBooking();
  
  const userVouchers = vouchers.filter(v => v.customerId === currentUser?.id && v.status === 'active');
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Wash & Combo': true, // Open by default
  });
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const carTypeObj = CAR_TYPES.find(c => c.id === draft.carSize);
  const kh = carTypeObj?.multiplier || 1.0;
  const kkm = 1.0; // Promotion multiplier default to 1.0

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
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
                <p style={{ margin: 0, paddingLeft: '1.25rem' }}>{service.suitableFor}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate panel values
  const totalBasePrice = priceService.calculateBasePrice(draft.selectedServices);
  const totalSelectedPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
  const estimatedPoints = Math.floor((totalBasePrice / 1000) * kh * kkm);

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>Service Selection</h3>
        <p className={styles.subtitle}>Choose one or multiple services for your vehicle</p>
      </div>

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

      {currentUser && userVouchers.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(30, 41, 59, 1)', borderRadius: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>Apply Voucher</h4>
          <select 
            value={draft.appliedVoucherId || ''} 
            onChange={e => updateDraft({ appliedVoucherId: e.target.value || undefined })}
            style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem', color: '#e2e8f0', outline: 'none' }}
          >
            <option value="">-- No Voucher Selected --</option>
            {userVouchers.map(v => (
              <option key={v.id} value={v.id}>{v.title} ({v.code})</option>
            ))}
          </select>
        </div>
      )}

      {/* Points Summary Sticky Panel */}
      <div className={styles.pointsPanel}>
        <div className={styles.pointsSummary}>
          <span className={styles.pointsLabel}>
            {draft.selectedServices.length} {draft.selectedServices.length === 1 ? 'service' : 'services'} selected
          </span>
          {currentUser && (
            <div className={styles.pointsFormula}>
              <span>Kh: {kh}x</span>
              <span>Kkm: {kkm}x</span>
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div className={styles.pointsTotalRow}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {priceService.formatPrice(totalSelectedPrice)}
            </span>
          </div>
          {currentUser && (
            <div className={styles.pointsValue}>
              ⭐ {estimatedPoints} <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>pts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
