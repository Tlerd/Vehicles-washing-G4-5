import React from 'react';
import { LOYALTY_TIERS } from '../../../config/constants';
import { CustomerTier } from '../../../types';
import styles from '../styles/LoyaltyTierSection.module.css';

interface LoyaltyTierSectionProps {
  currentTier?: CustomerTier;
  currentPoints?: number;
}

export const LoyaltyTierSection: React.FC<LoyaltyTierSectionProps> = ({ currentTier = 'Member', currentPoints = 0 }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>🏆 Hệ Thống Hạng Thành Viên</h3>
        <p className={styles.subtitle}>Tích luỹ điểm để nhận thêm nhiều đặc quyền hấp dẫn</p>
      </div>

      <div className={styles.grid}>
        {LOYALTY_TIERS.map(tier => {
          const isCurrent = tier.name === currentTier;
          const pointsRemaining = Math.max(0, tier.requiredPoints - currentPoints);

          return (
            <div key={tier.name} className={`${styles.card} ${isCurrent ? styles.currentCard : ''}`}>
              {isCurrent && <div className={styles.badge}>Hạng hiện tại</div>}
              <div className={styles.tierName}>{tier.name}</div>
              
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Hệ số điểm:</span>
                  <span className={styles.infoValue}>x{tier.multiplier.toFixed(1)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Đặt lịch trước:</span>
                  <span className={styles.infoValue}>{tier.bookingAdvanceLimit} ngày</span>
                </div>
              </div>

              <div className={styles.requirement}>
                {tier.requiredPoints === 0 ? (
                  <span className={styles.reqAchieved}>Mặc định</span>
                ) : isCurrent ? (
                  <span className={styles.reqAchieved}>Đã đạt ({tier.requiredPoints} điểm)</span>
                ) : pointsRemaining > 0 ? (
                  <span className={styles.reqPending}>Cần thêm {pointsRemaining} điểm</span>
                ) : (
                  <span className={styles.reqAchieved}>Đã đủ điều kiện nâng hạng</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
