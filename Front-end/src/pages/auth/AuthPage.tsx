import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useBooking } from '../../context/BookingContext';
import { Sun, Moon, Car, ShieldAlert, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onStartBooking: (isGuest: boolean, customerData?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onStartBooking }) => {
  const { theme, toggleTheme } = useTheme();
  const { setUserSession, setActiveRole } = useBooking();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Pre-configured role credentials for authorization demonstration
    if (phone === '0901234567' && password === 'password123') {
      const session = { name: 'John Doe (Customer)', phone, role: 'customer' as const };
      setUserSession(session);
      setActiveRole('customer');
      onStartBooking(false, { name: 'John Doe', phone, licensePlate: '51G-123.45', vehicleModel: 'Toyota Camry', tier: 'Gold' });
    } else if (phone === '0987654321' && password === 'password123') {
      const session = { name: 'Counter Staff', phone, role: 'washing_counter' as const };
      setUserSession(session);
      setActiveRole('washing_counter');
    } else if (phone === '0999999999' && password === 'password123') {
      const session = { name: 'System Admin', phone, role: 'admin' as const };
      setUserSession(session);
      setActiveRole('admin');
    } else {
      setErrorMsg('Invalid phone number or password. Check the demo login guides below.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Default register to Customer role
    const session = { name, phone, role: 'customer' as const };
    setUserSession(session);
    setActiveRole('customer');
    onStartBooking(false, { name, phone, licensePlate, vehicleModel, tier: 'Member' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-[#031427] dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Car className="text-brand-orange w-8 h-8 text-orange-500" />
          <span className="text-xl font-bold tracking-tight">AutoWash <span className="text-brand-orange text-orange-500">Pro</span></span>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
          {theme === 'light' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>
      </header>

      {/* Main Split Portal */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Card 1: Member Section */}
        <div className="w-full md:w-1/2 glass-card p-8 min-h-[480px] flex flex-col justify-between bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isLogin ? 'Log In' : 'Sign Up'}</h2>
              <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-sm font-semibold text-brand-orange text-orange-500 hover:underline">
                {isLogin ? 'Create an account' : 'Back to Login'}
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-orange-500 text-slate-900 dark:text-slate-100" placeholder="e.g. 0901234567" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-orange-500 text-slate-900 dark:text-slate-100" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all shadow mt-4">Sign In</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-900 dark:text-slate-100" placeholder="John Doe" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-900 dark:text-slate-100" placeholder="e.g. 0901234567" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">License Plate</label>
                    <input type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-900 dark:text-slate-100" placeholder="e.g. 51F-12345" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vehicle Model</label>
                    <input type="text" required value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-900 dark:text-slate-100" placeholder="Toyota Camry" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-900 dark:text-slate-100" placeholder="Minimum 6 characters" />
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-all shadow mt-2">Sign Up & Start</button>
              </form>
            )}

            {/* Role Demo credentials box */}
            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <span className="font-bold flex items-center gap-1 text-blue-500">
                <ShieldCheck className="w-4 h-4" /> Demo Authorization Accounts:
              </span>
              <div>• <strong>Customer:</strong> 0901234567 (password: password123)</div>
              <div>• <strong>Washing Counter:</strong> 0987654321 (password: password123)</div>
              <div>• <strong>Admin:</strong> 0999999999 (password: password123)</div>
            </div>
          </div>
        </div>

        {/* Card 2: Guest Section */}
        <div className="w-full md:w-1/2 glass-card p-8 min-h-[480px] flex flex-col justify-between bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Quick Booking</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">Guest Checkout</span>
            <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              Short on time? You can book your vehicle appointment in just 2 minutes without creating an account. 
            </p>
            <div className="mt-4 p-4 rounded-xl bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs flex gap-3 text-orange-600 dark:text-orange-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>An account will be generated automatically for you using your Phone Number + License Plate to save your loyalty points.</span>
            </div>
          </div>
          <button onClick={() => onStartBooking(true)} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-3 text-center border border-slate-300 dark:border-slate-700 rounded-xl transition-all shadow-sm">
            Start Quick Booking
          </button>
        </div>
      </main>
    </div>
  );
};
