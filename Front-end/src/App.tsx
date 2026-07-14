import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './features/customer/pages/LoginPage';
import { LandingPage } from './features/customer/pages/LandingPage';
import { DashboardPage } from './features/customer/pages/DashboardPage';
import { BookingWizardPage } from './features/customer/pages/BookingWizardPage';
import { VehicleList } from './features/customer/components/VehicleList';
import { BookingHistory } from './features/customer/components/BookingHistory';
import { PointsHistory } from './features/customer/components/PointsHistory';
import { PromotionDisplay } from './features/customer/components/PromotionDisplay';
import { ProfileCard } from './features/customer/components/ProfileCard';
import { LoyaltyTierSection } from './features/customer/components/LoyaltyTierSection';
import { VoucherShop } from './features/customer/components/VoucherShop';
import { CustomerLayout } from './layouts/CustomerLayout';
import { bookingService } from './services/customer/booking.service';
import { platformService } from './services/platform.service';
import { Booking, PointsTransaction } from './types';
import { WashingPortal } from './features/operations/OperationsPortal';
import { getPortalForUser } from './features/auth/roleAccess';
import { AdminCustomerRegistryPage } from './features/admin/pages/AdminCustomerRegistryPage';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

function CustomerPortal() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [history, setHistory] = useState<Booking[]>([]);
  const [points, setPoints] = useState<PointsTransaction[]>([]);
  const [pointBalance, setPointBalance] = useState(currentUser?.accumulatedPoints || 0);

  const refreshPoints = async () => {
    if (!currentUser) return;
    const rows = await platformService.points(currentUser.id);
    setPoints(rows);
    setPointBalance(rows.reduce((total, row) => total + row.points, 0));
  };

  const handleNavigate = (page: string) => {
    setActivePage(page as PageId);
    if (page === 'history' && currentUser) bookingService.getBookings(currentUser.id).then(setHistory);
    if (page === 'points' && currentUser) void refreshPoints();
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'booking':
        return (
          <BookingWizardPage
            onComplete={() => setActivePage('dashboard')}
            onCancel={() => setActivePage('dashboard')}
          />
        );

      case 'vehicles':
        return <VehicleList />;

      case 'history':
        return (
          <div>
            <BookingHistory
              bookings={history}
            />
          </div>
        );

      case 'promotions':
        return (
          <div style={{ maxWidth: 600 }}>
            <PromotionDisplay />
          </div>
        );

      case 'points':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LoyaltyTierSection currentTier={currentUser?.tier} currentPoints={pointBalance} />
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
              {currentUser && <ProfileCard customer={{...currentUser, accumulatedPoints: pointBalance}} />}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                ⭐ Points History
              </h3>
              <PointsHistory
                transactions={points}
              />
            </div>
            </div>
            {currentUser && <VoucherShop customerId={currentUser.id} points={pointBalance} onChanged={refreshPoints} />}
          </div>
        );

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <CustomerLayout activeNav={activePage} onNavChange={handleNavigate}>
      {renderPage()}
    </CustomerLayout>
  );
}

function App() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding && !isAuthenticated) {
    return <LandingPage onNavigateToAuth={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  const portal=getPortalForUser(currentUser);
  if(portal==='washing') return <div><header style={{padding:12,display:'flex',justifyContent:'space-between',background:'#e0f2fe'}}><b>AutoWash Pro · Washing Counter</b><button onClick={logout}>Logout</button></header><main style={{maxWidth:1100,margin:'24px auto',padding:16}}><WashingPortal /></main></div>;
  if(portal==='admin') return <div><header style={{padding:12,display:'flex',justifyContent:'space-between',background:'#e0f2fe'}}><b>AutoWash Pro · Administration</b><button onClick={logout}>Logout</button></header><main style={{maxWidth:1200,margin:'24px auto',padding:16}}><AdminCustomerRegistryPage /></main></div>;
  return <CustomerPortal />;
}

export default App;
