import React, { useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
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
import { platformService } from '../services/platform.service';
import { useAuth } from '../context/AuthContext';
import { Booking, PointsTransaction } from '../types';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

export const AppRouter: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCustomerActivity = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const [bookingRows, pointRows] = await Promise.all([
        bookingService.getBookings(currentUser.id),
        platformService.points(currentUser.id),
      ]);
      setBookings(bookingRows);
      setTransactions(pointRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load customer activity.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activePage === 'history' || activePage === 'points') void loadCustomerActivity();
  }, [activePage, loadCustomerActivity]);

  const handleNavigate = (page: string) => setActivePage(page as PageId);
  const completedWashes = bookings.filter((booking) => booking.status === 'COMPLETED').length;

  const activityState = loading ? (
    <p role="status">Loading data from AutoWash Pro...</p>
  ) : error ? (
    <div role="alert">
      <p>{error}</p>
      <button type="button" onClick={() => void loadCustomerActivity()}>Try again</button>
    </div>
  ) : null;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'booking':
        return (
          <BookingWizardPage
            onComplete={() => {
              setActivePage('dashboard');
              void refreshUser();
            }}
            onCancel={() => setActivePage('dashboard')}
          />
        );
      case 'vehicles':
        return <VehicleList />;
      case 'history':
        return activityState || <BookingHistory bookings={bookings} />;
      case 'promotions':
        return <PromotionDisplay />;
      case 'points':
        if (activityState) return activityState;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <LoyaltyTierSection
              currentTier={currentUser?.tier}
              currentPoints={currentUser?.accumulatedPoints}
              totalSpend={currentUser?.totalSpend}
              completedWashes={currentUser?.totalWashes ?? completedWashes}
            />
            {currentUser && (
              <VoucherShop
                customerId={currentUser.id}
                points={currentUser.accumulatedPoints}
                onChanged={async () => {
                  await refreshUser();
                  await loadCustomerActivity();
                }}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) minmax(0, 1fr)', gap: 24 }}>
              {currentUser && <ProfileCard customer={currentUser} />}
              <PointsHistory transactions={transactions} />
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
