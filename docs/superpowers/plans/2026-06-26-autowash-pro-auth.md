# Customer Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a premium, fully interactive React Authentication page (Sign In, Sign Up, and Quick Booking/Guest Checkout) styling it with a glassmorphic dark theme, corresponding to the Stitch mockup design.

**Architecture:** Use modular React functional components and simple state hooks to track the current login state, validation messages, and visual tab selection.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React (Icons).

## Global Constraints
- Target platform is desktop first with fluid layout support.
- Colors must match tailwind config (`brand.orange` `#f97316`, `darkBg` `#031427`).
- Language matches the design specifications (mixture of English headers and Vietnamese labels/placeholders where appropriate).
- No external libraries other than Lucide icons and default dependencies.

---

### Task 1: Create TypeScript Types
Create the TypeScript type definitions for credentials, registration data, and mock users to ensure type safety.

**Files:**
- Create: `Front-end/src/types/auth.ts`

**Interfaces:**
- Produces: `Credentials`, `RegistrationData`, `GuestBookingData`, `UserSession` interfaces.

- [ ] **Step 1: Write type definitions**
  Create `Front-end/src/types/auth.ts` with the following content:
  ```typescript
  export interface UserSession {
    fullName: string;
    phone: string;
    email?: string;
    role: 'MEMBER' | 'GUEST';
  }

  export interface Credentials {
    phone: string;
    password: string;
  }

  export interface RegistrationData {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword: string;
    otp: string;
  }

  export interface GuestBookingData {
    phone: string;
    licensePlate: string;
    vehicleModel: string;
  }
  ```
- [ ] **Step 2: Verify compiling**
  Run: `npm run build` in the `Front-end` directory to verify there are no compilation errors.
- [ ] **Step 3: Commit**
  ```bash
  git add Front-end/src/types/auth.ts
  git commit -m "feat(auth): add type definitions for customer authentication"
  ```

---

### Task 2: Create AuthPage Component
Create the functional `AuthPage` component using glassmorphism aesthetics and interactive state handling for tab switching and forms.

**Files:**
- Create: `Front-end/src/components/auth/AuthPage.tsx`

**Interfaces:**
- Consumes: `UserSession`, `Credentials`, `RegistrationData`, `GuestBookingData` from `Front-end/src/types/auth.ts`
- Produces: `AuthPage` component, accepting `onLoginSuccess: (user: UserSession) => void` as prop.

