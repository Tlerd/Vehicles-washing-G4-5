import React, { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { useAuth } from '../../../context/AuthContext';
import styles from '../styles/LoginPage.module.css';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, register, loginAsGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginPhone, setLoginPhone] = useState('0901234567');
  const [loginPassword, setLoginPassword] = useState('password');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const result = login(loginPhone, loginPassword);
    if (result.success) {
      onLoginSuccess();
      return;
    }

    setError(result.error || 'Login failed');
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!regName || !regPhone || !regPassword) {
      setError('Please fill in name, phone, and password.');
      return;
    }

    const result = register(regName, regPhone, regEmail, regPassword);
    if (result.success) {
      setSuccess('Account created successfully.');
      setTimeout(() => onLoginSuccess(), 800);
      return;
    }

    setError(result.error || 'Registration failed');
  };

  const handleGuest = () => {
    loginAsGuest();
    onLoginSuccess();
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logoSection}>
          <span className={styles.logoEmoji}>AW</span>
          <h1 className={styles.logoTitle}>
            AutoWash <span className={styles.logoHighlight}>PRO</span>
          </h1>
          <p className={styles.logoSub}>Premium car wash booking system</p>
        </div>

        <div className={styles.card}>
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

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {activeTab === 'login' ? (
            <form className={styles.form} onSubmit={handleLogin}>
              <Input
                label="Phone number"
                type="tel"
                placeholder="0901234567"
                value={loginPhone}
                onChange={event => setLoginPhone(event.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={event => setLoginPassword(event.target.value)}
              />
              <Button type="submit" fullWidth size="lg">
                Login
              </Button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleRegister}>
              <Input
                label="Full name"
                placeholder="Enter your name"
                value={regName}
                onChange={event => setRegName(event.target.value)}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="0901234567"
                value={regPhone}
                onChange={event => setRegPhone(event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={regEmail}
                onChange={event => setRegEmail(event.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create password"
                value={regPassword}
                onChange={event => setRegPassword(event.target.value)}
              />
              <Button type="submit" fullWidth size="lg">
                Create customer account
              </Button>
            </form>
          )}

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <button className={styles.guestBtn} onClick={handleGuest}>
            Continue as guest customer
          </button>

          <p className={styles.hint}>
            Customer demo: <span className={styles.hintLink}>0901234567</span> / any password
          </p>
          <p className={styles.hint}>
            Admin demo: <span className={styles.hintLink}>0999999999</span> / password123
          </p>
        </div>
      </div>
    </div>
  );
};
