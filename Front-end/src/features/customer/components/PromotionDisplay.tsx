import React from 'react';
import { mockStore } from '../../../services/mockStore';
import styles from '../styles/PromotionDisplay.module.css';

export const PromotionDisplay: React.FC = () => {
  const promotions = mockStore.getPromotions();

  if (promotions.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '32px 20px', 
        color: '#64748b', 
        fontSize: '14px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px dashed #e2e8f0'
      }}>
        No active promotions at this time.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {promotions.map(promo => (
        <div
          key={promo.id}
          className={styles.card}
          style={{ background: promo.bgGradient }}
        >
          <span className={styles.cardIcon}>{promo.icon}</span>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{promo.title}</div>
            <div className={styles.cardDesc}>{promo.description}</div>
          </div>
          <span className={styles.cardBadge}>{promo.discount}</span>
        </div>
      ))}
    </div>
  );
};
