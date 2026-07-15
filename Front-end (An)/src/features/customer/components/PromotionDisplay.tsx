import React from 'react';
import { MOCK_PROMOTIONS } from '../../../config/constants';
import styles from '../styles/PromotionDisplay.module.css';

export const PromotionDisplay: React.FC = () => {
  return (
    <div className={styles.list}>
      {MOCK_PROMOTIONS.map(promo => (
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
