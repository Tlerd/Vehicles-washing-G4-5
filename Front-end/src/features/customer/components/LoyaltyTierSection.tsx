import React from 'react';
import { LOYALTY_TIERS } from '../../../config/constants';
import { CustomerTier } from '../../../types';
import { AlertCircle, Award, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import styles from '../styles/LoyaltyTierSection.module.css';

interface LoyaltyTierSectionProps {
  currentTier?: CustomerTier;
  currentPoints?: number;
  completedWashes?: number;
  totalSpend?: number;
  expiringPoints?: number;
}

export const LoyaltyTierSection: React.FC<LoyaltyTierSectionProps> = ({ 
  currentTier = 'Member', 
  currentPoints = 0,
  completedWashes = 2,
  totalSpend = 1280000,
  expiringPoints = 0,
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
          <p className={styles.subtitle}>Theo dõi hành trình nâng hạng và các quyền lợi bạn đang mở khóa.</p>
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
              Còn <strong>{washesNeeded}</strong> lượt rửa hoặc <strong>{spendNeeded.toLocaleString('vi-VN')} VND</strong>{' '}
              chi tiêu để lên hạng <strong>{nextTierName}</strong>.
            </span>
          </div>
        ) : (
          <div className={styles.progressNotice}>
            <Sparkles size={16} />
            <span>Bạn đã đạt hạng cao nhất và đang tận hưởng toàn bộ quyền lợi premium.</span>
          </div>
        )}

        <div className={styles.expiringNote}>
          <AlertCircle size={15} />
          <span>Lưu ý: Bạn có <strong>{expiringPoints.toLocaleString('vi-VN')} điểm sẽ hết hạn vào tháng tới</strong>. Điểm thưởng có giá trị 12 tháng kể từ ngày tích lũy.</span>
        </div>
      </section>

      <div className={styles.tierGrid}>
        {LOYALTY_TIERS.map((tier) => {
          const isCurrent = tier.name === currentTier;
          const pointsRemaining = Math.max(0, tier.requiredPoints - currentPoints);

          return (
            <article
              key={tier.name}
              className={`${styles.tierCard} ${isCurrent ? styles.tierCardActive : ''}`}
            >
              <div className={styles.tierCardTop}>
                <div>
                  <span className={styles.tierName}>{tier.name}</span>
                  <p className={styles.tierRequirement}>
                    {tier.requiredPoints === 0
                      ? 'Cấp khởi đầu cho mọi khách hàng'
                      : `${tier.requiredPoints.toLocaleString('vi-VN')} điểm để đạt`}
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
                  <span>Booking advance</span>
                  <strong>{tier.bookingAdvanceLimit} ngày</strong>
                </div>
              </div>

              <div className={styles.tierFooter}>
                <span>
                  {tier.requiredPoints === 0
                    ? 'Sẵn sàng sử dụng'
                    : pointsRemaining > 0
                      ? `Cần thêm ${pointsRemaining.toLocaleString('vi-VN')} điểm`
                      : 'Đủ điều kiện nâng hạng'}
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
