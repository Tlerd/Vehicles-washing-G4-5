import React, { useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { Button } from '../../../components/Button/Button';
import { Copy, Check, QrCode } from 'lucide-react';
import { CAR_TYPES, SERVICES, BRANCHES } from '../../../config/constants';
import { priceService } from '../../../services/customer/price.service';
import { formatDate, formatTime } from '../../../utils/formatters';
import styles from '../styles/StepPayment.module.css';

interface StepPaymentProps {
  onComplete: () => void;
}

export const StepPayment: React.FC<StepPaymentProps> = ({ onComplete }) => {
  const { draft, resetDraft } = useCustomerBooking();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const carType = CAR_TYPES.find(c => c.id === draft.carSize);
  const selectedServices = draft.selectedServices
    .map(id => SERVICES.find(s => s.id === id))
    .filter(Boolean);
  const branch = BRANCHES.find(b => b.id === draft.branchId);
  const totalPrice = priceService.calculateFinalPrice(draft.selectedServices, draft.carSize);
  
  // Mock booking reference based on draft (since we don't have the real object here unless fetched)
  // Usually this comes from the backend. We'll use the ID we stored in draft earlier.
  const bookingRef = draft.bookingId ? `AWP-${draft.bookingId.split('_')[1]}` : 'AWP-123456';
  
  const paymentDetails = {
    bank: 'Vietcombank',
    accountName: 'AUTO WASH PRO',
    accountNumber: '0123456789',
    amount: totalPrice.toString(),
    content: bookingRef,
  };

  // Mock VietQR URL (Using a generic placeholder for the UI)
  const qrUrl = `https://api.vietqr.io/image/970436-0123456789-U9Wkq3N.jpg?amount=${totalPrice}&addInfo=${bookingRef}&accountName=AUTO%20WASH%20PRO`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string, field: string }) => {
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
        <h3 className={styles.title}>Payment Integration</h3>
        <p className={styles.subtitle}>Complete your booking by scanning the VietQR code</p>
      </div>

      <div className={styles.content}>
        {/* Left Column: Booking Summary */}
        <div className={styles.summaryCard}>
          <h4 className={styles.cardTitle}>Booking Summary</h4>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Vehicle</span>
            <span className={styles.summaryValue}>{carType?.name}</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Services</span>
            <div className={styles.summaryValue}>
              {selectedServices.map(s => <div key={s?.id}>{s?.name}</div>)}
            </div>
          </div>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Branch</span>
            <span className={styles.summaryValue}>{branch?.name}</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Schedule</span>
            <span className={styles.summaryValue}>
              {draft.date ? formatDate(draft.date) : ''} - {draft.time ? formatTime(draft.time) : ''}
            </span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total Amount</span>
            <span className={styles.totalValue}>{priceService.formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* Right Column: Payment Details */}
        <div className={styles.paymentCard}>
          <h4 className={styles.cardTitle}><QrCode size={20} /> VietQR Transfer</h4>
          
          <div className={styles.qrContainer}>
            <img src={qrUrl} alt="VietQR Code" className={styles.qrImage} />
            <div className={styles.statusBadge}>
              <span className={styles.statusBlink}></span> PENDING PAYMENT
            </div>
          </div>

          <div className={styles.paymentInfoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Bank & Account Name</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>{paymentDetails.bank} - {paymentDetails.accountName}</span>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Account Number</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>{paymentDetails.accountNumber}</span>
                <CopyButton text={paymentDetails.accountNumber} field="account" />
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Amount</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>{priceService.formatPrice(totalPrice)}</span>
                <CopyButton text={paymentDetails.amount} field="amount" />
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Transfer Content (Required)</span>
              <div className={styles.infoValueWrapper}>
                <span className={styles.infoValue}>{paymentDetails.content}</span>
                <CopyButton text={paymentDetails.content} field="content" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button size="lg" onClick={handleFinish}>
          Finish & Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
