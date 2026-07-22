import React, { useMemo, useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { Check, LogOut, UserCheck, X } from 'lucide-react';
import styles from './WashingCounterPage.module.css';

export const WashingCounterPage: React.FC = () => {
  const { bookings, customers, vehicles, updateBookingStatus } = useBooking();
  const { logout } = useAuth();
  const [filterBranch, setFilterBranch] = useState<'ALL' | 'D1' | 'D7'>('ALL');

  // Filter bookings based on active branch selection
  const activeBookings = bookings.filter(b => {
    const matchBranch = filterBranch === 'ALL' || b.branchId === filterBranch;
    return matchBranch;
  });

  const pendingBookings = activeBookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = activeBookings.filter(b => b.status === 'CONFIRMED');
  const checkedInBookings = activeBookings.filter(b => b.status === 'CHECKED_IN');
  const completedBookings = activeBookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');
  const totalRevenueToday = useMemo(
    () => activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    [activeBookings],
  );

  const branchLabel = filterBranch === 'ALL' ? 'All branches' : filterBranch === 'D1' ? 'District 1' : 'District 7';

  const renderQueueCard = (
    booking: (typeof activeBookings)[number],
    variant: 'pending' | 'confirmed' | 'checkedIn',
  ) => {
    const customer = customers.find(c => c.id === booking.customerId);
    const vehicle = vehicles.find(v => v.id === booking.vehicleId);
    const tierMultipliers = { Member: 1.0, Silver: 1.1, Gold: 1.2, Platinum: 1.3 };
    const customerTier = customer?.tier || 'Member';
    const multiplier = tierMultipliers[customerTier] || 1.0;
    const pointsToEarn = Math.floor((booking.totalPrice / 1000) * multiplier);

    return (
      <article key={booking.id} className={styles.queueCard}>
        <header className={styles.queueCardHeader}>
          <div>
            <h4 className={styles.customerName}>{customer?.name || 'Guest Customer'}</h4>
            <p className={styles.customerMeta}>{customer?.phone || 'No phone on file'}</p>
          </div>
          <span className={styles.bookingRef}>{booking.bookingRef}</span>
        </header>

        <dl className={styles.queueDetails}>
          <div>
            <dt>Branch</dt>
            <dd>{booking.branchId}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>{vehicle ? `${vehicle.licensePlate} (${vehicle.size})` : 'Vehicle unavailable'}</dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>{booking.bookingDate} {booking.bookingTime}</dd>
          </div>
          {variant === 'checkedIn' && (
            <div>
              <dt>Loyalty gain</dt>
              <dd>+{pointsToEarn} pts</dd>
            </div>
          )}
        </dl>

        {variant === 'checkedIn' && (
          <p className={styles.tierBadge}>
            {customerTier} multiplier: {multiplier}x
          </p>
        )}

        <footer className={styles.queueFooter}>
          <strong className={styles.price}>{booking.totalPrice.toLocaleString('vi-VN')} VND</strong>

          {variant === 'pending' && (
            <div className={styles.actionGroup}>
              <button
                type="button"
                onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                className={`${styles.actionButton} ${styles.actionButtonGhost}`}
                title="Reject appointment"
              >
                <X size={16} />
                Reject
              </button>
              <button
                type="button"
                onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                className={`${styles.actionButton} ${styles.actionButtonApprove}`}
              >
                <Check size={16} />
                Approve
              </button>
            </div>
          )}

          {variant === 'confirmed' && (
            <button
              type="button"
              onClick={() => updateBookingStatus(booking.id, 'CHECKED_IN')}
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            >
              <UserCheck size={16} />
              Check in
            </button>
          )}

          {variant === 'checkedIn' && (
            <button
              type="button"
              onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
              className={`${styles.actionButton} ${styles.actionButtonComplete}`}
            >
              <Check size={16} />
              Complete service
            </button>
          )}
        </footer>
      </article>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <p className={styles.eyebrow}>Staff operations workspace</p>
          <h1 className={styles.title}>Premium queue control for branch teams.</h1>
          <p className={styles.subtitle}>
            Review appointments, move vehicles through each stage, and keep the service handoff as polished as the new AutoWash Pro access flow.
          </p>
        </div>

        <aside className={styles.mastheadAside}>
          <button type="button" onClick={logout} className={styles.logoutButton}>
            <LogOut size={16} />
            Sign out
          </button>
          <p className={styles.asideNote}>
            Live branch focus: <strong>{branchLabel}</strong>
          </p>
        </aside>
      </header>

      <section className={styles.overviewSection} aria-label="Counter overview">
        <article className={styles.heroCard}>
          <p className={styles.heroEyebrow}>Service execution</p>
          <h2 className={styles.heroTitle}>One visual language from login to live branch operations.</h2>
          <p className={styles.heroDescription}>
            The counter portal now uses the same brighter premium feel, clearer cards, and faster status scanning as the updated sign-in experience.
          </p>
        </article>

        <dl className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <dt>Pending approvals</dt>
            <dd>{pendingBookings.length}</dd>
            <p>Vehicles waiting for confirmation before arrival.</p>
          </div>
          <div className={styles.metricCard}>
            <dt>Expected today</dt>
            <dd>{confirmedBookings.length}</dd>
            <p>Confirmed appointments ready for front-desk handoff.</p>
          </div>
          <div className={styles.metricCard}>
            <dt>In service</dt>
            <dd>{checkedInBookings.length}</dd>
            <p>Vehicles currently moving through the wash bay.</p>
          </div>
          <div className={styles.metricCard}>
            <dt>Closed jobs</dt>
            <dd>{completedBookings.length}</dd>
            <p>Completed or cancelled appointments in the selected scope.</p>
          </div>
          <div className={styles.metricCard}>
            <dt>Queue revenue</dt>
            <dd>{totalRevenueToday.toLocaleString('vi-VN')} VND</dd>
            <p>Total booking value currently visible in this branch filter.</p>
          </div>
        </dl>
      </section>

      <section className={styles.filterSection} aria-label="Branch filters">
        <div className={styles.filterGroup}>
          <button
            type="button"
            onClick={() => setFilterBranch('ALL')}
            className={`${styles.filterButton} ${filterBranch === 'ALL' ? styles.filterButtonActive : ''}`}
          >
            All branches
          </button>
          <button
            type="button"
            onClick={() => setFilterBranch('D1')}
            className={`${styles.filterButton} ${filterBranch === 'D1' ? styles.filterButtonActive : ''}`}
          >
            District 1
          </button>
          <button
            type="button"
            onClick={() => setFilterBranch('D7')}
            className={`${styles.filterButton} ${filterBranch === 'D7' ? styles.filterButtonActive : ''}`}
          >
            District 7
          </button>
        </div>
      </section>

      <main className={styles.board}>
        <section className={styles.queueColumn} aria-labelledby="pending-queue-title">
          <header className={styles.queueHeader}>
            <div>
              <p className={styles.queueEyebrow}>Queue 01</p>
              <h3 id="pending-queue-title">Approval queue</h3>
            </div>
            <span className={styles.queueBadge}>{pendingBookings.length} pending</span>
          </header>
          <div className={styles.queueList}>
            {pendingBookings.length === 0 ? (
              <p className={styles.emptyState}>No pending appointments for the selected branch.</p>
            ) : (
              pendingBookings.map((booking) => renderQueueCard(booking, 'pending'))
            )}
          </div>
        </section>

        <section className={styles.queueColumn} aria-labelledby="confirmed-queue-title">
          <header className={styles.queueHeader}>
            <div>
              <p className={styles.queueEyebrow}>Queue 02</p>
              <h3 id="confirmed-queue-title">Expected arrivals</h3>
            </div>
            <span className={styles.queueBadge}>{confirmedBookings.length} confirmed</span>
          </header>
          <div className={styles.queueList}>
            {confirmedBookings.length === 0 ? (
              <p className={styles.emptyState}>No arriving vehicles are expected right now.</p>
            ) : (
              confirmedBookings.map((booking) => renderQueueCard(booking, 'confirmed'))
            )}
          </div>
        </section>

        <section className={styles.queueColumn} aria-labelledby="washing-queue-title">
          <header className={styles.queueHeader}>
            <div>
              <p className={styles.queueEyebrow}>Queue 03</p>
              <h3 id="washing-queue-title">Active wash bay</h3>
            </div>
            <span className={styles.queueBadge}>{checkedInBookings.length} in service</span>
          </header>
          <div className={styles.queueList}>
            {checkedInBookings.length === 0 ? (
              <p className={styles.emptyState}>No vehicles are currently being serviced.</p>
            ) : (
              checkedInBookings.map((booking) => renderQueueCard(booking, 'checkedIn'))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
