import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, UserCheck, X } from 'lucide-react';
import { Badge } from '../../components/Badge/Badge';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import styles from './WashingCounterPage.module.css';

type BranchFilter = 'ALL' | 'D1' | 'D7';

const statusTitle: Record<Booking['status'], string> = {
  PENDING: 'Approvals',
  CONFIRMED: 'Expected Today',
  CHECKED_IN: 'Currently Washing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusClass: Record<'PENDING' | 'CONFIRMED' | 'CHECKED_IN', string> = {
  PENDING: styles.pending,
  CONFIRMED: styles.confirmed,
  CHECKED_IN: styles.washing,
};

export const WashingCounterPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [filterBranch, setFilterBranch] = useState<BranchFilter>('ALL');
  const [, setRefreshKey] = useState(0);

  const bookings = mockStore.getBookings();
  const customers = mockStore.getCustomers();
  const vehicles = mockStore.getVehicles();

  const activeBookings = useMemo(
    () => bookings.filter(booking => filterBranch === 'ALL' || booking.branchId === filterBranch),
    [bookings, filterBranch],
  );

  const byStatus = (status: Booking['status']) => activeBookings.filter(booking => booking.status === status);

  const handleStatus = (bookingId: string, status: Booking['status']) => {
    mockStore.updateBookingStatus(bookingId, status);
    setRefreshKey(key => key + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderBookingCard = (booking: Booking) => {
    const customer = customers.find(item => item.id === booking.customerId);
    const vehicle = vehicles.find(item => item.id === booking.vehicleId);
    const pointsPreview = booking.pointsEarned || Math.floor(booking.totalPrice / 1000);

    return (
      <article key={booking.id} className={styles.bookingCard}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.customer}>{customer?.name || 'Guest'}</span>
            <span className={styles.phone}>{customer?.phone || 'No phone'}</span>
          </div>
          <span className={styles.ref}>{booking.bookingRef || booking.id}</span>
        </div>

        <div className={styles.detailBox}>
          <div>Branch: <strong>{booking.branchId}</strong></div>
          <div>Vehicle: <strong>{vehicle?.licensePlate || 'Unknown'} ({booking.carSize})</strong></div>
          <div>Time: <strong>{booking.date} {booking.time}</strong></div>
          <div>FR-006 points: <span className={styles.points}>+{pointsPreview.toLocaleString('vi-VN')} pts</span></div>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.price}>{booking.totalPrice.toLocaleString('vi-VN')} VND</span>
          {booking.status === 'PENDING' && (
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => handleStatus(booking.id, 'CANCELLED')}
                className={styles.iconButton}
                title="Reject appointment"
              >
                <X size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleStatus(booking.id, 'CONFIRMED')}
                className={styles.actionButton}
              >
                <Check size={15} /> Approve
              </button>
            </div>
          )}
          {booking.status === 'CONFIRMED' && (
            <button
              type="button"
              onClick={() => handleStatus(booking.id, 'CHECKED_IN')}
              className={styles.actionButton}
            >
              <UserCheck size={15} /> Check-in
            </button>
          )}
          {booking.status === 'CHECKED_IN' && (
            <button
              type="button"
              onClick={() => handleStatus(booking.id, 'COMPLETED')}
              className={`${styles.actionButton} ${styles.successButton}`}
            >
              <Check size={15} /> Checkout + points
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderColumn = (status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN') => {
    const items = byStatus(status);
    return (
      <section className={styles.column}>
        <div className={styles.columnHeader}>
          <h2 className={`${styles.columnTitle} ${statusClass[status]}`}>
            {statusTitle[status]} ({items.length})
          </h2>
          <Badge variant={status === 'PENDING' ? 'warning' : status === 'CONFIRMED' ? 'info' : 'success'}>
            {status}
          </Badge>
        </div>
        <div className={styles.columnBody}>
          {items.length === 0 ? (
            <p className={styles.empty}>No bookings in this queue.</p>
          ) : (
            items.map(renderBookingCard)
          )}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mark}>CW</div>
            <div>
              <h1 className={styles.title}>Washing Counter</h1>
              <p className={styles.subtitle}>FR-009 approval, check-in, checkout, and point settlement.</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.filters}>
              {(['ALL', 'D1', 'D7'] as BranchFilter[]).map(branch => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setFilterBranch(branch)}
                  className={`${styles.filterButton} ${filterBranch === branch ? styles.filterButtonActive : ''}`}
                >
                  {branch === 'ALL' ? 'All Branches' : branch}
                </button>
              ))}
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statValue}>{byStatus('PENDING').length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Confirmed</span>
            <span className={styles.statValue}>{byStatus('CONFIRMED').length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Checked-in</span>
            <span className={styles.statValue}>{byStatus('CHECKED_IN').length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{byStatus('COMPLETED').length}</span>
          </div>
        </div>

        <div className={styles.columns}>
          {renderColumn('PENDING')}
          {renderColumn('CONFIRMED')}
          {renderColumn('CHECKED_IN')}
        </div>
      </div>
    </div>
  );
};
