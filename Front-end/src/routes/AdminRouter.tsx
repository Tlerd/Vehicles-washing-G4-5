import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminCustomerRegistryPage } from '../features/admin/pages/AdminCustomerRegistryPage';
import { CampaignBuilderPanel } from '../features/admin/pages/CampaignBuilderPanel';
import { RevenueAuditPanel } from '../features/admin/pages/RevenueAuditPanel';
import { TierManagementPanel } from '../features/admin/pages/TierManagementPanel';
import { VoucherManagementPanel } from '../features/admin/pages/VoucherManagementPanel';
import { ArrowUpRight, BarChart3, Gift, LogOut, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { platformService } from '../services/platform.service';
import {
  getAdminErrorMessage,
  parseAdminBookingPage,
  parseAdminCustomers,
  parseAdminRevenue,
} from '../features/admin/adminApi';
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

interface AdminShellMetrics {
  customers: number;
  activeBookings: number;
  totalRevenue: number;
}

const emptyMetrics: AdminShellMetrics = {
  customers: 0,
  activeBookings: 0,
  totalRevenue: 0,
};

export const AdminRouter: React.FC = () => {
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<AdminPageId>('customers');
  const [metrics, setMetrics] = useState<AdminShellMetrics>(emptyMetrics);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    let active = true;

    const loadMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError('');

      try {
        const [customersPayload, revenuePayload, pendingPayload, confirmedPayload, checkedInPayload] =
          await Promise.all([
            platformService.customers(),
            platformService.revenue('month'),
            platformService.adminBookings(0, 'PENDING'),
            platformService.adminBookings(0, 'CONFIRMED'),
            platformService.adminBookings(0, 'CHECKED_IN'),
          ]);

        if (!active) return;
        const activeBookings = [pendingPayload, confirmedPayload, checkedInPayload]
          .map(parseAdminBookingPage)
          .reduce((total, page) => total + page.totalItems, 0);

        setMetrics({
          customers: parseAdminCustomers(customersPayload).length,
          activeBookings,
          totalRevenue: parseAdminRevenue(revenuePayload).totalRevenue,
        });
      } catch (error) {
        if (!active) return;
        setMetricsError(getAdminErrorMessage(error, 'Admin overview could not be loaded from the API.'));
      } finally {
        if (active) setMetricsLoading(false);
      }
    };

    void loadMetrics();
    return () => {
      active = false;
    };
  }, []);

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
      description: 'Promotion planning and publishing',
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
      render: () => <RevenueAuditPanel />,
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
      value: metricsLoading ? '…' : metricsError ? '—' : metrics.customers.toLocaleString('vi-VN'),
      description: 'Customer profiles returned by the live admin API.',
    },
    {
      label: "Today's active bookings",
      value: metricsLoading ? '…' : metricsError ? '—' : metrics.activeBookings.toLocaleString('vi-VN'),
      description: 'Pending, confirmed, and checked-in appointments from the booking API.',
    },
    {
      label: 'Completed revenue',
      value: metricsLoading
        ? '…'
        : metricsError
          ? '—'
          : `${new Intl.NumberFormat('vi-VN').format(metrics.totalRevenue)} VND`,
      description: 'Completed-booking revenue reported by the Back-end.',
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
                Live API workspace
              </div>
            </div>
            <p className={styles.heroDescription}>
              {activePanel.sectionDescription}
            </p>
          </article>

          {metricsError && (
            <div className={styles.apiError} role="alert">
              <strong>Overview unavailable.</strong>
              <span>{metricsError}</span>
            </div>
          )}

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
