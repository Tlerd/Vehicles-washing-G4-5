import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Check, LogOut, RefreshCw, Search, UserCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { platformService } from '../../services/platform.service';
import type { Booking } from '../../types';
import styles from './WashingCounterPage.module.css';

type BranchFilter = 'ALL' | 'D1' | 'D7';
type QueueVariant = 'pending' | 'confirmed' | 'checkedIn';
type BookingAction = { bookingId: string; status: Booking['status'] };

const getLocalDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response;
    const apiMessage = response?.data?.message ?? response?.data?.error;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  }

  return error instanceof Error && error.message ? error.message : fallback;
};

const formatTime = (value?: string) => value?.slice(0, 5) || '--:--';

export const WashingCounterPage: React.FC = () => {
  const { logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [filterBranch, setFilterBranch] = useState<BranchFilter>('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<BookingAction | null>(null);
  const requestId = useRef(0);
  const updatingBookingId = updatingAction?.bookingId ?? null;

  const loadQueue = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const queue = await platformService.queue(selectedDate);
      if (currentRequestId === requestId.current) setBookings(queue);
    } catch (error) {
      if (currentRequestId === requestId.current) {
        setLoadError(getErrorMessage(error, 'Unable to load the washing queue.'));
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadQueue();
    return () => {
      requestId.current += 1;
    };
  }, [loadQueue]);

  const updateStatus = async (bookingId: string, status: Booking['status']) => {
    setUpdatingAction({ bookingId, status });
    setActionError(null);

    try {
      await platformService.status(bookingId, status);
      await loadQueue();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Unable to update this booking. Please try again.'));
    } finally {
      setUpdatingAction(null);
    }
  };

  const activeBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesBranch = filterBranch === 'ALL' || booking.branchId === filterBranch;
      if (!matchesBranch) return false;
      if (!normalizedQuery) return true;

      return [
        booking.bookingRef,
        booking.customerName,
        booking.customerPhone,
        booking.licensePlate,
        booking.vehicleBrand,
        ...booking.services,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [bookings, filterBranch, query]);

  const pendingBookings = activeBookings.filter((booking) => booking.status === 'PENDING');
  const confirmedBookings = activeBookings.filter((booking) => booking.status === 'CONFIRMED');
  const checkedInBookings = activeBookings.filter((booking) => booking.status === 'CHECKED_IN');
  const closedBookings = activeBookings.filter(
    (booking) => booking.status === 'COMPLETED' || booking.status === 'CANCELLED',
  );
  const totalRevenue = useMemo(
    () => activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    [activeBookings],
  );

  const branchLabel =
    filterBranch === 'ALL' ? 'All branches' : filterBranch === 'D1' ? 'District 1' : 'District 7';
  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${selectedDate}T00:00:00`))
    : 'No date selected';

  const renderActionIcon = (bookingId: string, status: Booking['status'], icon: React.ReactNode) =>
    updatingAction?.bookingId === bookingId && updatingAction.status === status ? (
      <RefreshCw size={16} className={styles.spinningIcon} />
    ) : (
      icon
    );

  const renderQueueCard = (booking: Booking, variant: QueueVariant) => {
    const isUpdating = updatingBookingId === booking.id;
    const disableActions = updatingBookingId !== null || loading;

    return (
      <article key={booking.id} className={styles.queueCard} aria-busy={isUpdating}>
        <header className={styles.queueCardHeader}>
          <div>
            <h4 className={styles.customerName}>{booking.customerName || 'Guest customer'}</h4>
            {booking.customerPhone ? (
              <a className={styles.customerMeta} href={`tel:${booking.customerPhone}`}>
                {booking.customerPhone}
              </a>
            ) : (
              <p className={styles.customerMeta}>No phone on file</p>
            )}
          </div>
          <span className={styles.bookingRef}>{booking.bookingRef || `#${booking.id}`}</span>
        </header>

        <dl className={styles.queueDetails}>
          <div>
            <dt>Branch</dt>
            <dd>{booking.branchId}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>
              {[booking.vehicleBrand, booking.licensePlate, booking.carSize?.toUpperCase()]
                .filter(Boolean)
                .join(' · ') || 'Vehicle unavailable'}
            </dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>
              {booking.date} · {formatTime(booking.time)}–{formatTime(booking.endTime)}
              {booking.durationMinutes ? ` (${booking.durationMinutes} min)` : ''}
            </dd>
          </div>
          <div>
            <dt>Services</dt>
            <dd>{booking.services.length ? booking.services.join(', ') : 'No service information'}</dd>
          </div>
        </dl>

        <footer className={styles.queueFooter}>
          <strong className={styles.price}>{booking.totalPrice.toLocaleString('vi-VN')} VND</strong>

          {variant === 'pending' && (
            <div className={styles.actionGroup}>
              <button
                type="button"
                onClick={() => void updateStatus(booking.id, 'CANCELLED')}
                className={`${styles.actionButton} ${styles.actionButtonGhost}`}
                title="Reject appointment"
                disabled={disableActions}
              >
                {renderActionIcon(booking.id, 'CANCELLED', <X size={16} />)}
                Reject
              </button>
              <button
                type="button"
                onClick={() => void updateStatus(booking.id, 'CONFIRMED')}
                className={`${styles.actionButton} ${styles.actionButtonApprove}`}
                disabled={disableActions}
              >
                {renderActionIcon(booking.id, 'CONFIRMED', <Check size={16} />)}
                Approve
              </button>
            </div>
          )}

          {variant === 'confirmed' && (
            <div className={styles.actionGroup}>
              <button
                type="button"
                onClick={() => void updateStatus(booking.id, 'CANCELLED')}
                className={`${styles.actionButton} ${styles.actionButtonGhost}`}
                disabled={disableActions}
              >
                {renderActionIcon(booking.id, 'CANCELLED', <X size={16} />)}
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void updateStatus(booking.id, 'CHECKED_IN')}
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                disabled={disableActions}
              >
                {renderActionIcon(booking.id, 'CHECKED_IN', <UserCheck size={16} />)}
                Check in
              </button>
            </div>
          )}

          {variant === 'checkedIn' && (
            <button
              type="button"
              onClick={() => void updateStatus(booking.id, 'COMPLETED')}
              className={`${styles.actionButton} ${styles.actionButtonComplete}`}
              disabled={disableActions}
            >
              {renderActionIcon(booking.id, 'COMPLETED', <Check size={16} />)}
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
            Review appointments, move vehicles through each stage, and keep every service handoff clear and
            consistent.
          </p>
        </div>

        <aside className={styles.mastheadAside}>
          <button type="button" onClick={logout} className={styles.logoutButton}>
            <LogOut size={16} />
            Sign out
          </button>
          <p className={styles.asideNote}>
            Live branch focus: <strong>{branchLabel}</strong>
            <br />
            Queue date: <strong>{selectedDateLabel}</strong>
          </p>
        </aside>
      </header>

      <section className={styles.overviewSection} aria-label="Counter overview">
        <article className={styles.heroCard}>
          <p className={styles.heroEyebrow}>Service execution</p>
          <h2 className={styles.heroTitle}>One clear view from approval to wash completion.</h2>
          <p className={styles.heroDescription}>
            Live booking data is grouped by service stage so the counter team can confirm arrivals, check in
            vehicles, and close completed washes without losing context.
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
            <dd>{closedBookings.length}</dd>
            <p>Completed or cancelled appointments in the selected scope.</p>
          </div>
          <div className={styles.metricCard}>
            <dt>Queue revenue</dt>
            <dd>{totalRevenue.toLocaleString('vi-VN')} VND</dd>
            <p>Total booking value currently visible in this filter.</p>
          </div>
        </dl>
      </section>

      <section className={styles.filterSection} aria-label="Queue filters">
        <div className={styles.filterToolbar}>
          <div className={styles.filterGroup} aria-label="Branch filter">
            {(
              [
                ['ALL', 'All branches'],
                ['D1', 'District 1'],
                ['D7', 'District 7'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterBranch(value)}
                className={`${styles.filterButton} ${filterBranch === value ? styles.filterButtonActive : ''}`}
                aria-pressed={filterBranch === value}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.inputField}>
              <span className={styles.srOnly}>Queue date</span>
              <CalendarDays size={17} aria-hidden="true" />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => event.target.value && setSelectedDate(event.target.value)}
                disabled={updatingBookingId !== null}
              />
            </label>
            <label className={`${styles.inputField} ${styles.searchField}`}>
              <span className={styles.srOnly}>Search queue</span>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search booking, customer, phone or plate"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadQueue()}
              className={styles.refreshButton}
              disabled={loading || updatingBookingId !== null}
              aria-label="Refresh washing queue"
            >
              <RefreshCw size={17} className={loading ? styles.spinningIcon : undefined} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {(loadError || actionError) && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={19} aria-hidden="true" />
          <span>{actionError || loadError}</span>
          {loadError && (
            <button type="button" onClick={() => void loadQueue()} disabled={loading}>
              Try again
            </button>
          )}
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className={styles.loadingState} role="status">
          <RefreshCw size={24} className={styles.spinningIcon} />
          <strong>Loading live booking queue…</strong>
          <span>Connecting to the washing-counter API for {selectedDateLabel}.</span>
        </div>
      ) : (
        <main className={styles.board} aria-busy={loading}>
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
                <p className={styles.emptyState}>No pending appointments match the selected filters.</p>
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
                <p className={styles.emptyState}>No arriving vehicles match the selected filters.</p>
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
                <p className={styles.emptyState}>No vehicles in service match the selected filters.</p>
              ) : (
                checkedInBookings.map((booking) => renderQueueCard(booking, 'checkedIn'))
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
};
