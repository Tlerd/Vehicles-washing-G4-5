import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getActivePromotionsForTier } from '../../admin/campaignBuilder';
import { mockStore } from '../../../services/mockStore';
import styles from '../styles/PromotionDisplay.module.css';

export const PromotionDisplay: React.FC = () => {
  const { currentUser } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const promotions = getActivePromotionsForTier(
    mockStore.getPromotions(),
    currentUser?.tier ?? 'Member',
    today,
  );

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
