import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '../features/customer/pages/DashboardPage';
import { BookingWizardPage } from '../features/customer/pages/BookingWizardPage';
import { VehicleList } from '../features/customer/components/VehicleList';
import { BookingHistory } from '../features/customer/components/BookingHistory';
import { PointsHistory } from '../features/customer/components/PointsHistory';
import { PromotionDisplay } from '../features/customer/components/PromotionDisplay';
import { ProfileCard } from '../features/customer/components/ProfileCard';
import { LoyaltyTierSection } from '../features/customer/components/LoyaltyTierSection';
import { VoucherShop } from '../features/customer/components/VoucherShop';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { bookingService } from '../services/customer/booking.service';
import { mockStore } from '../services/mockStore';
import { useAuth } from '../context/AuthContext';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

export const AppRouter: React.FC = () => {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [, setRefreshKey] = useState(0);
  const liveCustomer = currentUser ? mockStore.getCustomerById(currentUser.id) || currentUser : null;

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
            <LoyaltyTierSection currentTier={liveCustomer?.tier} currentPoints={liveCustomer?.accumulatedPoints} />
            {liveCustomer && (
              <VoucherShop
                customerId={liveCustomer.id}
                points={liveCustomer.accumulatedPoints}
                onChanged={() => setRefreshKey(key => key + 1)}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
              {liveCustomer && <ProfileCard customer={liveCustomer} />}
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
                transactions={mockStore.getTransactionsByCustomer(liveCustomer?.id || '')}
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
       <Routes>
          <Route path="/*" element={renderPage()} />
       </Routes>
    </CustomerLayout>
  );
};
