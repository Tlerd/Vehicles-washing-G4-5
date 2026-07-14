import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
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
import { CustomerPageSection, CustomerPageShell } from './features/customer/components/CustomerPageShell';
import { CustomerLayout } from './layouts/CustomerLayout';
import { bookingService } from './services/customer/booking.service';
import { mockStore } from './services/mockStore';
import { MOCK_PROMOTIONS } from './config/constants';
import { AdminRouter } from './routes/AdminRouter';
import { WashingCounterPage } from './pages/washing-counter/WashingCounterPage';
import { BookingProvider } from './context/BookingContext';
import { CustomerBookingProvider } from './context/CustomerBookingContext';
import { formatPrice } from './utils/formatters';
import portalStyles from './features/customer/styles/CustomerPortalPages.module.css';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

function CustomerPortal() {
  const { currentUser, refreshUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const customerId = currentUser?.id || '';
  const customerBookings = bookingService.getBookings(customerId);
  const customerVehicles = mockStore.getVehiclesByCustomer(customerId);
  const customerTransactions = mockStore.getTransactionsByCustomer(customerId);
  const completedBookings = customerBookings.filter((booking) => booking.status === 'COMPLETED').length;
  const pendingBookings = customerBookings.filter((booking) =>
    ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status)
  ).length;
  const currentPoints = currentUser?.accumulatedPoints || 0;

  const handleNavigate = (page: string) => {
    setActivePage(page as PageId);
  };

  const sharedAside = (
    <div className={portalStyles.summaryCard}>
      <span className={portalStyles.summaryEyebrow}>AutoWash Pro</span>
      <h3 className={portalStyles.summaryTitle}>{currentUser?.tier || 'Member'} experience</h3>
      <p className={portalStyles.summaryText}>
        Bookings, saved vehicles, and reward points stay connected in one clear car-care journey.
      </p>
      <div className={portalStyles.summaryList}>
        <div className={portalStyles.summaryItem}>
          <span>Pending bookings</span>
          <strong>{pendingBookings}</strong>
        </div>
        <div className={portalStyles.summaryItem}>
          <span>Saved vehicles</span>
          <strong>{customerVehicles.length}</strong>
        </div>
        <div className={portalStyles.summaryItem}>
          <span>Current points</span>
          <strong>{currentPoints.toLocaleString('vi-VN')}</strong>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'booking':
        return (
          <CustomerPageShell
            eyebrow="Booking flow"
            title="Book car care faster"
            description="The signed-in booking flow now sits in one consistent, step-by-step workspace that is easier to scan on desktop and mobile."
            stats={[
              { label: 'Available vehicles', value: customerVehicles.length.toString(), helper: 'Choose quickly from saved profiles' },
              { label: 'Pending bookings', value: pendingBookings.toString(), helper: 'Track from History' },
              { label: 'Completed bookings', value: completedBookings.toString(), helper: 'Based on the current account' },
            ]}
            actions={[
              { label: 'Back to dashboard', onClick: () => handleNavigate('dashboard'), variant: 'secondary' },
              { label: 'View rewards', onClick: () => handleNavigate('points') },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Booking wizard"
              description="Each booking step is framed in a consistent content area so customers can stay focused."
            >
              <BookingWizardPage
                onComplete={() => setActivePage('dashboard')}
                onCancel={() => setActivePage('dashboard')}
              />
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'vehicles':
        return (
          <CustomerPageShell
            eyebrow="Vehicle profile"
            title="Manage saved vehicles"
            description="Saved vehicles now use the same intro, card, and spacing system as the rest of the signed-in customer portal."
            stats={[
              { label: 'Total vehicles', value: customerVehicles.length.toString(), helper: 'Supports faster booking' },
              { label: 'Completed bookings', value: completedBookings.toString(), helper: 'Linked to service history' },
              { label: 'Reward points', value: currentPoints.toLocaleString('vi-VN'), helper: 'Ready for voucher redemption' },
            ]}
            actions={[
              { label: 'New booking', onClick: () => handleNavigate('booking') },
              { label: 'View history', onClick: () => handleNavigate('history'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Personal garage"
              description="Save vehicle details, plates, and sizes to shorten future booking flows."
            >
              <VehicleList />
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'history':
        return (
          <CustomerPageShell
            eyebrow="Booking history"
            title="Track the full service journey"
            description="Booking history uses a bright, scannable layout that matches the refreshed dashboard."
            stats={[
              { label: 'Total bookings', value: customerBookings.length.toString(), helper: 'Includes every status' },
              { label: 'Completed', value: completedBookings.toString(), helper: 'Finished service visits' },
              { label: 'Pending', value: pendingBookings.toString(), helper: 'Needs short-term attention' },
            ]}
            actions={[
              { label: 'Book again', onClick: () => handleNavigate('booking') },
              { label: 'View promotions', onClick: () => handleNavigate('promotions'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Recent and past bookings"
              description="Review recent appointments, service status, and the total value of each booking."
            >
              <BookingHistory bookings={customerBookings} />
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'promotions':
        return (
          <CustomerPageShell
            eyebrow="Promotions"
            title="Offers for the next service visit"
            description="Promotions now share the same content frame, helping customers spot campaigns, vouchers, and the next booking action faster."
            stats={[
              { label: 'Active offers', value: MOCK_PROMOTIONS.length.toString(), helper: 'Updated from the current catalog' },
              { label: 'Current points', value: currentPoints.toLocaleString('vi-VN'), helper: 'Available for rewards' },
              { label: 'Pending bookings', value: pendingBookings.toString(), helper: 'May apply to eligible visits' },
            ]}
            actions={[
              { label: 'Book now', onClick: () => handleNavigate('booking') },
              { label: 'Open rewards', onClick: () => handleNavigate('points'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Open offers"
              description="Featured campaigns and seasonal rewards are presented with the same card language as the portal."
            >
              <div className={portalStyles.narrowContent}>
                <PromotionDisplay />
              </div>
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'points':
        return (
          <CustomerPageShell
            eyebrow="Rewards center"
            title="Reward points, loyalty, and vouchers"
            description="Rewards are split into tier overview, customer profile, points history, and voucher exchange areas for easier tracking."
            stats={[
              { label: 'Current points', value: currentPoints.toLocaleString('vi-VN'), helper: 'Ready to redeem' },
              { label: 'Current tier', value: currentUser?.tier || 'Member', helper: 'Based on current loyalty status' },
              { label: 'Total spend', value: formatPrice(currentUser?.totalSpend || 0), helper: 'Supports tier review' },
              { label: 'Point transactions', value: customerTransactions.length.toString(), helper: 'Includes earning and redemption' },
            ]}
            actions={[
              { label: 'Book to earn points', onClick: () => handleNavigate('booking') },
              { label: 'View history', onClick: () => handleNavigate('history'), variant: 'secondary' },
            ]}
            aside={
              <div className={portalStyles.summaryCard}>
                <span className={portalStyles.summaryEyebrow}>Rewards summary</span>
                <h3 className={portalStyles.summaryTitle}>Optimize member benefits</h3>
                <p className={portalStyles.summaryText}>
                  Use available points for vouchers or keep earning toward higher tiers on future service visits.
                </p>
                <div className={portalStyles.summaryList}>
                  <div className={portalStyles.summaryItem}>
                    <span>Completed</span>
                    <strong>{completedBookings}</strong>
                  </div>
                  <div className={portalStyles.summaryItem}>
                    <span>Current points</span>
                    <strong>{currentPoints.toLocaleString('vi-VN')}</strong>
                  </div>
                  <div className={portalStyles.summaryItem}>
                    <span>Total spend</span>
                    <strong>{formatPrice(currentUser?.totalSpend || 0)}</strong>
                  </div>
                </div>
              </div>
            }
          >
            <div className={portalStyles.pointsLayout}>
              <div className={portalStyles.mainColumn}>
                <CustomerPageSection
                  title="Loyalty overview"
                  description="Track tier progress, benefits, and completion status."
                >
                  <LoyaltyTierSection
                    currentTier={currentUser?.tier}
                    currentPoints={currentUser?.accumulatedPoints}
                    totalSpend={currentUser?.totalSpend}
                    completedWashes={completedBookings}
                  />
                </CustomerPageSection>

                <CustomerPageSection
                  title="Points history"
                  description="Recent earning, redemption, and points changes for this account."
                >
                  <PointsHistory transactions={customerTransactions} />
                </CustomerPageSection>
              </div>

              <div className={portalStyles.sideColumn}>
                <CustomerPageSection
                  title="Customer profile"
                  description="Member information sits next to rewards for quick reference."
                >
                  {currentUser && <ProfileCard customer={currentUser} />}
                </CustomerPageSection>

                <CustomerPageSection
                  title="Voucher store"
                  description="Redeem rewards from the same page with a cleaner card layout."
                >
                  {currentUser && (
                    <VoucherShop
                      customerId={currentUser.id}
                      points={currentUser.accumulatedPoints}
                      onChanged={() => {
                        refreshUser();
                      }}
                    />
                  )}
                </CustomerPageSection>
              </div>
            </div>
          </CustomerPageShell>
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