- [ ] **Step 1: Implement AuthPage component**
  Write the React code for the form switching, inputs validation, design elements matching the Stitch theme, and custom visual cues.
  ```tsx
  import React, { useState } from 'react';
  import { UserSession } from '../../types/auth';
  import { Car, Smartphone, KeyRound, User, Mail, ShieldAlert, Award, Star, Gem, HelpCircle } from 'lucide-react';

  interface AuthPageProps {
    onLoginSuccess: (user: UserSession) => void;
  }

  export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
    const [isSignUp, setIsSignUp] = useState(true);
    
    // Sign Up Fields
    const [fullName, setFullName] = useState('');
    const [signUpPhone, setSignUpPhone] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    // Sign In Fields
    const [signInPhone, setSignInPhone] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    
    // Guest Fields
    const [guestPhone, setGuestPhone] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    
    // UI Helpers
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = () => {
      if (!signUpPhone) {
        setErrorMsg('Vui lòng nhập số điện thoại để nhận OTP.');
        return;
      }
      setOtpSent(true);
      setErrorMsg('');
      setSuccessMsg('Mã OTP đã được gửi đến số điện thoại của bạn (Mã giả lập: 123456).');
    };

    const handleSignUp = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');

      if (!fullName || !signUpPhone || !signUpPassword || !confirmPassword || !otp) {
        setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
        return;
      }
      if (signUpPassword !== confirmPassword) {
        setErrorMsg('Mật khẩu nhập lại không khớp.');
        return;
      }
      if (otp !== '123456') {
        setErrorMsg('Mã OTP không hợp lệ. Vui lòng thử lại với mã 123456.');
        return;
      }

      const mockSession: UserSession = {
        fullName,
        phone: signUpPhone,
        email: signUpEmail || undefined,
        role: 'MEMBER'
      };
      setSuccessMsg('Đăng ký thành công!');
      setTimeout(() => onLoginSuccess(mockSession), 1000);
    };

    const handleSignIn = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');

      if (!signInPhone || !signInPassword) {
        setErrorMsg('Vui lòng nhập số điện thoại và mật khẩu.');
        return;
      }

      const mockSession: UserSession = {
        fullName: 'Khách hàng Thân thiết',
        phone: signInPhone,
        role: 'MEMBER'
      };
      setSuccessMsg('Đăng nhập thành công!');
      setTimeout(() => onLoginSuccess(mockSession), 1000);
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');

      if (!guestPhone || !licensePlate || !vehicleModel) {
        setErrorMsg('Vui lòng cung cấp đầy đủ thông tin để Đặt lịch nhanh.');
        return;
      }

      const mockSession: UserSession = {
        fullName: `Khách vãng lai (${licensePlate})`,
        phone: guestPhone,
        role: 'GUEST'
      };
      setSuccessMsg('Đăng nhập dưới quyền khách thành công!');
      setTimeout(() => onLoginSuccess(mockSession), 1000);
    };

    return (
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 my-8 px-4 font-sans text-slate-100">
        
        {/* LEFT COLUMN: MEMBER PORTAL */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                {isSignUp ? 'Member Registration' : 'Member Login'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isSignUp 
                  ? 'Create an account for exclusive detailing benefits.' 
                  : 'Sign in to access your loyalty account and detailing history.'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-slate-950/60 rounded-xl p-1 mb-6 border border-slate-800/50">
              <button 
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isSignUp 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                Sign Up
              </button>
              <button 
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  !isSignUp 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 bg-transparent'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Errors & Status Alerts */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-start gap-2.5 mb-6">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs mb-6">
                {successMsg}
              </div>
            )}

            {/* Sign Up Form */}
            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Họ tên *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                        placeholder="Họ và tên"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Số điện thoại *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="tel" 
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                        placeholder="Số điện thoại"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Mật khẩu *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="password" 
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                        placeholder="Mật khẩu"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Nhập lại mật khẩu *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                        placeholder="Xác nhận mật khẩu"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Xác thực OTP *</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 text-center tracking-widest font-mono focus:outline-none focus:border-orange-500 flex-grow transition-all"
                      placeholder="Mã OTP 6 số"
                      required
                    />
                    <button 
                      type="button"
                      onClick={handleSendOtp}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-6 rounded-xl border border-slate-750 transition-colors"
                    >
                      {otpSent ? 'Gửi lại' : 'Gửi OTP'}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all text-sm mt-4"
                >
                  Complete Registration
                </button>
              </form>
            ) : (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Số điện thoại *</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      value={signInPhone}
                      onChange={(e) => setSignInPhone(e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Mật khẩu *</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="bg-slate-950/40 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors">
                    Forgot Password?
                  </a>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all text-sm mt-2"
                >
                  Đăng nhập
                </button>
              </form>
            )}
          </div>

          {/* Loyalty Info Visual */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4 text-center">
              Loyalty Tiers & Benefits
            </p>
            <div className="flex justify-between items-center px-4">
              <div className="flex flex-col items-center gap-1">
                <Car className="w-5 h-5 text-slate-400 opacity-60" />
                <span className="text-[10px] font-bold text-slate-400">Member</span>
              </div>
              <div className="h-[1px] flex-grow bg-slate-800 mx-2"></div>
              <div className="flex flex-col items-center gap-1">
                <Star className="w-5 h-5 text-slate-300 opacity-70" />
                <span className="text-[10px] font-bold text-slate-300">Silver</span>
              </div>
              <div className="h-[1px] flex-grow bg-slate-800 mx-2"></div>
              <div className="flex flex-col items-center gap-1">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-[10px] font-bold text-yellow-500">Gold</span>
              </div>
              <div className="h-[1px] flex-grow bg-slate-800 mx-2"></div>
              <div className="flex flex-col items-center gap-1">
                <Gem className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400">Platinum</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK BOOKING / GUEST */}
        <div className="bg-slate-950/20 border border-slate-900/60 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-md">
              <Star className="w-6 h-6 text-orange-500 fill-orange-500/10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Quick Booking / Guest</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Skip the full registration process. A guest account will be auto-created using the Phone Number + License Plate.
              </p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Guest Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="tel" 
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="bg-slate-950/40 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all"
                    placeholder="Số điện thoại khách hàng"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Biển số xe *</label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="bg-slate-950/40 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 uppercase tracking-wider focus:outline-none focus:border-orange-500 w-full transition-all font-semibold"
                    placeholder="Ví dụ: 51G-123.45"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Dòng xe *</label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select 
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="bg-slate-950/40 border border-slate-800 rounded-xl py-3.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full transition-all appearance-none"
                    required
                  >
                    <option value="" disabled>Chọn dòng xe</option>
                    <option value="sedan">Sedan / Hatchback (4-5 chỗ)</option>
                    <option value="suv">SUV / Crossover (5-7 chỗ)</option>
                    <option value="pickup">Pickup (Xe bán tải)</option>
                    <option value="luxury">Luxury / Cận sang</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all text-sm mt-6 flex items-center justify-center gap-2"
              >
                Start Quick Booking
                <span>➔</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    );
  }
  ```
