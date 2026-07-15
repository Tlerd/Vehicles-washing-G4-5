import React, { useState, useEffect } from 'react';
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
import { vehicleService } from '../../../services/customer/vehicle.service';
import { loyaltyService } from '../../../services/customer/loyalty.service';
import { Booking, Vehicle, PointsTransaction } from '../../../types';
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  useEffect(() => {
    if (!customerId) return;
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [fetchedBookings, fetchedVehicles, fetchedTransactions] = await Promise.all([
          bookingService.getBookings(customerId),
          vehicleService.getVehicles(customerId),
          loyaltyService.getPointsHistory(customerId)
        ]);
        if (isMounted) {
          setBookings(fetchedBookings);
          setVehicles(fetchedVehicles);
          setTransactions(fetchedTransactions);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [customerId]);

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
      description: 'Đặt lịch nhanh với các bước rõ ràng và khung giờ còn trống.',
      icon: CalendarClock,
      action: () => onNavigate('booking'),
    },
    {
      title: 'Manage vehicles',
      description: 'Cập nhật xe đã lưu để đặt lịch nhanh hơn cho những lần sau.',
      icon: CarFront,
      action: () => onNavigate('vehicles'),
    },
    {
      title: 'Redeem rewards',
      description: 'Đổi điểm lấy voucher và ưu đãi chăm sóc xe cao cấp.',
      icon: Gift,
      action: () => onNavigate('points'),
    },
  ];

  const heroHighlights = [
    { icon: ShieldCheck, text: `${completionRate}% tỉ lệ hoàn tất lịch đã đặt` },
    { icon: Star, text: `${currentPoints.toLocaleString('vi-VN')} điểm sẵn sàng đổi thưởng` },
    { icon: CarFront, text: `${vehicles.length} xe đã lưu trong hồ sơ` },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Customer dashboard</span>
          <h2>Chào mừng quay lại, {currentUser?.name || 'Guest'}</h2>
          <p>
            Theo dõi lịch hẹn sắp tới, quyền lợi thành viên và hoạt động gần đây trong một giao diện
            gọn gàng hơn, tập trung vào hành động tiếp theo mà bạn cần.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryAction} onClick={() => onNavigate('booking')}>
              Đặt lịch rửa xe
              <ArrowRight size={16} />
            </button>
            <button type="button" className={styles.secondaryAction} onClick={() => onNavigate('points')}>
              Xem điểm thưởng
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
          <span className={styles.heroCardLabel}>Điểm nhấn hôm nay</span>
          {upcomingBooking ? (
            <>
              <div className={styles.heroCardTop}>
                <div>
                  <h3>{upcomingBooking.bookingRef || 'Lịch hẹn sắp tới'}</h3>
                  <p>Chi nhánh {upcomingBooking.branchId}</p>
                </div>
                <span className={styles.heroStatus}>{upcomingBooking.status}</span>
              </div>

              <div className={styles.heroCardMeta}>
                <div>
                  <Clock3 size={16} />
                  <span>
                    {upcomingBooking.date} lúc {upcomingBooking.time}
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
                  <span>Tier hiện tại</span>
                  <strong>{currentUser?.tier || 'Member'}</strong>
                </div>
              </div>

              <button type="button" className={styles.cardButton} onClick={() => onNavigate('history')}>
                Xem lịch sử đặt lịch
              </button>
            </>
          ) : (
            <div className={styles.heroEmpty}>
              <Sparkles size={20} />
              <strong>Chưa có lịch hẹn nào</strong>
              <span>Bắt đầu một lịch chăm sóc mới để lưu khung giờ yêu thích của bạn chỉ trong vài bước.</span>
              <button type="button" className={styles.cardButton} onClick={() => onNavigate('booking')}>
                Tạo lịch đầu tiên
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
              <p className={styles.panelSubtitle}>Theo dõi các lịch hẹn gần đây và kiểm tra tiến độ dịch vụ đã đặt.</p>
            </div>
            <button type="button" className={styles.panelAction} onClick={() => onNavigate('history')}>
              Xem tất cả
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
              <p className={styles.panelSubtitle}>Ưu đãi nổi bật nên kiểm tra trước khi đặt lịch tiếp theo.</p>
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
              <p className={styles.panelSubtitle}>Biến động điểm thưởng, cấp độ thành viên và các lần đổi quà gần đây.</p>
            </div>
            <button type="button" className={styles.panelAction} onClick={() => onNavigate('points')}>
              Mở Rewards
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
