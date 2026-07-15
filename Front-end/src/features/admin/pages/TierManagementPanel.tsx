import { LockKeyhole, Sparkles } from 'lucide-react';
import styles from './TierManagementPanel.module.css';

type TierTone = 'Member' | 'Silver' | 'Gold' | 'Platinum';

interface TierConfig {
  name: TierTone;
  pointMultiplier: number;
  washesRequired: number;
  spendRequired: string;
  helperText: string;
  status: string;
}

const tierConfigs: TierConfig[] = [
  { name: 'Member', pointMultiplier: 1, washesRequired: 0, spendRequired: '0', helperText: 'Baseline experience for every newly registered customer.', status: 'Default tier' },
  { name: 'Silver', pointMultiplier: 1.1, washesRequired: 5, spendRequired: '2,000,000', helperText: 'Reference threshold for early-repeat customers.', status: 'Reference only' },
  { name: 'Gold', pointMultiplier: 1.2, washesRequired: 15, spendRequired: '6,000,000', helperText: 'Reference threshold for higher-value loyal customers.', status: 'Reference only' },
  { name: 'Platinum', pointMultiplier: 1.3, washesRequired: 30, spendRequired: '15,000,000', helperText: 'Reference threshold for the top loyalty tier.', status: 'Reference only' },
];

const tierCardClassName: Record<TierTone, string> = {
  Member: styles.memberCard,
  Silver: styles.silverCard,
  Gold: styles.goldCard,
  Platinum: styles.platinumCard,
};
const tierBadgeClassName: Record<TierTone, string> = {
  Member: styles.tierMember,
  Silver: styles.tierSilver,
  Gold: styles.tierGold,
  Platinum: styles.tierPlatinum,
};
const tierGlowClassName: Record<TierTone, string> = {
  Member: styles.memberGlow,
  Silver: styles.silverGlow,
  Gold: styles.goldGlow,
  Platinum: styles.platinumGlow,
};

export function TierManagementPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.apiNotice} role="status">
        <LockKeyhole size={17} aria-hidden="true" />
        <div>
          <strong>Read-only: Tier management API is not available.</strong>
          <span>The Back-end has no admin endpoint to load or save tier rules. Values below are clearly marked UI references and cannot be changed.</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.headerContent}>
          <span className={styles.kicker}>Loyalty program</span>
          <div className={styles.titleRow}>
            <h2>Loyalty Tier Configuration</h2>
            <p>Review the intended premium configuration surface while server-side tier administration remains unavailable.</p>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>4 reference tiers</span>
            <span className={styles.metaPill}><Sparkles size={14} aria-hidden="true" />Premium card layout</span>
          </div>
        </div>

        <button className={styles.saveButton} type="button" disabled title="No Back-end tier management API">
          <LockKeyhole size={16} aria-hidden="true" />
          Save unavailable
        </button>
      </div>

      <div className={styles.tierGrid}>
        {tierConfigs.map(tier => (
          <article key={tier.name} className={`${styles.tierCard} ${tierCardClassName[tier.name]}`}>
            <div className={`${styles.cardGlow} ${tierGlowClassName[tier.name]}`} aria-hidden="true" />
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderText}>
                <span className={`${styles.tierBadge} ${tierBadgeClassName[tier.name]}`}>{tier.name}</span>
                <h3>{tier.name}</h3>
                <p>{tier.helperText}</p>
              </div>
              <span className={styles.metaPill}>{tier.status}</span>
            </div>
            <div className={styles.cardMetric}><strong>{tier.pointMultiplier.toFixed(1)}x</strong><span>Point multiplier</span></div>
            <div className={styles.fieldStack}>
              <label className={styles.field}>Point Multiplier (Kh)<input type="number" step="0.1" value={tier.pointMultiplier} disabled readOnly /></label>
              <label className={styles.field}>Washes Required<input type="number" value={tier.washesRequired} disabled readOnly /></label>
              <label className={styles.field}>Spend Required (VND)<input type="text" value={tier.spendRequired} disabled readOnly /></label>
            </div>
            <div className={styles.cardFooter}><LockKeyhole size={14} aria-hidden="true" />Reference display only; no value will be submitted.</div>
          </article>
        ))}
      </div>
    </section>
  );
}
