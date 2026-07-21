import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { AlertTriangle, Droplets, Loader2 } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { isFirebaseConfigured, sendOtp, confirmOtp, signInWithGoogle } from '@/lib/firebase';
import { toE164 } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { useAuth } from '../AuthContext';
import { login as loginRequest, register as registerRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

type Mode = 'login' | 'register';
type RegisterStep = 'enter-phone' | 'enter-code' | 'enter-details';

function friendlyError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-verification-code') return 'Mã OTP không đúng, thử lại.';
  if (code === 'auth/too-many-requests') return 'Bạn thử quá nhiều lần, vui lòng chờ rồi thử lại.';
  if (code === 'auth/invalid-phone-number') return 'Số điện thoại không hợp lệ.';
  if (code === 'auth/popup-closed-by-user') return 'Bạn đã đóng cửa sổ đăng nhập Google.';
  if (code === 'auth/cancelled-popup-request') return 'Đã hủy yêu cầu đăng nhập Google, thử lại.';
  return 'Có lỗi xảy ra, vui lòng thử lại.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setSession } = useAuth();
  const navState = location.state as { from?: { pathname: string }; mode?: Mode } | null;
  const redirectTo = navState?.from?.pathname ?? '/app';

  const [mode, setMode] = useState<Mode>(navState?.mode ?? 'login');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [step, setStep] = useState<RegisterStep>('enter-phone');
  const [authMethod, setAuthMethod] = useState<'phone' | 'google'>('phone');
  const [regPhone, setRegPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(loginPhone, loginPassword);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    const e164 = toE164(regPhone);
    if (!e164) {
      setError('Số điện thoại không hợp lệ (VD: 0912345678).');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await sendOtp(e164, RECAPTCHA_CONTAINER_ID);
      setConfirmation(result);
      setStep('enter-code');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError(null);
    setBusy(true);
    try {
      const user = await confirmOtp(confirmation, code.trim());
      setFirebaseToken(await user.getIdToken());
      setStep('enter-details');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      setFirebaseToken(await user.getIdToken());
      setName(user.displayName ?? '');
      setEmail(user.email ?? '');
      setAuthMethod('google');
      setStep('enter-details');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBackToRegisterEntry = () => {
    setError(null);
    setFirebaseToken(null);
    setAuthMethod('phone');
    setStep('enter-phone');
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseToken) return;
    setError(null);
    setBusy(true);
    try {
      await registerRequest({
        name,
        phone: toE164(regPhone) ?? regPhone,
        password,
        email: email.trim() || undefined,
        firebaseToken,
      });
      // Register doesn't return a session token itself — log in right after.
      const result = await loginRequest(regPhone, password);
      setSession(result.token, result.customer);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <button
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-text-primary"
      >
        <span className="rounded-xl bg-primary/10 p-2 text-primary">
          <Droplets className="h-5 w-5" />
        </span>
        <span className="font-display font-bold">AutoWash Pro</span>
      </button>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-text-primary">
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
        </h1>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Số điện thoại + mật khẩu. Đăng ký cần xác minh OTP trước.
        </p>

        {!isFirebaseConfigured && mode === 'register' && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chưa cấu hình Firebase (Front-end/.env) — gửi OTP sẽ báo lỗi.</span>
          </div>
        )}

        <div className="mb-5 flex rounded-xl border border-border p-0.5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={cn(
              'flex-1 rounded-[10px] py-2 transition-colors',
              mode === 'login' ? 'bg-primary text-white' : 'text-text-secondary',
            )}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={cn(
              'flex-1 rounded-[10px] py-2 transition-colors',
              mode === 'register' ? 'bg-primary text-white' : 'text-text-secondary',
            )}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Số điện thoại">
              <Input
                placeholder="0912345678"
                inputMode="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
              />
            </Field>
            <Field label="Mật khẩu">
              <Input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Đăng nhập
            </Button>
          </form>
        )}

        {mode === 'register' && step === 'enter-phone' && (
          <div className="space-y-4">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Field label="Số điện thoại">
                <Input
                  placeholder="0912345678"
                  inputMode="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi mã OTP
              </Button>
            </form>

            {isFirebaseConfigured && (
              <>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="h-px flex-1 bg-border" />
                  hoặc
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="w-full"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Đăng ký bằng Google
                </Button>
              </>
            )}
          </div>
        )}

        {mode === 'register' && step === 'enter-code' && (
          <form onSubmit={handleConfirmOtp} className="space-y-4">
            <Field label={`Mã OTP đã gửi tới ${regPhone}`}>
              <Input
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
            <button
              type="button"
              onClick={() => setStep('enter-phone')}
              className="w-full text-center text-sm text-text-secondary hover:text-text-primary"
            >
              Đổi số điện thoại
            </button>
          </form>
        )}

        {mode === 'register' && step === 'enter-details' && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            {authMethod === 'google' && (
              <Field label="Số điện thoại">
                <Input
                  placeholder="0912345678"
                  inputMode="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </Field>
            )}
            <Field label="Họ tên">
              <Input placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={authMethod === 'google' ? 'Email (đã xác minh qua Google)' : 'Email (không bắt buộc)'}>
              <Input
                type="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={authMethod === 'google'}
                className={authMethod === 'google' ? 'opacity-70' : undefined}
              />
            </Field>
            <Field label="Mật khẩu (tối thiểu 6 ký tự)">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              disabled={
                busy ||
                password.length < 6 ||
                !name.trim() ||
                (authMethod === 'google' && !toE164(regPhone))
              }
              className="w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Hoàn tất đăng ký
            </Button>
            {authMethod === 'google' && (
              <button
                type="button"
                onClick={handleBackToRegisterEntry}
                className="w-full text-center text-sm text-text-secondary hover:text-text-primary"
              >
                Quay lại
              </button>
            )}
          </form>
        )}

        <button
          onClick={() => navigate('/booking')}
          className="mt-6 w-full text-center text-sm text-primary hover:underline"
        >
          Đặt lịch không cần tài khoản
        </button>
      </div>

      {/* Invisible reCAPTCHA anchor for Firebase phone auth (register only). */}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  );
}
