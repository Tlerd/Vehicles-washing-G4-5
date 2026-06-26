import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './features/customer/pages/LoginPage';
import { DashboardPage } from './features/customer/pages/DashboardPage';
import { BookingWizardPage } from './features/customer/pages/BookingWizardPage';
import { VehicleList } from './features/customer/components/VehicleList';
import { BookingHistory } from './features/customer/components/BookingHistory';
import { PointsHistory } from './features/customer/components/PointsHistory';
import { PromotionDisplay } from './features/customer/components/PromotionDisplay';
import { ProfileCard } from './features/customer/components/ProfileCard';
import { LoyaltyTierSection } from './features/customer/components/LoyaltyTierSection';
import { CustomerLayout } from './layouts/CustomerLayout';
import { bookingService } from './services/customer/booking.service';
import { mockStore } from './services/mockStore';
import { AdminCustomerRegistryPage } from './features/admin/pages/AdminCustomerRegistryPage';
import { getPortalForUser } from './features/auth/roleAccess';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

function CustomerPortal() {
  const { currentUser } = useAuth();
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
            <LoyaltyTierSection currentTier={currentUser?.tier} currentPoints={currentUser?.accumulatedPoints} />
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
                  Point history
                </h3>
                <PointsHistory
                  transactions={mockStore.getTransactionsByCustomer(currentUser?.id || '')}
                />
              </div>
            </div>
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
  const { currentUser, logout } = useAuth();
  const portal = getPortalForUser(currentUser);

  if (portal === 'admin') {
    return <AdminCustomerRegistryPage onBackToCustomerPortal={logout} />;
  }

  if (portal === 'auth') {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return <CustomerPortal />;
}

export default App;
