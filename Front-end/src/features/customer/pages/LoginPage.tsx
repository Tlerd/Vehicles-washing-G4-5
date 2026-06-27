import React, { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { useAuth } from '../../../context/AuthContext';
import { RegisterForm } from '../components/RegisterForm';
import { VerifyOtpForm } from '../components/VerifyOtpForm';
import styles from '../styles/LoginPage.module.css';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, loginAsGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'verify'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginPhone, setLoginPhone] = useState('0901234567');
  const [loginPassword, setLoginPassword] = useState('password');

  const [verifyPhone, setVerifyPhone] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(loginPhone, loginPassword);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleRegisterSuccess = (phone: string, confirmationRes: any) => {
    setVerifyPhone(phone);
    setConfirmationResult(confirmationRes);
    setActiveTab('verify');
  };

  const handleVerifySuccess = () => {
    setSuccess('Account created and verified successfully! Welcome 🎉');
    setTimeout(() => onLoginSuccess(), 1000);
  };

  const handleGuest = () => {
    loginAsGuest();
    onLoginSuccess();
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logoSection}>
          <span className={styles.logoEmoji}>🚗</span>
          <h1 className={styles.logoTitle}>
            AutoWash <span className={styles.logoHighlight}>PRO</span>
          </h1>
          <p className={styles.logoSub}>Premium Car Wash Booking System</p>
        </div>

        <div className={styles.card}>
          {activeTab !== 'verify' && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
              >
                Login
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'register' ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
              >
                Register
              </button>
            </div>
          )}

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {activeTab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <Input
                label="Phone number"
                type="tel"
                placeholder="0901234567"
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
              <Button type="submit" fullWidth size="lg">
                Login
              </Button>
            </form>
          )}

          {activeTab === 'register' && (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}

          {activeTab === 'verify' && (
            <VerifyOtpForm 
              phone={verifyPhone} 
              confirmationResult={confirmationResult}
              setConfirmationResult={setConfirmationResult}
              onBack={() => setActiveTab('register')}
              onSuccess={handleVerifySuccess}
            />
          )}

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <button className={styles.guestBtn} onClick={handleGuest}>
            👋 Continue as Guest
          </button>

          <p className={styles.hint}>
            Demo: use phone number <span className={styles.hintLink}>0901234567</span> with any password
          </p>
        </div>
      </div>
    </div>
  );
};
