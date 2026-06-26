import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { SERVICES, LOYALTY_TIERS } from '../../../config/constants';
import { priceService } from '../../../services/customer/price.service';
import { Modal } from '../../../components/Modal/Modal';
import { ServiceItem } from '../../../types';
import styles from '../styles/StepServices.module.css';

export const StepServices: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);

  const tierMultiplier = LOYALTY_TIERS.find(t => t.name === currentUser?.tier)?.multiplier || 1.0;

  const comboServices = SERVICES.filter(s => s.category === 'combo');
  const singleServices = SERVICES.filter(s => s.category === 'single');

  const toggleService = (serviceId: string) => {
    const current = draft.selectedServices;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    updateDraft({ selectedServices: updated });
  };

  const renderServiceCard = (service: ServiceItem) => {
    const isSelected = draft.selectedServices.includes(service.id);
    const servicePrice = priceService.calculateFinalPrice([service.id], draft.carSize);
    const points = Math.floor((servicePrice / 1000) * tierMultiplier);

    return (
      <div
        key={service.id}
        className={`${styles.serviceCard} ${isSelected ? styles.serviceCardSelected : ''} ${service.isPremium ? styles.serviceCardPremium : ''}`}
        onClick={() => toggleService(service.id)}
      >
        <div className={styles.serviceHeader}>
          <span className={styles.serviceIcon}>{service.icon}</span>
          {service.isPremium && <span className={styles.premiumBadge}>PREMIUM</span>}
        </div>
        <div className={styles.serviceInfo}>
          <div className={styles.serviceName}>{service.name}</div>
          <div className={styles.serviceDesc}>{service.description}</div>
          <div className={styles.servicePoints}>
            <span className={styles.pointsIcon}>⭐</span>
            Bạn sẽ nhận: {points} điểm (Hệ số: x{tierMultiplier.toFixed(1)})
          </div>
          <div className={styles.serviceMeta}>
            <span className={styles.servicePrice}>{priceService.formatPrice(servicePrice)}</span>
            <span className={styles.serviceDuration}>{service.duration} phút</span>
            <button
              className={styles.detailBtn}
              onClick={(e) => { e.stopPropagation(); setDetailService(service); }}
            >
              Xem chi tiết
            </button>
          </div>
        </div>
        <div className={`${styles.serviceCheck} ${isSelected ? styles.serviceCheckActive : ''}`}>
          {isSelected ? '✓' : ''}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Chọn dịch vụ</h3>
      <p className={styles.subtitle}>Chọn một hoặc nhiều dịch vụ cho xe của bạn</p>

      <div className={styles.categoryLabel}>
        ✨ Combo Dịch vụ
        <span className={styles.categoryDivider} />
      </div>
      <div className={styles.grid}>
        {comboServices.map(renderServiceCard)}
      </div>

      <div className={styles.categoryLabel}>
        🔧 Dịch vụ lẻ
        <span className={styles.categoryDivider} />
      </div>
      <div className={styles.grid}>
        {singleServices.map(renderServiceCard)}
      </div>

      {draft.selectedServices.length > 0 && (
        <div className={styles.totalPointsSummary}>
          <span className={styles.totalLabel}>Tổng điểm dự kiến:</span>
          <span className={styles.totalValue}>
            ⭐ {Math.floor((priceService.calculateFinalPrice(draft.selectedServices, draft.carSize) / 1000) * tierMultiplier)} điểm
          </span>
        </div>
      )}

      {/* Service Detail Modal */}
      <Modal
        isOpen={!!detailService}
        onClose={() => setDetailService(null)}
        title={detailService?.name || ''}
        size="md"
      >
        {detailService && (
          <div>
            <div className={styles.modalBody}>
              <p>{detailService.description}</p>
              
              {detailService.includes && detailService.includes.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Bao gồm gì</div>
                  <ul className={styles.detailList}>
                    {detailService.includes.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {detailService.suitableFor && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Phù hợp với ai</div>
                  <p className={styles.detailText}>{detailService.suitableFor}</p>
                </div>
              )}
              
              {detailService.benefits && detailService.benefits.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Lợi ích</div>
                  <ul className={styles.detailList}>
                    {detailService.benefits.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className={styles.modalMeta}>
              <span className={styles.modalPrice}>
                {priceService.formatPrice(priceService.calculateFinalPrice([detailService.id], draft.carSize))}
              </span>
              <span className={styles.modalDuration}>
                ⏱ {detailService.duration} phút
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
