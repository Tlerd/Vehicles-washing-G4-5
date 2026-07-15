import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, UIEvent } from 'react';
import {
  ArrowDownUp,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Car,
  ClipboardList,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  WalletCards,
  X,
} from 'lucide-react';
import { platformService } from '../../../services/platform.service';
import { formatDate, formatPrice, formatTime } from '../../../utils/formatters';
import type { BookingStatus } from '../../../types';
import {
  type AdminAuditRecord,
  type AdminBookingRecord,
  type AdminCustomerRecord,
  type AdminRevenueSnapshot,
  type AdminTier,
  getAdminErrorMessage,
  parseAdminAudit,
  parseAdminBookingPage,
  parseAdminCustomers,
  parseAdminRevenue,
} from '../adminApi';
import { CampaignBuilderPanel } from './CampaignBuilderPanel';
import { RevenueAuditPanel } from './RevenueAuditPanel';
import styles from './AdminCustomerRegistryPage.module.css';

type AdminTab = 'customers' | 'bookings' | 'revenue' | 'campaigns';
type CustomerTierFilter = AdminTier | 'ALL';
type CustomerSortKey = 'name' | 'totalSpend' | 'points';
type BookingStatusFilter = BookingStatus | 'ALL';
type BookingSortKey = 'time' | 'price';

const tiers: CustomerTierFilter[] = ['ALL', 'Member', 'Silver', 'Gold', 'Platinum'];
const bookingStatuses: BookingStatusFilter[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
];

const emptyRevenue: AdminRevenueSnapshot = {
  period: 'month',
  totalRevenue: 0,
  completedBookings: 0,
  series: {},
};

interface AdminCustomerRegistryPageProps {
  onBackToCustomerPortal: () => void;
}

interface ProfileFormState {
  name: string;
  phone: string;
  email: string;
}

interface CustomerUpdateCapability {
  updateAdminCustomer?: (
    id: string,
    body: { name: string; email: string },
  ) => Promise<unknown>;
}

const customerUpdater = (platformService as typeof platformService & CustomerUpdateCapability)
  .updateAdminCustomer;

const getTierClassName = (tier: AdminTier) => `${styles.tierBadge} ${styles[`tier${tier}`]}`;
const getStatusClassName = (status: BookingStatus) =>
  `${styles.statusBadge} ${styles[`status${status}`]}`;

const safeFormatDate = (value: string) => (value ? formatDate(value) : 'Not provided');
const safeFormatTime = (value: string) => (value ? formatTime(value) : 'Not provided');

