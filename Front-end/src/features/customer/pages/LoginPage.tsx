import React, { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { useAuth } from '../../../context/AuthContext';
import { RegisterForm } from '../components/RegisterForm';
import { VerifyOtpForm } from '../components/VerifyOtpForm';
import styles from '../styles/LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'verify'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyExpiresIn, setVerifyExpiresIn] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      const result = await login(loginPhone, loginPassword);
      if (result.success) {
        window.location.href = '/';
      } else {
        setError(result.error || 'Login failed');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSuccess = (email: string, expiresIn: number) => {
    setVerifyEmail(email);
    setVerifyExpiresIn(expiresIn);
    setActiveTab('verify');
  };

  const handleVerifySuccess = () => {
    setSuccess('Account created and verified successfully! Welcome!');
    setTimeout(() => { window.location.href = '/'; }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logoSection}>
          <span className={styles.logoEmoji}>Auto</span>
          <h1 className={styles.logoTitle}>
            AutoWash <span className={styles.logoHighlight}>PRO</span>
          </h1>
          <p className={styles.logoSub}>Customer, Admin, and Counter Portal</p>
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
                label="Phone number or username"
                type="text"
                placeholder="customer, admin, or counter"
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
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          )}

          {activeTab === 'register' && (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}

          {activeTab === 'verify' && (
            <VerifyOtpForm
              email={verifyEmail}
              expiresIn={verifyExpiresIn}
              onBack={() => setActiveTab('register')}
              onSuccess={handleVerifySuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};
