import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';
import { platformService } from '../../../services/platform.service';
import styles from '../styles/VoucherShop.module.css';

interface VoucherShopProps {
  customerId: string;
  points: number;
  onChanged: () => void | Promise<void>;
}

type VoucherType = 'DISCOUNT_50K' | 'FREE_BASIC' | 'FREE_DETAIL';

interface VoucherCatalogItem {
  type: VoucherType;
  title: string;
  pointsCost: number;
  description: string;
}

interface CustomerVoucher {
  voucherId?: string | number;
  voucherType?: string;
  voucherCode?: string;
  redeemedAt?: string;
  expiredAt?: string;
  status?: string;
}

interface ApiErrorShape {
  message?: unknown;
  response?: {
    data?: {
      error?: unknown;
      message?: unknown;
    };
  };
}

const voucherCatalog: VoucherCatalogItem[] = [
  {
    type: 'DISCOUNT_50K',
    title: '50k Discount Voucher',
    pointsCost: 500,
    description: 'Reduces the booking total by 50,000 VND.',
  },
  {
    type: 'FREE_BASIC',
    title: '100k Discount Voucher',
    pointsCost: 1200,
    description: 'Reduces the booking total by 100,000 VND.',
  },
  {
    type: 'FREE_DETAIL',
    title: '250k Discount Voucher',
    pointsCost: 2400,
    description: 'Reduces the booking total by 250,000 VND.',
  },
];

const voucherTitles: Record<VoucherType, string> = Object.fromEntries(
  voucherCatalog.map((item) => [item.type, item.title]),
) as Record<VoucherType, string>;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;

  const apiError = error as ApiErrorShape;
  const responseMessage = apiError.response?.data?.message;
  const responseError = apiError.response?.data?.error;
  if (typeof responseError === 'string' && responseError.trim()) return responseError;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message;
  return fallback;
};

const getVoucherTitle = (type?: string) => {
  if (type && type in voucherTitles) return voucherTitles[type as VoucherType];
  return type ? type.replaceAll('_', ' ') : 'Reward voucher';
};

const getVoucherDate = (voucher: CustomerVoucher) => {
  const rawDate = voucher.redeemedAt || voucher.expiredAt;
  if (!rawDate) return voucher.status || 'Active';

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return voucher.status || 'Active';

  const label = voucher.redeemedAt ? 'Redeemed' : 'Expires';
  return `${label} ${parsedDate.toLocaleDateString('vi-VN')}`;
};

export const VoucherShop: React.FC<VoucherShopProps> = ({ customerId, points, onChanged }) => {
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [redeemingType, setRedeemingType] = useState<VoucherType | null>(null);

  const loadVouchers = useCallback(async () => {
    if (!customerId) {
      setVouchers([]);
      setLoadError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const response: unknown = await platformService.vouchers(customerId);
      if (!Array.isArray(response)) throw new Error('The voucher response was not valid.');
      setVouchers(response as CustomerVoucher[]);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load your vouchers.'));
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const handleRedeem = async (item: VoucherCatalogItem) => {
    if (points < item.pointsCost || redeemingType) return;

    setRedeemingType(item.type);
    setMessage(null);

    try {
      const voucher = (await platformService.redeem(
        customerId,
        item.type,
        item.pointsCost,
      )) as CustomerVoucher;
      const code = voucher.voucherCode ? ` Code: ${voucher.voucherCode}` : '';
      setMessage({ kind: 'success', text: `Redeemed ${item.title}.${code}` });
      await onChanged();
      await loadVouchers();
    } catch (error) {
      setMessage({
        kind: 'error',
        text: getErrorMessage(error, 'Not enough points or the voucher could not be redeemed.'),
      });
    } finally {
      setRedeemingType(null);
    }
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
        <div
          className={`${styles.message} ${message.kind === 'error' ? styles.messageError : ''}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      <p className={styles.catalogNotice}>
        Exchange costs are Front-end reference values because the Back-end does not expose an authoritative voucher catalog API.
      </p>

      <div className={styles.catalogGrid}>
        {voucherCatalog.map((item) => {
          const disabled = points < item.pointsCost || redeemingType !== null;
          const isRedeeming = redeemingType === item.type;

          return (
            <article key={item.type} className={styles.catalogCard}>
              <div className={styles.catalogTop}>
                <div className={styles.catalogTitle}>{item.title}</div>
                <span className={styles.catalogCost}>{item.pointsCost.toLocaleString('vi-VN')} pts</span>
              </div>
              <p className={styles.catalogDescription}>{item.description}</p>
              <div className={styles.catalogFooter}>
                <span className={styles.catalogHint}>
                  {isRedeeming ? 'Creating voucher...' : points < item.pointsCost ? 'More points needed' : 'Ready to redeem'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRedeem(item)}
                  disabled={disabled}
                  className={`${styles.redeemButton} ${disabled ? styles.redeemButtonDisabled : ''}`}
                >
                  {isRedeeming && <LoaderCircle size={14} className={styles.spinner} />}
                  {isRedeeming ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.vouchersSection}>
        <h4 className={styles.vouchersTitle}>My vouchers</h4>

        {isLoading ? (
          <div className={styles.loadingState} role="status">
            <LoaderCircle size={18} className={styles.spinner} />
            <span>Loading your vouchers...</span>
          </div>
        ) : loadError ? (
          <div className={styles.errorState} role="alert">
            <AlertCircle size={18} />
            <span>{loadError}</span>
            <button type="button" className={styles.reloadButton} onClick={() => void loadVouchers()}>
              <RefreshCw size={14} />
              Reload
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <p className={styles.empty}>No vouchers redeemed yet.</p>
        ) : (
          <div className={styles.voucherList}>
            {vouchers.map((voucher, index) => (
              <div
                key={String(voucher.voucherId || voucher.voucherCode || `${voucher.voucherType}-${index}`)}
                className={styles.voucherItem}
              >
                <div>
                  <span className={styles.voucherName}>{getVoucherTitle(voucher.voucherType)}</span>
                  <span className={styles.voucherDate}>{getVoucherDate(voucher)}</span>
                </div>
                <span className={styles.voucherCode}>{voucher.voucherCode || 'Code pending'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
