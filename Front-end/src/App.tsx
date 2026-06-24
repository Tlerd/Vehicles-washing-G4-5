import React, { useState } from 'react';
import { BookingProvider, useBooking } from './context/BookingContext';
import { AuthPage } from './pages/auth/AuthPage';
import { BookingPage } from './pages/booking/BookingPage';
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard';
import { WashingCounterPage } from './pages/washing-counter/WashingCounterPage';
import { AdminPage } from './pages/admin/AdminPage';
import { LogOut, Car } from 'lucide-react';

function AppContent() {
  const { 
    activeRole, 
    userSession, 
    setUserSession, 
    currentUser, 
    setCurrentUser, 
    loginCustomer 
  } = useBooking();
  
  const [view, setView] = useState<'dashboard' | 'booking'>('dashboard');

  const handleStartBooking = (isGuest: boolean, customerData?: any) => {
    if (isGuest) {
      setCurrentUser({
        id: 'guest',
        name: 'Guest Customer',
        phone: '',
        tier: 'Member',
        accumulatedPoints: 0,
        totalSpend: 0,
        createdAt: new Date().toISOString()
      });
      setView('booking');
    } else {
      const found = loginCustomer(customerData.phone);
      if (found) {
        setCurrentUser(found);
      } else {
        const newCust = {
          id: `c_${Date.now()}`,
          name: customerData.name || 'New Customer',
          phone: customerData.phone,
          tier: customerData.tier || 'Member',
          accumulatedPoints: 0,
          totalSpend: 0,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(newCust);
      }
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserSession(null);
    setView('dashboard');
  };

  // Determine role label and color for the top bar
  const roleMeta: Record<string, { label: string; color: string }> = {
    customer: { label: 'Customer Portal', color: 'text-blue-400' },
    washing_counter: { label: 'Washing Counter', color: 'text-orange-400' },
    admin: { label: 'Admin Panel', color: 'text-emerald-400' },
  };

  const isLoggedIn = !!(userSession || (currentUser && currentUser.id === 'guest'));

  return (
    <div className="min-h-screen bg-[#031427] text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top bar — only shows when logged in */}
      {isLoggedIn && (
        <div className="bg-[#020b16] border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between z-50">
          <div className="flex items-center gap-2.5">
            <Car className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-bold tracking-tight">AutoWash <span className="text-orange-500">Pro</span></span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-semibold uppercase tracking-wider ml-1">
              <span className={roleMeta[activeRole]?.color}>{roleMeta[activeRole]?.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">
              Xin chào, <span className="font-bold text-blue-400">{userSession?.name || currentUser?.name}</span>
              {userSession?.role === 'customer' && currentUser?.id !== 'guest' && (
                <span className="ml-1 text-yellow-400 font-semibold">({currentUser?.tier})</span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-900/30 transition-all"
            >
              <LogOut className="w-3 h-3" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeRole === 'customer' ? (
          currentUser === null ? (
            <AuthPage onStartBooking={handleStartBooking} />
          ) : currentUser.id === 'guest' || view === 'booking' ? (
            <BookingPage onComplete={() => setView('dashboard')} />
          ) : (
            <CustomerDashboard onStartBooking={() => setView('booking')} />
          )
        ) : activeRole === 'washing_counter' ? (
          userSession === null ? (
            <AuthPage onStartBooking={handleStartBooking} />
          ) : (
            <WashingCounterPage />
          )
        ) : (
          userSession === null ? (
            <AuthPage onStartBooking={handleStartBooking} />
          ) : (
            <AdminPage />
          )
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <AppContent />
    </BookingProvider>
  );
}
