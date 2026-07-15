import React, { useEffect, useMemo, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { Button } from '../../../components/Button/Button';
import { Copy, Check, QrCode } from 'lucide-react';
import { CAR_TYPES } from '../../../config/constants';
import { priceService } from '../../../services/customer/price.service';
import { catalogService } from '../../../services/customer/catalog.service';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Branch, ServiceItem } from '../../../types';
import styles from '../styles/StepPayment.module.css';

interface StepPaymentProps {
  onComplete: () => void;
}

interface ParsedQrDetails {
  bankCode: string;
  accountName: string;
  accountNumber: string;
}

const parseBackendQrDetails = (qrUrl?: string): ParsedQrDetails => {
  if (!qrUrl) return { bankCode: '', accountName: '', accountNumber: '' };

  try {
    const url = new URL(qrUrl);
    const fileName = url.pathname.split('/').pop()?.replace(/\.(png|jpe?g)$/i, '') || '';
    const parts = fileName.split('-');
    const bankCode = parts[0] || '';
    const accountNumber = parts.length > 2 ? parts.slice(1, -1).join('-') : '';
    return {
      bankCode,
      accountName: url.searchParams.get('accountName') || '',
      accountNumber,
    };
  } catch {
    return { bankCode: '', accountName: '', accountNumber: '' };
  }
};

export const StepPayment: React.FC<StepPaymentProps> = ({ onComplete }) => {
  const { draft, resetDraft } = useCustomerBooking();
  const [services, setServices] = useState<ServiceItem[]>(catalogService.getCachedServices());
  const [branches, setBranches] = useState<Branch[]>(catalogService.getCachedBranches());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    catalogService.getServices()
      .then(items => {
        if (active) setServices(items);
      })
      .catch(error => console.error('Failed to refresh service catalog', error));

    catalogService.getBranches()
      .then(items => {
        if (active) setBranches(items);
      })
      .catch(error => console.error('Failed to refresh branch catalog', error));

    return () => {
      active = false;
    };
  }, []);

  const carType = CAR_TYPES.find(car => car.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => services.find(service => service.id === id))
    .filter((service): service is ServiceItem => Boolean(service));
  const branch = branches.find(item => item.id === draft.branchId);
  const totalPrice = draft.confirmedTotalPrice;
  const bookingRef = draft.bookingRef;
  const qrUrl = draft.vietQrUrl;
  const qrDetails = useMemo(() => parseBackendQrDetails(qrUrl), [qrUrl]);
  const hasBackendPayment = typeof totalPrice === 'number' && Boolean(bookingRef) && Boolean(qrUrl);

  const copyToClipboard = async (text: string, field: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Could not copy payment detail', error);
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => {
    const isCopied = copiedField === field;
    return (
      <button
        className={`${styles.copyBtn} ${isCopied ? styles.copySuccess : ''}`}
        onClick={() => copyToClipboard(text, field)}
        title="Copy to clipboard"
        type="button"
      >
        {isCopied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    );
  };

  const handleFinish = () => {
    resetDraft();
    onComplete();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Booking Created — Payment Pending</h3>
        <p className={styles.subtitle}>Scan the VietQR code to make the bank transfer for this booking.</p>
      </div>

      {hasBackendPayment && (
        <div role="note" className={styles.paymentNotice}>
          The Back-end does not provide a payment-status or confirmation API. Returning to the dashboard does not mark this transfer as verified.
        </div>
      )}

      {!hasBackendPayment && (
        <div role="alert" className={styles.paymentError}>
          Payment details are unavailable because the booking response did not include a confirmed price, reference, and VietQR code.
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.summaryCard}>
          <h4 className={styles.cardTitle}>Booking Summary</h4>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Booking reference</span>
            <span className={styles.summaryValue}>{bookingRef || 'Unavailable'}</span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Vehicle</span>
            <span className={styles.summaryValue}>
              {draft.vehicleBrand} — {draft.vehiclePlate}<br />
              {carType?.name}
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Services</span>
            <div className={styles.summaryValue}>
              {selectedServices.map(service => <div key={service.id}>{service.name}</div>)}
            </div>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Branch</span>
            <span className={styles.summaryValue}>{branch?.name || draft.branchId}</span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Schedule</span>
            <span className={styles.summaryValue}>
              {draft.date ? formatDate(draft.date) : ''} · {draft.time ? formatTime(draft.time) : ''}
              {draft.endTime ? ` – ${formatTime(draft.endTime)}` : ''}
              {draft.durationMinutes ? <><br />{draft.durationMinutes} minutes</> : null}
            </span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Confirmed Total Amount</span>
            <span className={styles.totalValue}>
              {typeof totalPrice === 'number' ? priceService.formatPrice(totalPrice) : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className={styles.paymentCard}>
          <h4 className={styles.cardTitle}><QrCode size={20} /> VietQR Transfer</h4>

          <div className={styles.qrContainer}>
            {qrUrl ? (
              <img src={qrUrl} alt={`VietQR payment for ${bookingRef || 'booking'}`} className={styles.qrImage} />
            ) : (
              <div className={styles.qrUnavailable}>VietQR was not returned by the backend.</div>
            )}
            <div className={styles.statusBadge}>
              <span className={styles.statusBlink}></span> PENDING PAYMENT
            </div>
          </div>

          <div className={styles.paymentInfoList}>
            {(qrDetails.bankCode || qrDetails.accountName) && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Bank & Account Name</span>
                <div className={styles.infoValueWrapper}>
                  <span className={styles.infoValue}>
                    {[qrDetails.bankCode, qrDetails.accountName].filter(Boolean).join(' - ')}
                  </span>
                </div>
              </div>
            )}

            {qrDetails.accountNumber && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Account Number</span>
                <div className={styles.infoValueWrapper}>
                  <span className={styles.infoValue}>{qrDetails.accountNumber}</span>
                  <CopyButton text={qrDetails.accountNumber} field="account" />
                </div>
              </div>
            )}

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Amount</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>
                  {typeof totalPrice === 'number' ? priceService.formatPrice(totalPrice) : 'Unavailable'}
                </span>
                {typeof totalPrice === 'number' && <CopyButton text={String(totalPrice)} field="amount" />}
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Transfer Content (Required)</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>{bookingRef || 'Unavailable'}</span>
                {bookingRef && <CopyButton text={bookingRef} field="content" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button size="lg" onClick={handleFinish} disabled={!hasBackendPayment}>
          Finish & Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
