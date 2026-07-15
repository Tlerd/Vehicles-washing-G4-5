import { useState, useEffect } from 'react';
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
import { vehicleService } from './services/customer/vehicle.service';
import { mockStore } from './services/mockStore';
import { Booking, Vehicle } from './types';
import { MOCK_PROMOTIONS } from './config/constants';
import { AdminRouter } from './routes/AdminRouter';
import { WashingCounterPage } from './pages/washing-counter/WashingCounterPage';
import { BrowserRouter } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { CustomerBookingProvider } from './context/CustomerBookingContext';
import { formatPrice } from './utils/formatters';
import portalStyles from './features/customer/styles/CustomerPortalPages.module.css';

type PageId = 'dashboard' | 'booking' | 'vehicles' | 'history' | 'promotions' | 'points';

function CustomerPortal() {
  const { currentUser, refreshUser } = useAuth();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const customerId = currentUser?.id || '';
  
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  
  useEffect(() => {
    if (!customerId) return;
    let mounted = true;
    Promise.all([
      bookingService.getBookings(customerId),
      vehicleService.getVehicles(customerId)
    ]).then(([bookings, vehicles]) => {
      if (mounted) {
        setCustomerBookings(bookings);
        setCustomerVehicles(vehicles);
      }
    }).catch(console.error);
    return () => { mounted = false; };
  }, [customerId]);

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
        Đồng bộ đặt lịch, quản lý xe và điểm thưởng trong một hành trình chăm sóc xe xuyên suốt hơn.
      </p>
      <div className={portalStyles.summaryList}>
        <div className={portalStyles.summaryItem}>
          <span>Lịch đang chờ</span>
          <strong>{pendingBookings}</strong>
        </div>
        <div className={portalStyles.summaryItem}>
          <span>Xe đã lưu</span>
          <strong>{customerVehicles.length}</strong>
        </div>
        <div className={portalStyles.summaryItem}>
          <span>Điểm hiện có</span>
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
            title="Đặt lịch chăm sóc xe nhanh hơn"
            description="Quy trình đặt lịch sau đăng nhập được gom về một trải nghiệm liền mạch, rõ từng bước và dễ thao tác trên cả desktop lẫn mobile."
            stats={[
              { label: 'Xe khả dụng', value: customerVehicles.length.toString(), helper: 'Chọn nhanh từ hồ sơ đã lưu' },
              { label: 'Lịch chờ xử lý', value: pendingBookings.toString(), helper: 'Theo dõi từ History' },
              { label: 'Lịch hoàn tất', value: completedBookings.toString(), helper: 'Dựa trên tài khoản hiện tại' },
            ]}
            actions={[
              { label: 'Quay về dashboard', onClick: () => handleNavigate('dashboard'), variant: 'secondary' },
              { label: 'Xem rewards', onClick: () => handleNavigate('points') },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Booking wizard"
              description="Từng bước đặt lịch được đặt trong một khung nội dung thống nhất để giúp khách hàng dễ tập trung hơn."
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
            title="Quản lý xe đã lưu"
            description="Danh sách xe được làm mới theo cùng cấu trúc intro, card và khoảng cách với các trang sau đăng nhập khác."
            stats={[
              { label: 'Tổng số xe', value: customerVehicles.length.toString(), helper: 'Phục vụ đặt lịch nhanh hơn' },
              { label: 'Lịch đã hoàn tất', value: completedBookings.toString(), helper: 'Gắn với lịch sử chăm sóc' },
              { label: 'Điểm thưởng', value: currentPoints.toLocaleString('vi-VN'), helper: 'Có thể dùng để đổi voucher' },
            ]}
            actions={[
              { label: 'Đặt lịch mới', onClick: () => handleNavigate('booking') },
              { label: 'Xem lịch sử', onClick: () => handleNavigate('history'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Garage cá nhân"
              description="Lưu trữ thông tin xe, biển số và kích thước để rút ngắn thao tác đặt lịch về sau."
            >
              <VehicleList />
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'history':
        return (
          <CustomerPageShell
            eyebrow="Booking history"
            title="Theo dõi toàn bộ hành trình dịch vụ"
            description="Lịch sử đặt lịch được hiển thị trong bố cục sáng, dễ quét thông tin và nhất quán với dashboard mới."
            stats={[
              { label: 'Tổng booking', value: customerBookings.length.toString(), helper: 'Bao gồm mọi trạng thái' },
              { label: 'Đã hoàn tất', value: completedBookings.toString(), helper: 'Các lịch đã phục vụ xong' },
              { label: 'Đang chờ', value: pendingBookings.toString(), helper: 'Cần theo dõi trong ngắn hạn' },
            ]}
            actions={[
              { label: 'Đặt lịch tiếp', onClick: () => handleNavigate('booking') },
              { label: 'Xem promotions', onClick: () => handleNavigate('promotions'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Recent and past bookings"
              description="Kiểm tra lịch hẹn gần đây, trạng thái xử lý và tổng giá trị từng booking."
            >
              <BookingHistory bookings={customerBookings} />
            </CustomerPageSection>
          </CustomerPageShell>
        );

      case 'promotions':
        return (
          <CustomerPageShell
            eyebrow="Promotions"
            title="Ưu đãi dành cho lần chăm sóc tiếp theo"
            description="Trang promotions được bọc trong cùng khung nội dung để khách hàng dễ nhận biết khuyến mãi, voucher và CTA đặt lịch kế tiếp."
            stats={[
              { label: 'Ưu đãi hoạt động', value: MOCK_PROMOTIONS.length.toString(), helper: 'Cập nhật từ catalog hiện tại' },
              { label: 'Điểm hiện có', value: currentPoints.toLocaleString('vi-VN'), helper: 'Dùng để đổi thưởng' },
              { label: 'Lịch đang chờ', value: pendingBookings.toString(), helper: 'Có thể áp dụng cho lịch phù hợp' },
            ]}
            actions={[
              { label: 'Đặt lịch ngay', onClick: () => handleNavigate('booking') },
              { label: 'Mở rewards', onClick: () => handleNavigate('points'), variant: 'secondary' },
            ]}
            aside={sharedAside}
          >
            <CustomerPageSection
              title="Ưu đãi đang mở"
              description="Các chiến dịch nổi bật và quà tặng theo mùa được trình bày trong cùng phong cách card với portal."
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
            title="Điểm thưởng, loyalty và voucher"
            description="Bố cục rewards được tách rõ giữa tổng quan hạng thành viên, hồ sơ khách hàng, lịch sử điểm và cửa hàng voucher để dễ theo dõi hơn."
            stats={[
              { label: 'Current points', value: currentPoints.toLocaleString('vi-VN'), helper: 'Sẵn sàng để redeem' },
              { label: 'Tier hiện tại', value: currentUser?.tier || 'Member', helper: 'Dựa trên loyalty hiện tại' },
              { label: 'Tổng chi tiêu', value: formatPrice(currentUser?.totalSpend || 0), helper: 'Hỗ trợ xét nâng hạng' },
              { label: 'Giao dịch điểm', value: customerTransactions.length.toString(), helper: 'Bao gồm earn và redeem' },
            ]}
            actions={[
              { label: 'Đặt lịch để tích điểm', onClick: () => handleNavigate('booking') },
              { label: 'Xem history', onClick: () => handleNavigate('history'), variant: 'secondary' },
            ]}
            aside={
              <div className={portalStyles.summaryCard}>
                <span className={portalStyles.summaryEyebrow}>Rewards summary</span>
                <h3 className={portalStyles.summaryTitle}>Tối ưu quyền lợi thành viên</h3>
                <p className={portalStyles.summaryText}>
                  Sử dụng điểm đang có để đổi voucher hoặc tiếp tục tích lũy nhằm nâng hạng trong các lần chăm sóc tới.
                </p>
                <div className={portalStyles.summaryList}>
                  <div className={portalStyles.summaryItem}>
                    <span>Hoàn tất</span>
                    <strong>{completedBookings}</strong>
                  </div>
                  <div className={portalStyles.summaryItem}>
                    <span>Điểm hiện có</span>
                    <strong>{currentPoints.toLocaleString('vi-VN')}</strong>
                  </div>
                  <div className={portalStyles.summaryItem}>
                    <span>Tổng chi tiêu</span>
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
                  description="Theo dõi tiến độ nâng hạng, quyền lợi theo tier và mức độ hoàn thành của bạn."
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
                  description="Lịch sử cộng, trừ và thay đổi điểm thưởng gần đây của tài khoản."
                >
                  <PointsHistory transactions={customerTransactions} />
                </CustomerPageSection>
              </div>

              <div className={portalStyles.sideColumn}>
                <CustomerPageSection
                  title="Customer profile"
                  description="Thông tin thành viên được đặt cạnh khu vực rewards để tra cứu nhanh."
                >
                  {currentUser && <ProfileCard customer={currentUser} />}
                </CustomerPageSection>

                <CustomerPageSection
                  title="Voucher store"
                  description="Đổi thưởng ngay từ cùng trang với bố cục card sáng và rõ ràng hơn."
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
