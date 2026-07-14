import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services/customer/booking.service';

import { platformService } from '../../../services/platform.service';
import { Booking, PointsTransaction } from '../../../types';

import { BookingHistory } from '../components/BookingHistory';
import { PromotionDisplay } from '../components/PromotionDisplay';
import { PointsHistory } from '../components/PointsHistory';
import { QuickStats } from '../components/QuickStats';
import { AIAssistantInput } from '../components/AIAssistantInput';
import styles from '../styles/DashboardPage.module.css';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const customerId = currentUser?.id || '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  useEffect(() => { if (customerId) { bookingService.getBookings(customerId).then(setBookings); platformService.points(customerId).then(setTransactions); } }, [customerId]);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h2>Welcome back, {currentUser?.name || 'Guest'}! 👋</h2>
          <p>Your beloved car deserves the best care. Book a wash today.</p>
        </div>
        <button className={styles.welcomeAction} onClick={() => onNavigate('booking')}>
          📅 Book now
        </button>
      </div>

      {/* Quick Stats */}
      <QuickStats
        points={currentUser?.accumulatedPoints || 0}
        totalBookings={totalBookings}
        completedWashes={completedBookings}
        totalSpent={totalSpent}
      />

      {/* AI Assistant */}
      <AIAssistantInput />

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Recent Bookings */}
        <div className={`${styles.section} ${styles.sectionFull}`}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>📋 Recent Bookings</h3>
            <button className={styles.sectionAction} onClick={() => onNavigate('history')}>
              View all →
            </button>
          </div>
          <div className={styles.sectionBody}>
            <BookingHistory bookings={bookings.slice(0, 5)} />
          </div>
        </div>

        {/* Promotions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🎉 Promotions</h3>
          </div>
          <div className={styles.sectionBody}>
            <PromotionDisplay />
          </div>
        </div>

        {/* Points History */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>⭐ Points Activity</h3>
            <button className={styles.sectionAction} onClick={() => onNavigate('points')}>
              View all →
            </button>
          </div>
          <div className={styles.sectionBody}>
            <PointsHistory transactions={transactions.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
};
