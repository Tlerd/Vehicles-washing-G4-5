import React, { useEffect, useState } from 'react';
import { platformService } from '../../../services/platform.service';
import styles from '../styles/PromotionDisplay.module.css';

export const PromotionDisplay: React.FC = () => {
  const [promotions,setPromotions]=useState<Array<Record<string,unknown>>>([]);useEffect(()=>{platformService.campaigns().then(setPromotions)},[]);
  return (
    <div className={styles.list}>
      {promotions.map(promo => (
        <div
          key={String(promo.promotionId)}
          className={styles.card}
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
        >
          <span className={styles.cardIcon}>🎉</span>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{String(promo.promotionName)}</div>
            <div className={styles.cardDesc}>{String(promo.description)}</div>
          </div>
          <span className={styles.cardBadge}>×{String(promo.discountPercent)} points</span>
        </div>
      ))}
    </div>
  );
};
