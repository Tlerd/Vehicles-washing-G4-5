import React from 'react';
import styles from '../styles/PromotionDisplay.module.css';

export const PromotionDisplay: React.FC = () => (
  <div className={styles.list}>
    <div
      className={styles.card}
      style={{ background: 'linear-gradient(135deg, #0f766e, #0f172a)' }}
      role="status"
    >
      <span className={styles.cardIcon} aria-hidden="true">✦</span>
      <div className={styles.cardContent}>
        <div className={styles.cardTitle}>Customer promotion feed is not connected yet</div>
        <div className={styles.cardDesc}>
          The backend only exposes promotions through an admin-protected endpoint. A customer promotion API is required.
        </div>
      </div>
      <span className={styles.cardBadge}>API required</span>
    </div>
  </div>
);
