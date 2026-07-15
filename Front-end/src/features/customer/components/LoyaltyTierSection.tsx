import React from 'react';
import { AlertCircle, Award, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { LOYALTY_TIERS } from '../../../config/constants';
import { CustomerTier } from '../../../types';
import styles from '../styles/LoyaltyTierSection.module.css';

interface LoyaltyTierSectionProps {
  currentTier?: CustomerTier;
  currentPoints?: number;
  completedWashes?: number;
  totalSpend?: number;
}

const TIER_REQUIREMENTS: Record<CustomerTier, { washes: number; spend: number }> = {
  Member: { washes: 0, spend: 0 },
  Silver: { washes: 5, spend: 2000000 },
  Gold: { washes: 15, spend: 6000000 },
  Platinum: { washes: 30, spend: 15000000 },
};

export const LoyaltyTierSection: React.FC<LoyaltyTierSectionProps> = ({
  currentTier = 'Member',
  currentPoints = 0,
  completedWashes = 0,
  totalSpend = 0,
}) => {
  let nextTierName = '';
  let washesNeeded = 0;
  let spendNeeded = 0;
  let progressPercent = 0;
  let progressLabel = '';

  if (currentTier === 'Member') {
    nextTierName = 'Silver';
    washesNeeded = Math.max(0, 5 - completedWashes);
    spendNeeded = Math.max(0, 2000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 5) * 100);
    progressLabel = `${completedWashes}/5 washes`;
  } else if (currentTier === 'Silver') {
    nextTierName = 'Gold';
    washesNeeded = Math.max(0, 15 - completedWashes);
    spendNeeded = Math.max(0, 6000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 15) * 100);
    progressLabel = `${completedWashes}/15 washes`;
  } else if (currentTier === 'Gold') {
    nextTierName = 'Platinum';
    washesNeeded = Math.max(0, 30 - completedWashes);
    spendNeeded = Math.max(0, 15000000 - totalSpend);
    progressPercent = Math.min(100, (completedWashes / 30) * 100);
    progressLabel = `${completedWashes}/30 washes`;
  } else {
    progressPercent = 100;
    progressLabel = 'Highest tier unlocked';
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Loyalty overview</span>
          <h3 className={styles.title}>
            <Award size={20} />
            Loyalty tier system
          </h3>
          <p className={styles.subtitle}>Track tier progress and the benefits currently unlocked.</p>
        </div>
        <div className={styles.pointsBadge}>{currentPoints.toLocaleString('vi-VN')} pts</div>
      </div>

      <section className={styles.progressCard}>
        <div className={styles.progressTop}>
          <div>
            <span className={styles.progressLabel}>Current tier</span>
            <h4>{currentTier}</h4>
          </div>
          <div className={styles.progressBadge}>
            <ShieldCheck size={16} />
            <span>{Math.round(progressPercent)}%</span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className={styles.progressMeta}>
          <span>{progressLabel}</span>
          <span>{nextTierName ? `Next: ${nextTierName}` : 'Max tier reached'}</span>
        </div>

        {nextTierName ? (
          <div className={styles.progressNotice}>
            <Sparkles size={16} />
            <span>
              <strong>{washesNeeded}</strong> washes or <strong>{spendNeeded.toLocaleString('vi-VN')} VND</strong>{' '}
              in spend left to reach <strong>{nextTierName}</strong>.
            </span>
          </div>
        ) : (
          <div className={styles.progressNotice}>
            <Sparkles size={16} />
            <span>You have reached the highest tier and unlocked every premium benefit.</span>
          </div>
        )}

        <div className={styles.expiringNote}>
          <AlertCircle size={15} />
          <span>Use reward points before making larger voucher redemptions.</span>
        </div>
      </section>

      <div className={styles.tierGrid}>
        {LOYALTY_TIERS.map((tier) => {
          const isCurrent = tier.name === currentTier;
          const requirement = TIER_REQUIREMENTS[tier.name];
          const washesRemaining = Math.max(0, requirement.washes - completedWashes);
          const spendRemaining = Math.max(0, requirement.spend - totalSpend);
          const isEligible =
            requirement.washes === 0 ||
            completedWashes >= requirement.washes ||
            totalSpend >= requirement.spend;

          return (
            <article
              key={tier.name}
              className={`${styles.tierCard} ${isCurrent ? styles.tierCardActive : ''}`}
            >
              <div className={styles.tierCardTop}>
                <div>
                  <span className={styles.tierName}>{tier.name}</span>
                  <p className={styles.tierRequirement}>
                    {requirement.washes === 0
                      ? 'Starting tier for every customer'
                      : `${requirement.washes} washes or ${requirement.spend.toLocaleString('vi-VN')} VND total spend`}
                  </p>
                </div>
                {isCurrent && <span className={styles.currentTag}>Current</span>}
              </div>

              <div className={styles.tierMetrics}>
                <div>
                  <span>Points multiplier</span>
                  <strong>x{tier.multiplier.toFixed(1)}</strong>
                </div>
                <div>
                  <span>Booking window</span>
                  <strong>Any future date</strong>
                </div>
              </div>

              <div className={styles.tierFooter}>
                <span>
                  {requirement.washes === 0
                    ? 'Ready to use'
                    : isCurrent
                      ? 'Current benefits active'
                      : isEligible
                        ? 'Eligibility reached'
                        : `${washesRemaining} washes or ${spendRemaining.toLocaleString('vi-VN')} VND more`}
                </span>
                <ChevronRight size={16} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
