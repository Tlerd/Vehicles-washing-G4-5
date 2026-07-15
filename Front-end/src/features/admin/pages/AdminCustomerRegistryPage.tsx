import { useEffect, useMemo, useRef, useState } from 'react';
import type { UIEvent } from 'react';
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
import { mockStore } from '../../../services/mockStore';
import type { Booking, Customer, CustomerTier, PointsTransaction, Vehicle } from '../../../types';
import { formatDate, formatPrice, formatTime } from '../../../utils/formatters';
import {
  CustomerSortKey,
  CustomerTierFilter,
  getFilteredCustomers,
  isValidOptionalEmail,
} from '../customerRegistry';
import {
  BookingSortKey,
  BookingStatusFilter,
  getBookingPage,
  shouldLoadNextPage,
} from '../bookingLog';
import { CampaignBuilderPanel } from './CampaignBuilderPanel';
import { RevenueAuditPanel } from './RevenueAuditPanel';
import styles from './AdminCustomerRegistryPage.module.css';

const tiers: CustomerTierFilter[] = ['ALL', 'Member', 'Silver', 'Gold', 'Platinum'];
const bookingStatuses: BookingStatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'];
const bookingPageSize = 10;

interface AdminCustomerRegistryPageProps {
  onBackToCustomerPortal: () => void;
}

interface ProfileFormState {
  name: string;
  phone: string;
  email: string;
}

const getTierClassName = (tier: CustomerTier) => `${styles.tierBadge} ${styles[`tier${tier}`]}`;
const getStatusClassName = (status: Booking['status']) => `${styles.statusBadge} ${styles[`status${status}`]}`;

