import React, { useState } from 'react';
import { mockStore } from '../../../services/mockStore';
import styles from '../styles/VoucherShop.module.css';

interface VoucherShopProps {
  customerId: string;
  points: number;
  onChanged: () => void;
}

export const VoucherShop: React.FC<VoucherShopProps> = ({ customerId, points, onChanged }) => {
  const [message, setMessage] = useState('');
  const vouchers = mockStore.getVouchersByCustomer(customerId);
  const voucherCatalog = mockStore.getVoucherCatalog();

  const handleRedeem = (item: (typeof voucherCatalog)[number]) => {
    const voucher = mockStore.redeemVoucher(customerId, item.type, item.pointsCost, item.title);
    if (!voucher) {
      setMessage('Not enough points for this voucher.');
      return;
    }
    setMessage(`Redeemed ${voucher.title}. Code: ${voucher.code}`);
    onChanged();
  };

  return (
    <div className={styles.shop}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Voucher store</h3>
          <p className={styles.subtitle}>Turn loyalty points into offers you can use on the next service visit.</p>
        </div>
        <strong className={styles.pointsBadge}>{points.toLocaleString('vi-VN')} pts</strong>
      </div>

      {message && (
        <div className={styles.message}>{message}</div>
      )}

      <div className={styles.catalogGrid}>
        {voucherCatalog.map((item) => {
          const disabled = points < item.pointsCost;
          return (
            <article key={item.type} className={styles.catalogCard}>
              <div className={styles.catalogTop}>
                <div className={styles.catalogTitle}>{item.title}</div>
                <span className={styles.catalogCost}>{item.pointsCost.toLocaleString('vi-VN')} pts</span>
              </div>
              <p className={styles.catalogDescription}>{item.description}</p>
              <div className={styles.catalogFooter}>
                <span className={styles.catalogHint}>{disabled ? 'More points needed' : 'Ready to redeem'}</span>
                <button
                  type="button"
                  onClick={() => handleRedeem(item)}
                  disabled={disabled}
                  className={`${styles.redeemButton} ${disabled ? styles.redeemButtonDisabled : ''}`}
                >
                  Redeem
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.vouchersSection}>
        <h4 className={styles.vouchersTitle}>My vouchers</h4>
        {vouchers.length === 0 ? (
          <p className={styles.empty}>No vouchers redeemed yet.</p>
        ) : (
          <div className={styles.voucherList}>
            {vouchers.map((voucher) => (
              <div key={voucher.id} className={styles.voucherItem}>
                <div>
                  <span className={styles.voucherName}>{voucher.title}</span>
                  <span className={styles.voucherDate}>{new Date(voucher.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className={styles.voucherCode}>{voucher.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
