import React, { useCallback, useEffect, useRef, useState, ClipboardEvent, KeyboardEvent } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useSendCustomerOtp, useVerifyCustomerOtp } from '../hooks/use-auth';
import styles from '../styles/VerifyOtpForm.module.css';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../../config/firebase-config';

const OTP_LENGTH = 6;
const otpPattern = /^\d{6}$/;

interface VerifyOtpFormProps {
  phone: string;
  confirmationResult: any;
  setConfirmationResult: (result: any) => void;
  onBack: () => void;
  onSuccess: () => void;
}

export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({ phone, confirmationResult, setConfirmationResult, onBack, onSuccess }) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [lastOtpExpiry, setLastOtpExpiry] = useState<number | null>(Date.now() + 60 * 1000);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sendOtpMutation = useSendCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-resend', {
      size: 'invisible'
    });
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

  useEffect(() => {
    if (!lastOtpExpiry) return;
    const syncTimer = () => {
      const nextSecondsLeft = Math.max(0, Math.ceil((lastOtpExpiry - Date.now()) / 1000));
      setSecondsLeft(nextSecondsLeft);
    };
    syncTimer();
    const timer = setInterval(syncTimer, 1000);
    return () => clearInterval(timer);
  }, [lastOtpExpiry]);

  const otp = digits.join('');
  const expired = secondsLeft === 0 && lastOtpExpiry !== null;
  const ready = otpPattern.test(otp) && !expired;

  const handleDigitChange = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = nextDigit;
      return next;
      
    });
    if (nextDigit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSendOtp = useCallback(async () => {
    if (!recaptchaVerifier) return;
    try {
      const response = await sendOtpMutation.mutateAsync({ phone, recaptchaVerifier });
      setConfirmationResult(response.confirmationResult);
      setLastOtpExpiry(Date.now() + response.otpExpiresIn * 1000);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {}
  }, [phone, sendOtpMutation, recaptchaVerifier, setConfirmationResult]);

  const handleVerify = async () => {
    if (!ready) return;
    try {
      await verifyOtpMutation.mutateAsync({ otp, confirmationResult });
      onSuccess();
    } catch (err) {}
  };

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <div className={styles.iconBox}>
          <ShieldCheck size={28} />
        </div>
      </div>
      
      <div className={styles.headerText}>
        <h3 className={styles.title}>Enter OTP Code</h3>
        <p className={styles.subtitle}>
          Enter the 6-digit OTP sent to <span>{phone || 'your phone'}</span> to activate the account.
        </p>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>6-Digit Code</label>
        <div className={styles.otpGrid} onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              maxLength={1}
              className={`${styles.digitInput} ${digit ? styles.digitInputFilled : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.timerBox}>
        <div className={styles.timerText}>
          {secondsLeft > 0 ? (
            <>OTP expires in <span>{secondsLeft}s</span></>
          ) : (
            <span className={styles.expiredText}>You can resend a new code now.</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={sendOtpMutation.isPending || !recaptchaVerifier}
          className={styles.resendBtn}
        >
          {sendOtpMutation.isPending ? 'Sending...' : 'Resend code'}
        </button>
      </div>

      <div className={styles.actionsGrid}>
        <button type="button" className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          disabled={!ready || verifyOtpMutation.isPending}
          onClick={handleVerify}
          className={styles.btnVerify}
        >
          {verifyOtpMutation.isPending ? (
            <><Loader2 className="lucide-spin" size={16} /> Verifying...</>
          ) : (
            'Verify & Complete'
          )}
        </button>
      </div>

      <div id="recaptcha-container-resend"></div>

      {sendOtpMutation.error && (
        <div className={styles.errorBox}>{sendOtpMutation.error.message}</div>
      )}
      {verifyOtpMutation.error && (
        <div className={styles.errorBox}>{verifyOtpMutation.error.message}</div>
      )}
    </div>
  );
};
