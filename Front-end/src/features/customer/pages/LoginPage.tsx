import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { RegisterForm } from '../components/RegisterForm';
import { VerifyOtpForm } from '../components/VerifyOtpForm';
import {
  getDestinationForRole,
  getUserRole,
  LOGIN_ROLE_OPTIONS,
  LoginRole,
} from '../../../features/auth/roleAccess';
import styles from '../styles/LoginPage.module.css';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<LoginRole>('CUSTOMER');
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'verify'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginPhone, setLoginPhone] = useState(LOGIN_ROLE_OPTIONS[0].demoPhone);
  const [loginPassword, setLoginPassword] = useState(LOGIN_ROLE_OPTIONS[0].demoPassword);

  const [verifyPhone, setVerifyPhone] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const selectedRoleOption = useMemo(
    () => LOGIN_ROLE_OPTIONS.find((option) => option.id === selectedRole) ?? LOGIN_ROLE_OPTIONS[0],
    [selectedRole],
  );
  const portalMetrics = [
    { label: 'Check-in confidence', value: '99.2%', detail: 'Clear role routing after sign-in' },
    { label: 'Faster handoff', value: '< 1 min', detail: 'Cleaner access for daily operations' },
    { label: 'Service continuity', value: '3 roles', detail: 'One premium language across the system' },
  ];
  const premiumSignals = [
    'Premium car-care look and feel from the first screen',
    'Role-aware journeys for booking, branch handling, and operations control',
    'Structured semantic sections for stronger AI search readability',
  ];
  const serviceJourney = [
    {
      title: 'Choose a role',
      description: 'Start from the same polished gateway and move into the right workspace immediately.',
    },
    {
      title: 'Confirm access',
      description: 'Use role-specific credentials, cleaner labels, and stronger trust cues while signing in.',
    },
    {
      title: 'Continue the workflow',
      description: 'Land in the correct portal with less hesitation and fewer UI context switches.',
    },
  ];
  const selectedRoleAccent = useMemo(() => {
    if (selectedRole === 'ADMIN') {
      return {
        eyebrow: 'Operations command',
        promise: 'High-clarity controls for campaign planning, revenue visibility, and governance.',
      };
    }

    if (selectedRole === 'STAFF') {
      return {
        eyebrow: 'Branch execution',
        promise: 'Faster approvals, cleaner queue handling, and less friction at the washing counter.',
      };
    }

    return {
      eyebrow: 'Member experience',
      promise: 'A brighter premium start for booking, loyalty, rewards, and account continuity.',
    };
  }, [selectedRole]);

  const canRegister = selectedRole === 'CUSTOMER';

  const handleRoleChange = (role: LoginRole) => {
    const option = LOGIN_ROLE_OPTIONS.find((item) => item.id === role) ?? LOGIN_ROLE_OPTIONS[0];
    setSelectedRole(role);
    setActiveTab(role === 'CUSTOMER' ? 'login' : 'login');
    setError('');
    setSuccess('');
    setLoginPhone(option.demoPhone);
    setLoginPassword(option.demoPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(loginPhone, loginPassword);
    if (result.success) {
      const role = getUserRole({
        id:
          loginPhone === '0999999999'
            ? 'admin'
            : loginPhone === '0987654321'
              ? 'counter'
              : undefined,
        phone: loginPhone,
      });
      onLoginSuccess();
      navigate(getDestinationForRole(role), { replace: true });
    } else {
      setError(result.error || 'Sign-in failed. Please check your credentials and try again.');
    }
  };

  const handleRegisterSuccess = (phone: string, confirmationRes: any) => {
    setVerifyPhone(phone);
    setConfirmationResult(confirmationRes);
    setActiveTab('verify');
  };

  const handleVerifySuccess = () => {
    setSuccess('Account created and verified successfully. Welcome to AutoWash Pro.');
    setTimeout(() => {
      onLoginSuccess();
      navigate('/app', { replace: true });
    }, 1000);
  };

  const handleGuest = () => {
    loginAsGuest();
    onLoginSuccess();
    navigate('/app', { replace: true });
  };

  return (
    <div className={styles.container}>
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>Unified account access</p>
        <h1 className={styles.logoTitle}>
          AutoWash <span className={styles.logoHighlight}>Pro</span>
        </h1>
        <p className={styles.logoSub}>
          A premium sign-in experience designed to feel cleaner, faster, and more trustworthy for every AutoWash Pro role.
        </p>
      </header>

      <main className={styles.layout}>
        <aside className={styles.overviewPanel} aria-label="Portal overview">
          <section className={styles.heroPanel}>
            <p className={styles.heroPanelEyebrow}>Premium car-care identity</p>
            <h2 className={styles.heroPanelTitle}>Bring the brand atmosphere into the first interaction.</h2>
            <p className={styles.heroPanelText}>
              The entry experience now feels closer to a premium wash studio than a generic software login, while staying practical for operations.
            </p>
          </section>

          <section className={styles.metricsSection} aria-label="Portal quality metrics">
            <dl className={styles.metricsGrid}>
              {portalMetrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                  <p>{metric.detail}</p>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.panelSection}>
            <h2 className={styles.panelTitle}>Why this access flow feels premium</h2>
            <ul className={styles.featureList}>
              {premiumSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </section>

          <section className={styles.panelSection}>
            <h2 className={styles.panelTitle}>Workspace destinations</h2>
            <dl className={styles.destinationList}>
              {LOGIN_ROLE_OPTIONS.map((option) => (
                <div key={option.id} className={styles.destinationItem}>
                  <dt>{option.label}</dt>
                  <dd>{option.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.panelSection}>
            <h2 className={styles.panelTitle}>Service journey</h2>
            <ol className={styles.journeyList}>
              {serviceJourney.map((step, index) => (
                <li key={step.title} className={styles.journeyItem}>
                  <span className={styles.journeyStep}>0{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>

        <section className={styles.card} aria-labelledby="portal-access-title">
          <header className={styles.cardHeader}>
            <p className={styles.cardEyebrow}>Access portal</p>
            <h2 id="portal-access-title" className={styles.cardTitle}>
              {selectedRoleOption.heading}
            </h2>
            <p className={styles.cardDescription}>{selectedRoleOption.supportText}</p>
          </header>

          <section className={styles.focusBanner} aria-label="Selected role focus">
            <p className={styles.focusBannerEyebrow}>{selectedRoleAccent.eyebrow}</p>
            <p className={styles.focusBannerText}>{selectedRoleAccent.promise}</p>
          </section>

          {activeTab !== 'verify' && (
            <nav className={styles.roleTabs} aria-label="Choose account type">
              {LOGIN_ROLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.roleTab} ${selectedRole === option.id ? styles.roleTabActive : ''}`}
                  onClick={() => handleRoleChange(option.id)}
                  aria-pressed={selectedRole === option.id}
                >
                  <strong>{option.label}</strong>
                  <span>{option.id === 'STAFF' ? 'Counter operations' : option.id === 'ADMIN' ? 'Operations control' : 'Booking and rewards'}</span>
                </button>
              ))}
            </nav>
          )}

          {canRegister && activeTab !== 'verify' && (
            <menu className={styles.modeTabs}>
              <li>
                <button
                  type="button"
                  className={`${styles.modeTab} ${activeTab === 'login' ? styles.modeTabActive : ''}`}
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Sign in
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`${styles.modeTab} ${activeTab === 'register' ? styles.modeTabActive : ''}`}
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Create account
                </button>
              </li>
            </menu>
          )}

          {error && <p className={styles.errorMsg}>{error}</p>}
          {success && <p className={styles.successMsg}>{success}</p>}

          {activeTab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Sign-in details</legend>

                <label className={styles.fieldLabel} htmlFor="login-phone">
                  Phone number
                </label>
                <input
                  id="login-phone"
                  className={styles.input}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={selectedRoleOption.demoPhone}
                  value={loginPhone}
                  onChange={(event) => setLoginPhone(event.target.value)}
                  required
                />

                <label className={styles.fieldLabel} htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className={styles.input}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </fieldset>

              <dl className={styles.quickInfoGrid}>
                <div className={styles.quickInfoCard}>
                  <dt>Portal</dt>
                  <dd>{selectedRoleOption.label}</dd>
                </div>
                <div className={styles.quickInfoCard}>
                  <dt>Demo number</dt>
                  <dd>{selectedRoleOption.demoPhone}</dd>
                </div>
                <div className={styles.quickInfoCard}>
                  <dt>Destination</dt>
                  <dd>{selectedRoleOption.destination}</dd>
                </div>
              </dl>

              <button className={styles.primaryButton} type="submit">
                Continue to {selectedRoleOption.label}
              </button>
            </form>
          )}

          {activeTab === 'register' && canRegister && (
            <section className={styles.embeddedPanel} aria-label="Customer registration">
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </section>
          )}

          {activeTab === 'verify' && (
            <section className={styles.embeddedPanel} aria-label="Account verification">
              <VerifyOtpForm
                phone={verifyPhone}
                confirmationResult={confirmationResult}
                setConfirmationResult={setConfirmationResult}
                onBack={() => setActiveTab('register')}
                onSuccess={handleVerifySuccess}
              />
            </section>
          )}

          <section className={styles.demoPanel} aria-labelledby="demo-access-title">
            <h3 id="demo-access-title" className={styles.demoTitle}>
              Demo access guide
            </h3>
            <dl className={styles.demoList}>
              {LOGIN_ROLE_OPTIONS.map((option) => (
                <div key={option.id} className={styles.demoItem}>
                  <dt>{option.label}</dt>
                  <dd>
                    {option.demoPhone} / {option.demoPassword}
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.demoNote}>
              The credentials stay visible here so reviewers can compare each role experience without friction.
            </p>
          </section>

          {selectedRole === 'CUSTOMER' && activeTab !== 'verify' && (
            <footer className={styles.cardFooter}>
              <p className={styles.footerNote}>Need a quicker path? Continue as a guest and finish booking first.</p>
              <button className={styles.guestBtn} type="button" onClick={handleGuest}>
                Continue as guest customer
              </button>
            </footer>
          )}
        </section>
      </main>
    </div>
  );
};
