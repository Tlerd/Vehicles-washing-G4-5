import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  CarFront,
  Clock3,
  Gift,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from 'lucide-react';
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
  const vehicles = mockStore.getVehiclesByCustomer(customerId);
  const transactions = mockStore.getTransactionsByCustomer(customerId);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED').length;
  const upcomingBooking =
    bookings.find((booking) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status)) || bookings[0];
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
  const currentPoints = currentUser?.accumulatedPoints || 0;
  const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const pointsEarned = transactions
    .filter((transaction) => transaction.points > 0)
    .reduce((sum, transaction) => sum + transaction.points, 0);

  const quickLinks = [
    {
      title: 'Book a wash',
      description: 'Start a guided booking with clear steps and available time slots.',
      icon: CalendarClock,
      action: () => onNavigate('booking'),
    },
    {
      title: 'Manage vehicles',
      description: 'Update saved vehicles so future bookings take less time.',
      icon: CarFront,
      action: () => onNavigate('vehicles'),
    },
    {
      title: 'Redeem rewards',
      description: 'Turn points into vouchers and premium car-care offers.',
      icon: Gift,
      action: () => onNavigate('points'),
    },
  ];

  const heroHighlights = [
    { icon: ShieldCheck, text: `${completionRate}% booking completion rate` },
    { icon: Star, text: `${currentPoints.toLocaleString('vi-VN')} points ready to redeem` },
    { icon: CarFront, text: `${vehicles.length} vehicles saved in your profile` },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Customer dashboard</span>
          <h2>Welcome back, {currentUser?.name || 'Guest'}</h2>
          <p>
            Track upcoming appointments, member benefits, and recent activity in one cleaner workspace focused
            on the next action you need.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryAction} onClick={() => onNavigate('booking')}>
              Book a wash
              <ArrowRight size={16} />
            </button>
            <button type="button" className={styles.secondaryAction} onClick={() => onNavigate('points')}>
              View rewards
            </button>
          </div>

          <div className={styles.heroHighlights}>
            {heroHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.text} className={styles.heroHighlight}>
                  <Icon size={16} />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={styles.heroCard}>
          <span className={styles.heroCardLabel}>Today&apos;s focus</span>
          {upcomingBooking ? (
            <>
              <div className={styles.heroCardTop}>
                <div>
                  <h3>{upcomingBooking.bookingRef || 'Upcoming appointment'}</h3>
                  <p>Branch {upcomingBooking.branchId}</p>
                </div>
                <span className={styles.heroStatus}>{upcomingBooking.status}</span>
              </div>

              <div className={styles.heroCardMeta}>
                <div>
                  <Clock3 size={16} />
                  <span>
                    {upcomingBooking.date} at {upcomingBooking.time}
                  </span>
                </div>
                <div>
                  <WalletCards size={16} />
                  <span>{upcomingBooking.totalPrice.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <div className={styles.focusGrid}>
                <div className={styles.focusItem}>
                  <span>Rewards</span>
                  <strong>{currentPoints.toLocaleString('vi-VN')} pts</strong>
                </div>
                <div className={styles.focusItem}>
                  <span>Current tier</span>
                  <strong>{currentUser?.tier || 'Member'}</strong>
                </div>
              </div>

              <button type="button" className={styles.cardButton} onClick={() => onNavigate('history')}>
                View booking history
              </button>
            </>
          ) : (
            <div className={styles.heroEmpty}>
              <Sparkles size={20} />
              <strong>No appointments yet</strong>
              <span>Start a new car-care booking and save your preferred time in just a few steps.</span>
              <button type="button" className={styles.cardButton} onClick={() => onNavigate('booking')}>
                Create first booking
              </button>
            </div>
          )}
        </aside>
      </section>

      <QuickStats
        points={currentPoints}
        totalBookings={totalBookings}
        completedWashes={completedBookings}
        totalSpent={totalSpent}
      />

      <AIAssistantInput />

      <section className={styles.quickLinksGrid}>
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.title} type="button" className={styles.quickLinkCard} onClick={item.action}>
              <span className={styles.quickLinkIcon}>
                <Icon size={18} />
              </span>
              <div className={styles.quickLinkContent}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
              <ArrowRight size={16} />
            </button>
          );
        })}
      </section>

      <div className={styles.mainGrid}>
        <section className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Recent bookings</h3>
              <p className={styles.panelSubtitle}>Review recent appointments and check service progress.</p>
            </div>
            <button type="button" className={styles.panelAction} onClick={() => onNavigate('history')}>
              View all
            </button>
          </div>
          <div className={styles.panelBody}>
            <BookingHistory bookings={bookings.slice(0, 5)} />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Promotions</h3>
              <p className={styles.panelSubtitle}>Featured offers worth checking before the next booking.</p>
            </div>
          </div>
          <div className={styles.panelBody}>
            <PromotionDisplay />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Points activity</h3>
              <p className={styles.panelSubtitle}>Recent point changes, tier status, and reward redemptions.</p>
            </div>
            <button type="button" className={styles.panelAction} onClick={() => onNavigate('points')}>
              Open rewards
            </button>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.rewardsSummary}>
              <div className={styles.rewardsMetric}>
                <span>Total earned</span>
                <strong>{pointsEarned.toLocaleString('vi-VN')} pts</strong>
              </div>
              <div className={styles.rewardsMetric}>
                <span>Current tier</span>
                <strong>{currentUser?.tier || 'Member'}</strong>
              </div>
            </div>

            <div className={styles.pointsPreview}>
              <PointsHistory transactions={transactions.slice(0, 5)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