export function AdminCustomerRegistryPage({ onBackToCustomerPortal }: AdminCustomerRegistryPageProps) {
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBookingRecord[]>([]);
  const [auditRows, setAuditRows] = useState<AdminAuditRecord[]>([]);
  const [revenue, setRevenue] = useState<AdminRevenueSnapshot>(emptyRevenue);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('customers');
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<CustomerTierFilter>('ALL');
  const [sortBy, setSortBy] = useState<CustomerSortKey>('name');
  const [bookingStatus, setBookingStatus] = useState<BookingStatusFilter>('ALL');
  const [bookingSortBy, setBookingSortBy] = useState<BookingSortKey>('time');
  const [bookingPage, setBookingPage] = useState(0);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingLast, setBookingLast] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const [bookingsError, setBookingsError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: '', phone: '', email: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const bookingScrollRef = useRef<HTMLDivElement>(null);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setCustomersLoading(true);
      setCustomersError('');
      try {
        const payload = await platformService.customers(search.trim());
        if (active) setCustomers(parseAdminCustomers(payload));
      } catch (error) {
        if (active) {
          setCustomersError(getAdminErrorMessage(error, 'Customers could not be loaded from the API.'));
        }
      } finally {
        if (active) setCustomersLoading(false);
      }
    }, search.trim() ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError('');
      try {
        const [revenuePayload, auditPayload] = await Promise.all([
          platformService.revenue('month'),
          platformService.audit(),
        ]);
        if (!active) return;
        setRevenue(parseAdminRevenue(revenuePayload));
        setAuditRows(parseAdminAudit(auditPayload));
      } catch (error) {
        if (active) {
          setSummaryError(getAdminErrorMessage(error, 'Revenue and points summaries could not be loaded.'));
        }
      } finally {
        if (active) setSummaryLoading(false);
      }
    };

    void loadSummary();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadFirstPage = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const payload = await platformService.adminBookings(
          0,
          bookingStatus === 'ALL' ? '' : bookingStatus,
          bookingDate,
        );
        if (!active) return;
        const page = parseAdminBookingPage(payload);
        setBookings(page.content);
        setBookingPage(page.page);
        setBookingTotal(page.totalItems);
        setBookingLast(page.last);
        bookingScrollRef.current?.scrollTo({ top: 0 });
      } catch (error) {
        if (active) {
          setBookings([]);
          setBookingTotal(0);
          setBookingLast(true);
          setBookingsError(getAdminErrorMessage(error, 'Today booking log could not be loaded.'));
        }
      } finally {
        if (active) setBookingsLoading(false);
      }
    };

    void loadFirstPage();
    return () => {
      active = false;
    };
  }, [bookingDate, bookingStatus]);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter(customer => tier === 'ALL' || customer.tier === tier);
    return [...filtered].sort((left, right) => {
      if (sortBy === 'totalSpend') return right.totalSpend - left.totalSpend;
      if (sortBy === 'points') return right.accumulatedPoints - left.accumulatedPoints;
      return left.name.localeCompare(right.name, 'vi');
    });
  }, [customers, sortBy, tier]);

  const visibleBookings = useMemo(
    () => [...bookings].sort((left, right) => (
      bookingSortBy === 'price'
        ? right.totalPrice - left.totalPrice
        : left.time.localeCompare(right.time)
    )),
    [bookingSortBy, bookings],
  );

  const selectedCustomer = selectedCustomerId
    ? customers.find(customer => customer.id === selectedCustomerId) ?? null
    : null;
  const selectedBookings = selectedCustomer
    ? bookings.filter(booking => (
        selectedCustomer.vehicles.includes(booking.licensePlate)
        || booking.customerName === selectedCustomer.name
      ))
    : [];
  const selectedTransactions = selectedCustomer
    ? auditRows.filter(transaction => transaction.customerId === selectedCustomer.id)
    : [];

  const totalVehicles = customers.reduce((sum, customer) => sum + customer.vehicles.length, 0);
  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const canUpdateProfile = typeof customerUpdater === 'function';

  const loadNextBookingPage = async () => {
    if (bookingsLoading || bookingLast) return;
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const payload = await platformService.adminBookings(
        bookingPage + 1,
        bookingStatus === 'ALL' ? '' : bookingStatus,
        bookingDate,
      );
      const page = parseAdminBookingPage(payload);
      setBookings(current => {
        const knownIds = new Set(current.map(booking => booking.id));
        return [...current, ...page.content.filter(booking => !knownIds.has(booking.id))];
      });
      setBookingPage(page.page);
      setBookingTotal(page.totalItems);
      setBookingLast(page.last);
    } catch (error) {
      setBookingsError(getAdminErrorMessage(error, 'The next booking page could not be loaded.'));
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingScroll = (event: UIEvent<HTMLDivElement>) => {
    const remaining = event.currentTarget.scrollHeight
      - event.currentTarget.scrollTop
      - event.currentTarget.clientHeight;
    if (remaining <= 100) void loadNextBookingPage();
  };

  const openCustomerProfile = (customer: AdminCustomerRecord) => {
    setSelectedCustomerId(customer.id);
    setProfileForm({ name: customer.name, phone: customer.phone, email: customer.email });
    setProfileMessage('');
    setProfileError('');
  };

  const closeCustomerProfile = () => {
    setSelectedCustomerId(null);
    setProfileMessage('');
    setProfileError('');
  };

  const updateProfileField = (field: keyof ProfileFormState, value: string) => {
    setProfileForm(current => ({ ...current, [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const saveCustomerProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCustomer || !customerUpdater) return;
    if (!profileForm.name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    if (profileForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const payload = await customerUpdater(selectedCustomer.id, {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      const updated = parseAdminCustomers([payload])[0];
      if (updated) {
        setCustomers(current => current.map(customer => (
          customer.id === updated.id ? updated : customer
        )));
      }
      setProfileMessage('Profile updated through the admin API.');
    } catch (error) {
      setProfileError(getAdminErrorMessage(error, 'The customer profile could not be updated.'));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Admin Portal</span>
          <h1>
            {activeAdminTab === 'customers' && 'Customer Registry'}
            {activeAdminTab === 'bookings' && 'Booking Log'}
            {activeAdminTab === 'revenue' && 'Revenue Audit'}
            {activeAdminTab === 'campaigns' && 'Campaign Builder'}
          </h1>
          <p>
            {activeAdminTab === 'customers' &&
              'Search live customer records by name, phone, or plate, then review loyalty and vehicle activity.'}
            {activeAdminTab === 'bookings' &&
              'Review today booking batches from the Back-end with status filters and API pagination.'}
            {activeAdminTab === 'revenue' &&
              'Inspect completed-booking revenue and the server-side points audit ledger.'}
            {activeAdminTab === 'campaigns' &&
              'Prepare campaign messaging and publish approved promotions through the admin API.'}
          </p>
        </div>
        <button className={styles.secondaryButton} onClick={onBackToCustomerPortal}>
          Sign out
        </button>
      </header>

      <nav className={styles.adminTabs} aria-label="Admin feature tabs">
        <button className={activeAdminTab === 'customers' ? styles.adminTabActive : styles.adminTab} onClick={() => setActiveAdminTab('customers')}>
          <UserRoundSearch size={17} aria-hidden="true" />
          Customer Registry
        </button>
        <button className={activeAdminTab === 'bookings' ? styles.adminTabActive : styles.adminTab} onClick={() => setActiveAdminTab('bookings')}>
          <ClipboardList size={17} aria-hidden="true" />
          Booking Log
        </button>
        <button className={activeAdminTab === 'revenue' ? styles.adminTabActive : styles.adminTab} onClick={() => setActiveAdminTab('revenue')}>
          <BarChart3 size={17} aria-hidden="true" />
          Revenue Audit
        </button>
        <button className={activeAdminTab === 'campaigns' ? styles.adminTabActive : styles.adminTab} onClick={() => setActiveAdminTab('campaigns')}>
          <BrainCircuit size={17} aria-hidden="true" />
          Campaigns
        </button>
      </nav>

      <section className={styles.metricsGrid} aria-label="Customer registry summary">
        <div className={styles.metric}>
          <UserRoundSearch className={styles.metricIcon} aria-hidden="true" />
          <span>Customers</span>
          <strong>{customersLoading ? '…' : customers.length.toLocaleString('vi-VN')}</strong>
        </div>
        <div className={styles.metric}>
          <Car className={styles.metricIcon} aria-hidden="true" />
          <span>Registered cars</span>
          <strong>{customersLoading ? '…' : totalVehicles.toLocaleString('vi-VN')}</strong>
        </div>
        <div className={styles.metric}>
          <CalendarClock className={styles.metricIcon} aria-hidden="true" />
          <span>Completed washes</span>
          <strong>{summaryLoading ? '…' : revenue.completedBookings.toLocaleString('vi-VN')}</strong>
        </div>
        <div className={styles.metric}>
          <WalletCards className={styles.metricIcon} aria-hidden="true" />
          <span>Customer spend</span>
          <strong>{customersLoading ? '…' : formatPrice(totalSpend)}</strong>
        </div>
      </section>

      {(customersError || summaryError) && (
        <div className={styles.feedbackStack}>
          {customersError && <p className={styles.errorBanner} role="alert">{customersError}</p>}
          {summaryError && <p className={styles.errorBanner} role="alert">{summaryError}</p>}
        </div>
      )}

      {activeAdminTab === 'customers' && (
        <section className={styles.registryPanel}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={18} aria-hidden="true" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, phone, or plate" />
            </label>

            <label className={styles.selectControl}>
              <ShieldCheck size={16} aria-hidden="true" />
              <select value={tier} onChange={event => setTier(event.target.value as CustomerTierFilter)}>
                {tiers.map(tierOption => <option key={tierOption} value={tierOption}>{tierOption === 'ALL' ? 'All tiers' : tierOption}</option>)}
              </select>
            </label>

            <label className={styles.selectControl}>
              <ArrowDownUp size={16} aria-hidden="true" />
              <select value={sortBy} onChange={event => setSortBy(event.target.value as CustomerSortKey)}>
                <option value="name">Customer name</option>
                <option value="totalSpend">Highest spend</option>
                <option value="points">Highest points</option>
              </select>
            </label>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.customerTable}>
              <thead><tr><th>Customer</th><th>Tier</th><th>Vehicles</th><th>Spend</th><th>Points</th><th>Washes</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td><strong>{customer.name}</strong><span>{customer.phone}</span></td>
                    <td><span className={getTierClassName(customer.tier)}>{customer.tier}</span></td>
                    <td>{customer.vehicles.join(', ') || 'No vehicles'}</td>
                    <td>{formatPrice(customer.totalSpend)}</td>
                    <td>{customer.accumulatedPoints.toLocaleString('vi-VN')} pts</td>
                    <td>{customer.totalWashes.toLocaleString('vi-VN')}</td>
                    <td><button className={styles.viewButton} onClick={() => openCustomerProfile(customer)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customersLoading && <div className={styles.loadingLine}>Loading customers from the API…</div>}
            {!customersLoading && filteredCustomers.length === 0 && (
              <div className={styles.emptyState}><Sparkles size={28} aria-hidden="true" /><strong>No customers found</strong><span>Try a different search term or tier filter.</span></div>
            )}
          </div>
        </section>
      )}

      {activeAdminTab === 'bookings' && (
        <section className={styles.registryPanel}>
          <div className={styles.bookingToolbar}>
            <label className={styles.selectControl}>
              <CalendarClock size={16} aria-hidden="true" />
              <input type="date" value={bookingDate} onChange={event => setBookingDate(event.target.value)} aria-label="Booking API date" />
            </label>
            <label className={styles.selectControl}>
              <ShieldCheck size={16} aria-hidden="true" />
              <select value={bookingStatus} onChange={event => setBookingStatus(event.target.value as BookingStatusFilter)}>
                {bookingStatuses.map(status => <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>)}
              </select>
            </label>
            <label className={styles.selectControl}>
              <ArrowDownUp size={16} aria-hidden="true" />
              <select value={bookingSortBy} onChange={event => setBookingSortBy(event.target.value as BookingSortKey)}>
                <option value="time">Sort by time</option><option value="price">Sort by price</option>
              </select>
            </label>
            <div className={styles.bookingCount}>Showing {visibleBookings.length} of {bookingTotal}</div>
          </div>

          {bookingsError && <p className={styles.errorBanner} role="alert">{bookingsError}</p>}
          <div ref={bookingScrollRef} className={styles.bookingScroll} onScroll={handleBookingScroll}>
            <table className={styles.customerTable}>
              <thead><tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Time</th><th>Branch</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {visibleBookings.map(booking => (
                  <tr key={booking.id}>
                    <td><strong>{booking.bookingRef}</strong><span>{safeFormatDate(booking.date)}</span></td>
                    <td>{booking.customerName}</td><td>{booking.licensePlate}</td><td>{safeFormatTime(booking.time)}</td><td>{booking.branch}</td>
                    <td><span className={getStatusClassName(booking.status)}>{booking.status}</span></td>
                    <td>{formatPrice(booking.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!bookingsLoading && visibleBookings.length === 0 && !bookingsError && (
              <div className={styles.emptyState}><Sparkles size={28} aria-hidden="true" /><strong>No bookings found</strong><span>There are no matching bookings for today.</span></div>
            )}
            {bookingsLoading && <div className={styles.loadingLine}>Loading bookings from the API…</div>}
            {!bookingLast && !bookingsLoading && <div className={styles.endLine}>Scroll to load more bookings.</div>}
            {bookingLast && visibleBookings.length > 0 && <div className={styles.endLine}>End of today booking history.</div>}
          </div>
        </section>
      )}

      {activeAdminTab === 'revenue' && <RevenueAuditPanel />}
      {activeAdminTab === 'campaigns' && <CampaignBuilderPanel />}

      {selectedCustomer && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeCustomerProfile}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="customer-profile-title" onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><span className={getTierClassName(selectedCustomer.tier)}>{selectedCustomer.tier}</span><h2 id="customer-profile-title">{selectedCustomer.name}</h2><p>{selectedCustomer.accumulatedPoints.toLocaleString('vi-VN')} points available</p></div>
              <button className={styles.iconButton} onClick={closeCustomerProfile} aria-label="Close customer profile"><X size={18} aria-hidden="true" /></button>
            </div>

            <form className={styles.profileForm} onSubmit={saveCustomerProfile}>
              <label>Name<input value={profileForm.name} readOnly={!canUpdateProfile} onChange={event => updateProfileField('name', event.target.value)} /></label>
              <label>Phone<input value={profileForm.phone} readOnly title="The Back-end customer update endpoint does not update phone numbers." /></label>
              <label>Email<input value={profileForm.email} readOnly={!canUpdateProfile} onChange={event => updateProfileField('email', event.target.value)} /></label>
              <button className={styles.primaryButton} type="submit" disabled={!canUpdateProfile || profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</button>
              {!canUpdateProfile && <p className={styles.readOnlyHint}>Profile editing is read-only until `updateAdminCustomer` is exposed by platformService. Customer data shown here is live API data.</p>}
              {profileError && <p className={styles.formError}>{profileError}</p>}
              {profileMessage && <p className={styles.formSuccess}>{profileMessage}</p>}
            </form>

            <div className={styles.detailGrid}>
              <section className={styles.detailSection}>
                <h3>Vehicles</h3>
                <div className={styles.stackList}>
                  {selectedCustomer.vehicles.map(plate => <article key={plate} className={styles.detailItem}><Car size={18} aria-hidden="true" /><div><strong>{plate}</strong><span>Registered vehicle</span></div></article>)}
                  {selectedCustomer.vehicles.length === 0 && <p className={styles.mutedLine}>No vehicles returned by the customer API.</p>}
                </div>
              </section>
              <section className={styles.detailSection}>
                <h3>Contact</h3>
                <div className={styles.stackList}>
                  <article className={styles.detailItem}><Phone size={18} aria-hidden="true" /><div><strong>{selectedCustomer.phone || 'No phone'}</strong><span>Primary phone</span></div></article>
                  <article className={styles.detailItem}><Mail size={18} aria-hidden="true" /><div><strong>{selectedCustomer.email || 'No email'}</strong><span>Profile email</span></div></article>
                </div>
              </section>
            </div>

            <section className={styles.detailSection}>
              <h3>Today booking activity</h3>
              <div className={styles.timeline}>
                {selectedBookings.map(booking => <article key={booking.id} className={styles.timelineItem}><div><strong>{booking.bookingRef}</strong><span>{safeFormatDate(booking.date)} at {safeFormatTime(booking.time)} / {booking.branch}</span></div><div className={styles.timelineMeta}><span>{booking.status}</span><strong>{formatPrice(booking.totalPrice)}</strong></div></article>)}
                {selectedBookings.length === 0 && <p className={styles.mutedLine}>No matching booking was returned in today loaded pages.</p>}
              </div>
            </section>

            <section className={styles.detailSection}>
              <h3>Points activity</h3>
              <div className={styles.timeline}>
                {selectedTransactions.map(transaction => <article key={transaction.id} className={styles.timelineItem}><div><strong>{transaction.description}</strong><span>{safeFormatDate(transaction.createdAt)}</span></div><strong className={transaction.points >= 0 ? styles.pointsPositive : styles.pointsNegative}>{transaction.points >= 0 ? '+' : ''}{transaction.points} pts</strong></article>)}
                {selectedTransactions.length === 0 && <p className={styles.mutedLine}>No points activity returned by the audit API.</p>}
              </div>
            </section>
          </section>
        </div>
      )}
    </main>
  );
}