export function AdminCustomerRegistryPage({ onBackToCustomerPortal }: AdminCustomerRegistryPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(() => mockStore.getCustomers());
  const [vehicles] = useState<Vehicle[]>(() => mockStore.getVehicles());
  const [bookings] = useState<Booking[]>(() => mockStore.getBookings());
  const [transactions] = useState<PointsTransaction[]>(() => mockStore.getTransactions());
  const [activeAdminTab, setActiveAdminTab] = useState<'customers' | 'bookings' | 'revenue' | 'campaigns'>('customers');
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<CustomerTierFilter>('ALL');
  const [sortBy, setSortBy] = useState<CustomerSortKey>('createdAt');
  const [bookingStatus, setBookingStatus] = useState<BookingStatusFilter>('ALL');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingSortBy, setBookingSortBy] = useState<BookingSortKey>('time');
  const [bookingPage, setBookingPage] = useState(0);
  const [visibleBookings, setVisibleBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: '', phone: '', email: '' });
  const [formError, setFormError] = useState('');
  const bookingScrollRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = useMemo(
    () => getFilteredCustomers({ customers, vehicles, search, tier, sortBy }),
    [customers, search, sortBy, tier, vehicles],
  );

  const selectedCustomer = selectedCustomerId
    ? customers.find(customer => customer.id === selectedCustomerId) ?? null
    : null;

  const selectedVehicles = selectedCustomer
    ? vehicles.filter(vehicle => vehicle.customerId === selectedCustomer.id)
    : [];
  const selectedBookings = selectedCustomer
    ? bookings
        .filter(booking => booking.customerId === selectedCustomer.id)
        .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    : [];
  const selectedTransactions = selectedCustomer
    ? transactions
        .filter(transaction => transaction.customerId === selectedCustomer.id)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    : [];

  const totalVehicles = vehicles.length;
  const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED').length;
  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const currentBookingPage = useMemo(
    () =>
      getBookingPage({
        bookings,
        date: bookingDate,
        status: bookingStatus,
        sortBy: bookingSortBy,
        page: bookingPage,
        size: bookingPageSize,
      }),
    [bookingDate, bookingPage, bookingSortBy, bookingStatus, bookings],
  );
  const hasMoreBookings = !currentBookingPage.last;

  useEffect(() => {
    const pageResult = getBookingPage({
      bookings,
      date: bookingDate,
      status: bookingStatus,
      sortBy: bookingSortBy,
      page: 0,
      size: bookingPageSize,
    });

    setVisibleBookings(pageResult.content);
    setBookingPage(0);
    bookingScrollRef.current?.scrollTo({ top: 0 });
  }, [bookingDate, bookingSortBy, bookingStatus, bookings]);

  const getCustomerName = (customerId: string) =>
    customers.find(customer => customer.id === customerId)?.name ?? 'Guest';

  const getVehicleLabel = (vehicleId: string) => {
    const vehicle = vehicles.find(vehicle => vehicle.id === vehicleId);
    if (!vehicle) return 'Vehicle unavailable';
    return `${vehicle.licensePlate} / ${vehicle.brand}`;
  };

  const loadNextBookingPage = () => {
    if (isLoadingBookings || currentBookingPage.last) return;

    setIsLoadingBookings(true);
    const nextPage = bookingPage + 1;
    const pageResult = getBookingPage({
      bookings,
      date: bookingDate,
      status: bookingStatus,
      sortBy: bookingSortBy,
      page: nextPage,
      size: bookingPageSize,
    });

    setVisibleBookings(current => [...current, ...pageResult.content]);
    setBookingPage(nextPage);
    setIsLoadingBookings(false);
  };

  const handleBookingScroll = (event: UIEvent<HTMLDivElement>) => {
    if (
      shouldLoadNextPage({
        scrollHeight: event.currentTarget.scrollHeight,
        scrollTop: event.currentTarget.scrollTop,
        clientHeight: event.currentTarget.clientHeight,
        threshold: 100,
      })
    ) {
      loadNextBookingPage();
    }
  };

  const openCustomerProfile = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setProfileForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
    });
    setFormError('');
  };

  const closeCustomerProfile = () => {
    setSelectedCustomerId(null);
    setFormError('');
  };

  const updateProfileField = (field: keyof ProfileFormState, value: string) => {
    setProfileForm(current => ({ ...current, [field]: value }));
  };

  const saveCustomerProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCustomer) return;

    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }

    if (!isValidOptionalEmail(profileForm.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const updatedCustomer = mockStore.updateCustomer(selectedCustomer.id, {
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
    });

    if (!updatedCustomer) {
      setFormError('Customer profile could not be found.');
      return;
    }

    setCustomers(current =>
      current.map(customer => (customer.id === updatedCustomer.id ? updatedCustomer : customer)),
    );
    setFormError('');
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
            {activeAdminTab === 'campaigns' && 'AI Campaign Builder'}
          </h1>
          <p>
            {activeAdminTab === 'customers' &&
              'Search customers by name, phone, or plate, then review vehicles, bookings, and points movement.'}
            {activeAdminTab === 'bookings' &&
              'Review today booking batches with status filters and infinite scroll pagination.'}
            {activeAdminTab === 'revenue' &&
              'Filter completed wash revenue by day, month, year, and branch, then inspect points audit logs.'}
            {activeAdminTab === 'campaigns' &&
              'Draft targeted campaign promotions with mock-AI and publish them to the customer portal.'}
          </p>
        </div>
        <button className={styles.secondaryButton} onClick={onBackToCustomerPortal}>
          Sign out
        </button>
      </header>

      <nav className={styles.adminTabs} aria-label="Admin feature tabs">
        <button
          className={activeAdminTab === 'customers' ? styles.adminTabActive : styles.adminTab}
          onClick={() => setActiveAdminTab('customers')}
        >
          <UserRoundSearch size={17} aria-hidden="true" />
          Customer Registry
        </button>
        <button
          className={activeAdminTab === 'bookings' ? styles.adminTabActive : styles.adminTab}
          onClick={() => setActiveAdminTab('bookings')}
        >
          <ClipboardList size={17} aria-hidden="true" />
          Booking Log
        </button>
        <button
          className={activeAdminTab === 'revenue' ? styles.adminTabActive : styles.adminTab}
          onClick={() => setActiveAdminTab('revenue')}
        >
          <BarChart3 size={17} aria-hidden="true" />
          Revenue Audit
        </button>
        <button
          className={activeAdminTab === 'campaigns' ? styles.adminTabActive : styles.adminTab}
          onClick={() => setActiveAdminTab('campaigns')}
        >
          <BrainCircuit size={17} aria-hidden="true" />
          AI Campaigns
        </button>
      </nav>

      <section className={styles.metricsGrid} aria-label="Customer registry summary">
        <div className={styles.metric}>
          <UserRoundSearch className={styles.metricIcon} aria-hidden="true" />
          <span>Customers</span>
          <strong>{customers.length}</strong>
        </div>
        <div className={styles.metric}>
          <Car className={styles.metricIcon} aria-hidden="true" />
          <span>Registered cars</span>
          <strong>{totalVehicles}</strong>
        </div>
        <div className={styles.metric}>
          <CalendarClock className={styles.metricIcon} aria-hidden="true" />
          <span>Completed washes</span>
          <strong>{completedBookings}</strong>
        </div>
        <div className={styles.metric}>
          <WalletCards className={styles.metricIcon} aria-hidden="true" />
          <span>Total spend</span>
          <strong>{formatPrice(totalSpend)}</strong>
        </div>
      </section>

      {activeAdminTab === 'customers' && <section className={styles.registryPanel}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={18} aria-hidden="true" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search name, phone, email, or plate"
            />
          </label>

          <label className={styles.selectControl}>
            <ShieldCheck size={16} aria-hidden="true" />
            <select value={tier} onChange={event => setTier(event.target.value as CustomerTierFilter)}>
              {tiers.map(tierOption => (
                <option key={tierOption} value={tierOption}>
                  {tierOption === 'ALL' ? 'All tiers' : tierOption}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.selectControl}>
            <ArrowDownUp size={16} aria-hidden="true" />
            <select value={sortBy} onChange={event => setSortBy(event.target.value as CustomerSortKey)}>
              <option value="createdAt">Newest registration</option>
              <option value="totalSpend">Highest spend</option>
              <option value="points">Highest points</option>
            </select>
          </label>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.customerTable}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Tier</th>
                <th>Vehicles</th>
                <th>Spend</th>
                <th>Points</th>
                <th>Registered</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const customerVehicles = vehicles.filter(vehicle => vehicle.customerId === customer.id);
                return (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <span>{customer.phone}</span>
                    </td>
                    <td>
                      <span className={getTierClassName(customer.tier)}>{customer.tier}</span>
                    </td>
                    <td>{customerVehicles.map(vehicle => vehicle.licensePlate).join(', ') || 'No vehicles'}</td>
                    <td>{formatPrice(customer.totalSpend)}</td>
                    <td>{customer.accumulatedPoints.toLocaleString('vi-VN')} pts</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      <button className={styles.viewButton} onClick={() => openCustomerProfile(customer)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className={styles.emptyState}>
              <Sparkles size={28} aria-hidden="true" />
              <strong>No customers found</strong>
              <span>Try a different search term or tier filter.</span>
            </div>
          )}
        </div>
      </section>}

      {activeAdminTab === 'bookings' && (
        <section className={styles.registryPanel}>
          <div className={styles.bookingToolbar}>
            <label className={styles.selectControl}>
              <CalendarClock size={16} aria-hidden="true" />
              <input
                type="date"
                value={bookingDate}
                onChange={event => setBookingDate(event.target.value)}
              />
            </label>

            <label className={styles.selectControl}>
              <ShieldCheck size={16} aria-hidden="true" />
              <select
                value={bookingStatus}
                onChange={event => setBookingStatus(event.target.value as BookingStatusFilter)}
              >
                {bookingStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : status}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectControl}>
              <ArrowDownUp size={16} aria-hidden="true" />
              <select
                value={bookingSortBy}
                onChange={event => setBookingSortBy(event.target.value as BookingSortKey)}
              >
                <option value="time">Sort by time</option>
                <option value="price">Sort by price</option>
              </select>
            </label>

            <div className={styles.bookingCount}>
              Showing {visibleBookings.length} of {currentBookingPage.totalItems}
            </div>
          </div>

          <div ref={bookingScrollRef} className={styles.bookingScroll} onScroll={handleBookingScroll}>
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Time</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.bookingRef ?? booking.id}</strong>
                      <span>{formatDate(booking.date)}</span>
                    </td>
                    <td>{getCustomerName(booking.customerId)}</td>
                    <td>{getVehicleLabel(booking.vehicleId)}</td>
                    <td>{formatTime(booking.time)}</td>
                    <td>{booking.branchId}</td>
                    <td>
                      <span className={getStatusClassName(booking.status)}>{booking.status}</span>
                    </td>
                    <td>{formatPrice(booking.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleBookings.length === 0 && (
              <div className={styles.emptyState}>
                <Sparkles size={28} aria-hidden="true" />
                <strong>No bookings found</strong>
                <span>Try another date or status filter.</span>
              </div>
            )}

            {isLoadingBookings && <div className={styles.loadingLine}>Loading next bookings...</div>}
            {!hasMoreBookings && visibleBookings.length > 0 && (
              <div className={styles.endLine}>End of bookings history.</div>
            )}
          </div>
        </section>
      )}

      {activeAdminTab === 'revenue' && (
        <RevenueAuditPanel
          bookings={bookings}
          transactions={transactions}
          getCustomerName={getCustomerName}
        />
      )}

      {activeAdminTab === 'campaigns' && (
        <CampaignBuilderPanel />
      )}

      {selectedCustomer && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeCustomerProfile}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-profile-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={getTierClassName(selectedCustomer.tier)}>{selectedCustomer.tier}</span>
                <h2 id="customer-profile-title">{selectedCustomer.name}</h2>
                <p>{selectedCustomer.accumulatedPoints.toLocaleString('vi-VN')} points available</p>
              </div>
              <button className={styles.iconButton} onClick={closeCustomerProfile} aria-label="Close customer profile">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className={styles.profileForm} onSubmit={saveCustomerProfile}>
              <label>
                Name
                <input value={profileForm.name} onChange={event => updateProfileField('name', event.target.value)} />
              </label>
              <label>
                Phone
                <input value={profileForm.phone} onChange={event => updateProfileField('phone', event.target.value)} />
              </label>
              <label>
                Email
                <input value={profileForm.email} onChange={event => updateProfileField('email', event.target.value)} />
              </label>
              <button className={styles.primaryButton} type="submit">
                Save profile
              </button>
              {formError && <p className={styles.formError}>{formError}</p>}
            </form>

            <div className={styles.detailGrid}>
              <section className={styles.detailSection}>
                <h3>Vehicles</h3>
                <div className={styles.stackList}>
                  {selectedVehicles.map(vehicle => (
                    <article key={vehicle.id} className={styles.detailItem}>
                      <Car size={18} aria-hidden="true" />
                      <div>
                        <strong>{vehicle.licensePlate}</strong>
                        <span>
                          {vehicle.brand} / {vehicle.size}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.detailSection}>
                <h3>Contact</h3>
                <div className={styles.stackList}>
                  <article className={styles.detailItem}>
                    <Phone size={18} aria-hidden="true" />
                    <div>
                      <strong>{selectedCustomer.phone}</strong>
                      <span>Primary phone</span>
                    </div>
                  </article>
                  <article className={styles.detailItem}>
                    <Mail size={18} aria-hidden="true" />
                    <div>
                      <strong>{selectedCustomer.email || 'No email'}</strong>
                      <span>Profile email</span>
                    </div>
                  </article>
                </div>
              </section>
            </div>

            <section className={styles.detailSection}>
              <h3>Booking history</h3>
              <div className={styles.timeline}>
                {selectedBookings.map(booking => (
                  <article key={booking.id} className={styles.timelineItem}>
                    <div>
                      <strong>{booking.bookingRef ?? booking.id}</strong>
                      <span>
                        {formatDate(booking.date)} at {formatTime(booking.time)} / {booking.branchId}
                      </span>
                    </div>
                    <div className={styles.timelineMeta}>
                      <span>{booking.status}</span>
                      <strong>{formatPrice(booking.totalPrice)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.detailSection}>
              <h3>Points activity</h3>
              <div className={styles.timeline}>
                {selectedTransactions.map(transaction => (
                  <article key={transaction.id} className={styles.timelineItem}>
                    <div>
                      <strong>{transaction.description}</strong>
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                    <strong className={transaction.points >= 0 ? styles.pointsPositive : styles.pointsNegative}>
                      {transaction.points >= 0 ? '+' : ''}
                      {transaction.points} pts
                    </strong>
                  </article>
                ))}
                {selectedTransactions.length === 0 && <p className={styles.mutedLine}>No points activity yet.</p>}
              </div>
            </section>
          </section>
        </div>
      )}
    </main>
  );
}
