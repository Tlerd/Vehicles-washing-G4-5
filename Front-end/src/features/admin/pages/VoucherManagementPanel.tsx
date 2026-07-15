import { Edit, Gift, LockKeyhole, Plus, Sparkles, Trash2 } from 'lucide-react';
import styles from './VoucherManagementPanel.module.css';

type VoucherType = 'discount_50k' | 'free_basic' | 'free_detail';
interface VoucherReference {
  id: string;
  type: VoucherType;
  title: string;
  pointsCost: number;
  description: string;
}

const voucherReferences: VoucherReference[] = [
  { id: 'reference-discount', type: 'discount_50k', title: '50k Discount Voucher', pointsCost: 500, description: 'Client-side reference for the supported DISCOUNT_50K redemption type.' },
  { id: 'reference-basic', type: 'free_basic', title: '100k Discount Voucher', pointsCost: 1200, description: 'Client-side reference for FREE_BASIC, which the Back-end applies as a 100,000 VND discount.' },
  { id: 'reference-detail', type: 'free_detail', title: '250k Discount Voucher', pointsCost: 2400, description: 'Client-side reference for FREE_DETAIL, which the Back-end applies as a 250,000 VND discount.' },
];

const voucherTypeLabel: Record<VoucherType, string> = {
  discount_50k: '50k Discount',
  free_basic: '100k Discount',
  free_detail: '250k Discount',
};
const voucherTypeDetail: Record<VoucherType, string> = {
  discount_50k: 'Direct bill discount redemption type.',
  free_basic: 'Back-end discount amount: 100,000 VND.',
  free_detail: 'Back-end discount amount: 250,000 VND.',
};
const voucherTypeClassName: Record<VoucherType, string> = {
  discount_50k: styles.typeDiscount,
  free_basic: styles.typeBasic,
  free_detail: styles.typeDetail,
};

export function VoucherManagementPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.apiNotice} role="status">
        <LockKeyhole size={17} aria-hidden="true" />
        <div>
          <strong>Read-only: Voucher catalog management API is not available.</strong>
          <span>The Back-end exposes customer voucher redemption and owned-voucher endpoints, but no admin catalog list/create/update/delete API. Actions below are disabled and nothing is saved.</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.headerBlock}>
          <span className={styles.kicker}>Rewards catalog</span>
          <div className={styles.titleRow}>
            <h1>Voucher Management</h1>
            <p>Preview the intended premium reward catalog surface while admin-side persistence remains unavailable.</p>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}><Gift size={14} aria-hidden="true" />{voucherReferences.length} UI references</span>
            <span className={styles.metaPill}><Sparkles size={14} aria-hidden="true" />Not loaded from an admin API</span>
          </div>
        </div>
        <button className={styles.primaryButton} type="button" disabled title="No Back-end voucher catalog API"><Plus size={18} aria-hidden="true" />Add unavailable</button>
      </div>

      <div className={styles.content}>
        <div className={styles.referenceLabel}><LockKeyhole size={14} aria-hidden="true" />Reference-only cards — these are not persisted catalog records.</div>
        <div className={styles.cardGrid}>
          {voucherReferences.map(voucher => (
            <article key={voucher.id} className={styles.voucherCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderMain}>
                  <span className={`${styles.typeBadge} ${voucherTypeClassName[voucher.type]}`}>{voucherTypeLabel[voucher.type]}</span>
                  <div className={styles.cardMeta}>{voucherTypeDetail[voucher.type]}</div>
                </div>
                <div className={styles.actionRow}>
                  <button className={styles.iconButton} type="button" disabled aria-label={`Editing ${voucher.title} is unavailable`}><Edit size={16} aria-hidden="true" /></button>
                  <button className={`${styles.iconButton} ${styles.dangerButton}`} type="button" disabled aria-label={`Deleting ${voucher.title} is unavailable`}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              </div>
              <div><h3 className={styles.cardTitle}>{voucher.title}</h3><p className={styles.cardDescription}>{voucher.description}</p></div>
              <div className={styles.cardFooter}>
                <span className={styles.pointsValue}><strong>{voucher.pointsCost.toLocaleString('vi-VN')}</strong><span>reference points</span></span>
                <span className={styles.cardHint}>Read-only UI reference</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