- [ ] **Step 2: Verify compilation**
  Run: `npm run build` in the `Front-end` folder to ensure code compiles successfully.
- [ ] **Step 3: Commit**
  ```bash
  git add Front-end/src/components/auth/AuthPage.tsx
  git commit -m "feat(auth): implement glassmorphic AuthPage with state transitions"
  ```

---

### Task 3: Integrate and Run App verification
Update the entry `App.tsx` file to render the interactive `AuthPage` and handle the user session state.

**Files:**
- Modify: `Front-end/src/App.tsx`

**Interfaces:**
- Consumes: `AuthPage` from `Front-end/src/components/auth/AuthPage.tsx`, `UserSession` from `Front-end/src/types/auth.ts`

- [ ] **Step 1: Modify App.tsx**
  Update the React app boilerplate to manage mock user login state and show success dashboard status.
  ```tsx
  import React, { useState } from 'react';
  import { UserSession } from './types/auth';
  import AuthPage from './components/auth/AuthPage';
  import { Car, LogOut, CheckCircle } from 'lucide-react';

  export default function App() {
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

    const handleLoginSuccess = (user: UserSession) => {
      setCurrentUser(user);
    };

    const handleLogOut = () => {
      setCurrentUser(null);
    };

    return (
      <div className="min-h-screen bg-[#031427] text-slate-100 flex flex-col justify-between font-sans">
        
        {/* Navigation Bar */}
        <header className="w-full bg-[#020b16]/60 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              AutoWash <span className="text-orange-500">Pro</span>
            </span>
          </div>

          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-200">{currentUser.fullName}</p>
                <p className="text-[10px] text-slate-500 tracking-wide uppercase font-mono">{currentUser.role} • {currentUser.phone}</p>
              </div>
              <button 
                onClick={handleLogOut}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* Main Body content */}
        <main className="flex-grow flex items-center justify-center py-10">
          {!currentUser ? (
            <AuthPage onLoginSuccess={handleLoginSuccess} />
          ) : (
            <div className="max-w-md w-full bg-[#020b16]/60 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center mx-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Authentication Successful
              </h1>
              <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide uppercase">
                Welcome back to AutoWash Pro
              </p>

              <div className="w-12 h-[1px] bg-slate-800 my-6"></div>

              <div className="w-full text-left bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-2 mb-8">
                <p className="text-xs text-slate-400">FullName: <span className="font-semibold text-slate-200">{currentUser.fullName}</span></p>
                <p className="text-xs text-slate-400">Phone: <span className="font-semibold text-slate-200">{currentUser.phone}</span></p>
                <p className="text-xs text-slate-400">Role: <span className="font-semibold text-slate-200">{currentUser.role}</span></p>
                {currentUser.email && (
                  <p className="text-xs text-slate-400">Email: <span className="font-semibold text-slate-200">{currentUser.email}</span></p>
                )}
              </div>

              <span className="text-[10px] font-mono text-slate-600 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-850">
                SU26SWP08 • Group 4 & 5
              </span>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full bg-[#010912]/80 border-t border-slate-900/50 px-6 py-4 flex justify-between items-center text-[11px] text-slate-500">
          <span>© 2026 AutoWash Pro. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          </div>
        </footer>
      </div>
    );
  }
  ```
- [ ] **Step 2: Build verification**
  Run: `npm run build` in the `Front-end` folder to ensure compiling is successful.
- [ ] **Step 3: Commit**
  ```bash
  git add Front-end/src/App.tsx
  git commit -m "feat(auth): integrate AuthPage and handle active user sessions in App"
  ```
