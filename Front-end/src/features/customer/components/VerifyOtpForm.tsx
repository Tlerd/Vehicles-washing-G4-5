import React, { useCallback, useEffect, useRef, useState, ClipboardEvent, KeyboardEvent } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useSendCustomerOtp, useVerifyCustomerOtp } from '../hooks/use-auth';
import styles from '../styles/VerifyOtpForm.module.css';

const OTP_LENGTH = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpPattern = /^\d{6}$/;

interface VerifyOtpFormProps {
  email: string;
  expiresIn: number;
  onBack: () => void;
  onSuccess: () => void;
}

export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({ email: initialEmail, expiresIn, onBack, onSuccess }) => {
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(initialEmail ? expiresIn : 0);
  const [lastOtpExpiry, setLastOtpExpiry] = useState<number | null>(
    initialEmail ? Date.now() + expiresIn * 1000 : null
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sendOtpMutation = useSendCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

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
  const ready = otpPattern.test(otp) && emailPattern.test(email) && !expired;

  const emailError = email.length > 0 && !emailPattern.test(email) ? 'Invalid email format.' : null;

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
    if (!emailPattern.test(email)) return;
    try {
      const response = await sendOtpMutation.mutateAsync({ email });
      setLastOtpExpiry(Date.now() + response.otpExpiresIn * 1000);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {}
  }, [email, sendOtpMutation]);

  const handleVerify = async () => {
    if (!ready) return;
    try {
      await verifyOtpMutation.mutateAsync({ email, otp });
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
          Enter the 6-digit OTP sent to <span>{email || 'your email'}</span> to activate the account.
        </p>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="verifyEmail" className={styles.label}>Email</label>
        <input
          id="verifyEmail"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          className={styles.emailInput}
          placeholder="name@example.com"
        />
        {emailError && <p className={styles.errorText}>{emailError}</p>}
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
          disabled={sendOtpMutation.isPending || !emailPattern.test(email)}
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

      {sendOtpMutation.error && (
        <div className={styles.errorBox}>{sendOtpMutation.error.message}</div>
      )}
      {verifyOtpMutation.error && (
        <div className={styles.errorBox}>{verifyOtpMutation.error.message}</div>
      )}
    </div>
  );
};
