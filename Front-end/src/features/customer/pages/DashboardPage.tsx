import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services/customer/booking.service';

import { mockStore } from '../../../services/mockStore';

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

  const bookings = bookingService.getBookings(customerId);

  const transactions = mockStore.getTransactionsByCustomer(customerId);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h2>Chào mừng trở lại, {currentUser?.name || 'Khách'}! 👋</h2>
          <p>Xế yêu của bạn xứng đáng được chăm sóc tốt nhất. Đặt lịch rửa xe ngay hôm nay.</p>
        </div>
        <button className={styles.welcomeAction} onClick={() => onNavigate('booking')}>
          📅 Đặt lịch ngay
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
            <h3 className={styles.sectionTitle}>📋 Đặt lịch gần đây</h3>
            <button className={styles.sectionAction} onClick={() => onNavigate('history')}>
              Xem tất cả →
            </button>
          </div>
          <div className={styles.sectionBody}>
            <BookingHistory bookings={bookings.slice(0, 5)} />
          </div>
        </div>

        {/* Promotions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🎉 Khuyến mãi</h3>
          </div>
          <div className={styles.sectionBody}>
            <PromotionDisplay />
          </div>
        </div>

        {/* Points History */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>⭐ Hoạt động điểm thưởng</h3>
            <button className={styles.sectionAction} onClick={() => onNavigate('points')}>
              Xem tất cả →
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
