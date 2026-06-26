import React, { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound, Phone } from 'lucide-react';
import { useCustomerRegister } from '../hooks/use-auth';
import styles from '../styles/RegisterForm.module.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phonePattern = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

interface RegisterFormProps {
  onSuccess: (email: string, expiresIn: number) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const registerMutation = useCustomerRegister();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const fullNameError = fullName.length > 0 && fullName.trim().length === 0 ? 'Full name is required.' : null;
  const phoneError = phone.length > 0 && !phonePattern.test(phone) ? 'Invalid phone number format.' : null;
  const emailError = email.length > 0 && !emailPattern.test(email) ? 'Invalid email format.' : null;
  const passwordError = password.length > 0 && !passwordPattern.test(password)
    ? 'Password must contain uppercase, lowercase, number, special char and be 8+ chars.'
    : null;
  const passwordConfirmError = passwordConfirm.length > 0 && passwordConfirm !== password
    ? 'Passwords do not match.'
    : null;

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      phonePattern.test(phone) &&
      emailPattern.test(email) &&
      passwordPattern.test(password) &&
      passwordConfirm === password &&
      !registerMutation.isPending
    );
  }, [email, phone, fullName, password, passwordConfirm, registerMutation.isPending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    
    try {
      const response = await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      onSuccess(response.email, response.otpExpiresIn);
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div className={styles.inputGroup}>
        <label htmlFor="fullName" className={styles.label}>Full name</label>
        <div className={styles.inputWrapper}>
          <input
            id="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyen Van A"
            className={styles.input}
          />
          <div className={styles.inputIcon}><UserRound size={16} /></div>
        </div>
        {fullNameError && <p className={styles.errorText}>{fullNameError}</p>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="phone" className={styles.label}>Phone number</label>
        <div className={styles.inputWrapper}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            className={styles.input}
          />
          <div className={styles.inputIcon}><Phone size={16} /></div>
        </div>
        {phoneError && <p className={styles.errorText}>{phoneError}</p>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <div className={styles.inputWrapper}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={styles.input}
          />
          <div className={styles.inputIcon}><Mail size={16} /></div>
        </div>
        {emailError && <p className={styles.errorText}>{emailError}</p>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>Password</label>
        <div className={styles.inputWrapper}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className={styles.input}
          />
          <div className={styles.inputIcon}><LockKeyhole size={16} /></div>
        </div>
        {passwordError && <p className={styles.errorText}>{passwordError}</p>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="passwordConfirm" className={styles.label}>Confirm Password</label>
        <div className={styles.inputWrapper}>
          <input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="********"
            className={styles.input}
          />
          <div className={styles.inputIcon}><LockKeyhole size={16} /></div>
        </div>
        {passwordConfirmError && <p className={styles.errorText}>{passwordConfirmError}</p>}
      </div>

      <div className={styles.submitWrapper}>
        <button type="submit" disabled={!canSubmit} className={styles.submitBtn}>
          {registerMutation.isPending ? (
            <><Loader2 className="lucide-spin" size={16} /> Creating account...</>
          ) : (
            <>Register <ArrowRight size={16} /></>
          )}
        </button>
      </div>

      {registerMutation.error && (
        <div className={styles.errorMessage}>
          {registerMutation.error.message}
        </div>
      )}
    </form>
  );
};
