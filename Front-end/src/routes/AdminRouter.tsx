import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminCustomerRegistryPage } from '../features/admin/pages/AdminCustomerRegistryPage';
import { CampaignBuilderPanel } from '../features/admin/pages/CampaignBuilderPanel';
import { RevenueAuditPanel } from '../features/admin/pages/RevenueAuditPanel';
import { TierManagementPanel } from '../features/admin/pages/TierManagementPanel';
import { VoucherManagementPanel } from '../features/admin/pages/VoucherManagementPanel';
import { ArrowUpRight, BarChart3, Gift, LogOut, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockStore } from '../services/mockStore';
import styles from './AdminRouter.module.css';

type AdminPageId = 'customers' | 'campaigns' | 'revenue' | 'tiers' | 'vouchers';
type AdminPanel = {
  id: AdminPageId;
  label: string;
  description: string;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
  icon: LucideIcon;
  render: (logout: () => void) => React.ReactNode;
};

export const AdminRouter: React.FC = () => {
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<AdminPageId>('customers');
  const customersCount = mockStore.getCustomers().length;
  const activeBookings = mockStore.getBookings().filter((booking) =>
    ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status),
  ).length;
  const totalRevenue = mockStore.getCustomers().reduce((sum, customer) => sum + customer.totalSpend, 0);

  const adminPanels = [
    {
      id: 'customers',
      label: 'Customers',
      description: 'Profiles, vehicles, and booking history',
      sectionEyebrow: 'Customer intelligence',
      sectionTitle: 'Keep every customer profile, vehicle record, and service journey aligned.',
      sectionDescription:
        'Review history, loyalty signals, and booking behavior in a cleaner shell built for fast operational scanning.',
      icon: Users,
      render: (handleLogout) => <AdminCustomerRegistryPage onBackToCustomerPortal={handleLogout} />,
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      description: 'AI-assisted promotion planning',
      sectionEyebrow: 'Growth orchestration',
      sectionTitle: 'Shape premium campaign launches with clearer planning context.',
      sectionDescription:
        'Coordinate promotions, messaging, and activation readiness from a consistent surface without changing campaign workflows.',
      icon: Sparkles,
      render: () => <CampaignBuilderPanel />,
    },
    {
      id: 'revenue',
      label: 'Revenue',
      description: 'Revenue audit and point logs',
      sectionEyebrow: 'Revenue assurance',
      sectionTitle: 'Audit revenue movement and loyalty value with stronger visual hierarchy.',
      sectionDescription:
        'Track bookings, transactions, and customer-linked spend through premium summary surfaces that reduce scanning friction.',
      icon: BarChart3,
      render: () => (
        <RevenueAuditPanel
          bookings={mockStore.getBookings()}
          transactions={mockStore.getTransactions()}
          getCustomerName={(id) => mockStore.getCustomerById(id)?.name || 'Unknown'}
        />
      ),
    },
    {
      id: 'tiers',
      label: 'Tiers',
      description: 'Loyalty rules and upgrade thresholds',
      sectionEyebrow: 'Tier governance',
      sectionTitle: 'Manage loyalty thresholds with a shell that feels consistent and executive-ready.',
      sectionDescription:
        'Adjust upgrade logic, monitor benefits, and keep the tier program aligned with the same premium admin framing.',
      icon: ShieldCheck,
      render: () => <TierManagementPanel />,
    },
    {
      id: 'vouchers',
      label: 'Vouchers',
      description: 'Reward catalog and exchange setup',
      sectionEyebrow: 'Reward operations',
      sectionTitle: 'Maintain voucher inventory and redemption setup from a unified premium workspace.',
      sectionDescription:
        'Keep reward catalog decisions, exchange setup, and value communication inside a single harmonized shell.',
      icon: Gift,
      render: () => <VoucherManagementPanel />,
    },
  ] satisfies AdminPanel[];

  const activePanel = adminPanels.find((item) => item.id === activePage) ?? adminPanels[0];

  const shellHighlights = [
    {
      label: 'Customers',
      value: customersCount.toString(),
      description: 'Profiles and loyalty activity tracked in the admin workspace.',
    },
    {
      label: 'Active bookings',
      value: activeBookings.toString(),
      description: 'Appointments currently moving through the service pipeline.',
    },
    {
      label: 'Total spend',
      value: `${new Intl.NumberFormat('en-US').format(totalRevenue)} VND`,
      description: 'Revenue visibility tied directly to customer behavior.',
    },
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brandEyebrow}>Admin workspace</span>
          <h2 className={styles.brandTitle}>AutoWash Pro</h2>
          <p className={styles.brandDescription}>
            A cleaner control center for customer operations, loyalty, campaigns, and revenue visibility.
          </p>
        </div>

        <nav className={styles.nav}>
          {adminPanels.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={activePage === item.id ? styles.navItemActive : styles.navItem}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.navCopy}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <button className={styles.logoutButton} onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <div className={styles.mainPane}>
        <header className={styles.topbar}>
          <div className={styles.topbarCopy}>
            <span className={styles.topbarEyebrow}>{activePanel.sectionEyebrow}</span>
            <h1>{activePanel.label}</h1>
            <p>{activePanel.description}</p>
          </div>
          <div className={styles.topbarUtilities}>
            <div className={styles.topbarBadge}>
              <ShieldCheck size={16} />
              Internal access
            </div>
            <aside className={styles.topbarAside}>
              <span className={styles.topbarUtilityLabel}>Active panel</span>
              <strong>{activePanel.label}</strong>
              <p className={styles.topbarNote}>
                Premium admin framing keeps overview, metrics, and panel context visually aligned.
              </p>
            </aside>
          </div>
        </header>

        <section className={styles.overviewSection} aria-label="Admin workspace overview">
          <article className={styles.heroCard}>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.heroEyebrow}>{activePanel.sectionEyebrow}</p>
                <h2 className={styles.heroTitle}>{activePanel.sectionTitle}</h2>
              </div>
              <div className={styles.heroBadge}>
                <ArrowUpRight size={16} />
                Shell harmonized
              </div>
            </div>
            <p className={styles.heroDescription}>
              {activePanel.sectionDescription}
            </p>
          </article>

          <dl className={styles.metricGrid}>
            {shellHighlights.map((item) => (
              <div key={item.label} className={styles.metricCard}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
                <p>{item.description}</p>
              </div>
            ))}
          </dl>
        </section>

        <div className={styles.content}>
          <Routes>
            <Route path="/*" element={activePanel.render(logout)} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
