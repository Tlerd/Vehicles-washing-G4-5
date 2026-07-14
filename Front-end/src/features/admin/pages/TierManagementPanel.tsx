import { Check, Sparkles } from 'lucide-react';
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
  {
    name: 'Member',
    pointMultiplier: 1.0,
    washesRequired: 0,
    spendRequired: '0',
    helperText: 'Baseline experience for every newly registered customer.',
    status: 'Default tier',
  },
  {
    name: 'Silver',
    pointMultiplier: 1.1,
    washesRequired: 5,
    spendRequired: '2,000,000',
    helperText: 'Designed for early-repeat customers and starter loyalty uplift.',
    status: 'Upgrade threshold',
  },
  {
    name: 'Gold',
    pointMultiplier: 1.2,
    washesRequired: 15,
    spendRequired: '6,000,000',
    helperText: 'Balanced premium tier for loyal customers with higher ticket value.',
    status: 'High-value tier',
  },
  {
    name: 'Platinum',
    pointMultiplier: 1.3,
    washesRequired: 30,
    spendRequired: '15,000,000',
    helperText: 'Top program tier with the strongest retention and reward multiplier.',
    status: 'VIP tier',
  },
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
      <div className={styles.toolbar}>
        <div className={styles.headerContent}>
          <span className={styles.kicker}>Loyalty program</span>
          <div className={styles.titleRow}>
            <h2>Loyalty Tier Configuration</h2>
            <p>Configure multiplier rates and upgrade thresholds with the same premium controls used across the Admin portal.</p>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>4 active tiers</span>
            <span className={styles.metaPill}>
              <Sparkles size={14} aria-hidden="true" />
              Bright card-based layout
            </span>
          </div>
        </div>

        <button className={styles.saveButton} type="button">
          <Check size={16} aria-hidden="true" />
          Save configuration
        </button>
      </div>

      <div className={styles.tierGrid}>
        {tierConfigs.map(tier => {
          const isDefaultTier = tier.name === 'Member';

          return (
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

              <div className={styles.cardMetric}>
                <strong>{tier.pointMultiplier.toFixed(1)}x</strong>
                <span>Point multiplier</span>
              </div>

              <div className={styles.fieldStack}>
                <label className={styles.field}>
                  Point Multiplier (Kh)
                  <input type="number" step="0.1" defaultValue={tier.pointMultiplier} />
                </label>
                <label className={styles.field}>
                  Washes Required
                  <input type="number" defaultValue={tier.washesRequired} disabled={isDefaultTier} />
                </label>
                <label className={styles.field}>
                  Spend Required (VND)
                  <input type="text" defaultValue={tier.spendRequired} disabled={isDefaultTier} />
                </label>
              </div>

              <div className={styles.cardFooter}>
                <Sparkles size={14} aria-hidden="true" />
                {isDefaultTier ? 'Default members start here before any upgrade threshold applies.' : 'Thresholds can be tuned independently for washes and spending.'}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
