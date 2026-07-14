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
        <h3 className={styles.title}>🏆 Loyalty Tier System</h3>
        <p className={styles.subtitle}>Earn points to unlock exclusive privileges</p>
      </div>

      <div className={styles.grid}>
        {LOYALTY_TIERS.map(tier => {
          const isCurrent = tier.name === currentTier;
          const pointsRemaining = Math.max(0, tier.requiredPoints - currentPoints);

          return (
            <div key={tier.name} className={`${styles.card} ${isCurrent ? styles.currentCard : ''}`}>
              {isCurrent && <div className={styles.badge}>Current tier</div>}
              <div className={styles.tierName}>{tier.name}</div>
              
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Points multiplier:</span>
                  <span className={styles.infoValue}>x{tier.multiplier.toFixed(1)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Booking advance:</span>
                  <span className={styles.infoValue}>{tier.bookingAdvanceLimit} days</span>
                </div>
              </div>

              <div className={styles.requirement}>
                {tier.requiredPoints === 0 ? (
                  <span className={styles.reqAchieved}>Default</span>
                ) : isCurrent ? (
                  <span className={styles.reqAchieved}>Achieved ({tier.requiredPoints} points)</span>
                ) : pointsRemaining > 0 ? (
                  <span className={styles.reqPending}>Need {pointsRemaining} more points</span>
                ) : (
                  <span className={styles.reqAchieved}>Eligible for upgrade</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
