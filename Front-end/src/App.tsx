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
import { mockStore } from './services/mockStore';
import { AdminRouter } from './routes/AdminRouter';
import { WashingCounterPage } from './pages/washing-counter/WashingCounterPage';
import { BrowserRouter } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { CustomerBookingProvider } from './context/CustomerBookingContext';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

function CustomerPortal() {
  const { currentUser, refreshUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const handleNavigate = (page: string) => {
    setActivePage(page as PageId);
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
              bookings={bookingService.getBookings(currentUser?.id || '')}
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
            <LoyaltyTierSection 
              currentTier={currentUser?.tier} 
              currentPoints={currentUser?.accumulatedPoints} 
              totalSpend={currentUser?.totalSpend}
              completedWashes={bookingService.getBookings(currentUser?.id || '').filter(b => b.status === 'COMPLETED').length}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
              {currentUser && <ProfileCard customer={currentUser} />}
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
                  transactions={mockStore.getTransactionsByCustomer(currentUser?.id || '')}
                />
              </div>
            </div>
            {currentUser && (
              <VoucherShop 
                customerId={currentUser.id} 
                points={currentUser.accumulatedPoints} 
                onChanged={() => {
                   refreshUser();
                }} 
              />
            )}
          </div>
        );

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <CustomerBookingProvider>
      <CustomerLayout activeNav={activePage} onNavChange={handleNavigate}>
        {renderPage()}
      </CustomerLayout>
    </CustomerBookingProvider>
  );
}

function App() {
  const { isAuthenticated, role } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding && !isAuthenticated) {
    return <LandingPage onNavigateToAuth={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  if (role === 'ADMIN') {
    return (
      <BrowserRouter>
        <AdminRouter />
      </BrowserRouter>
    );
  }

  if (role === 'COUNTER') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <BookingProvider>
          <WashingCounterPage />
        </BookingProvider>
      </div>
    );
  }

  return <CustomerPortal />;
}

export default App;
