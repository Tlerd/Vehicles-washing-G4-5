import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarClock, Gauge, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { platformService } from '../../../services/platform.service';
import { formatDate, formatPrice } from '../../../utils/formatters';
import {
  type AdminAuditRecord,
  type AdminRevenueSnapshot,
  getAdminErrorMessage,
  parseAdminAudit,
  parseAdminCustomers,
  parseAdminRevenue,
} from '../adminApi';
import styles from './RevenueAuditPanel.module.css';

type RevenuePeriod = 'day' | 'month' | 'year';
type PointAuditTypeFilter = 'ALL' | 'earn' | 'redeem' | 'expire' | 'tier_change';

const pointAuditTypes: PointAuditTypeFilter[] = ['ALL', 'earn', 'redeem', 'expire', 'tier_change'];
const emptyRevenue: AdminRevenueSnapshot = {
  period: 'month',
  totalRevenue: 0,
  completedBookings: 0,
  series: {},
};

const safeFormatDate = (value: string) => (value ? formatDate(value) : 'Not provided');

export function RevenueAuditPanel() {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');
  const [pointAuditType, setPointAuditType] = useState<PointAuditTypeFilter>('ALL');
  const [summary, setSummary] = useState<AdminRevenueSnapshot>(emptyRevenue);
  const [auditRows, setAuditRows] = useState<AdminAuditRecord[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [revenueError, setRevenueError] = useState('');
  const [auditError, setAuditError] = useState('');

  useEffect(() => {
    let active = true;
    setRevenueLoading(true);
    setRevenueError('');
    platformService.revenue(revenuePeriod)
      .then(payload => {
        if (active) setSummary(parseAdminRevenue(payload, revenuePeriod));
      })
      .catch(error => {
        if (active) setRevenueError(getAdminErrorMessage(error, 'Revenue could not be loaded from the API.'));
      })
      .finally(() => {
        if (active) setRevenueLoading(false);
      });

    return () => {
      active = false;
    };
  }, [revenuePeriod]);

  useEffect(() => {
    let active = true;
    setAuditLoading(true);
    setAuditError('');
    Promise.all([platformService.audit(), platformService.customers()])
      .then(([auditPayload, customersPayload]) => {
        if (!active) return;
        setAuditRows(parseAdminAudit(auditPayload));
        setCustomerNames(Object.fromEntries(
          parseAdminCustomers(customersPayload).map(customer => [customer.id, customer.name]),
        ));
      })
      .catch(error => {
        if (active) setAuditError(getAdminErrorMessage(error, 'Points audit logs could not be loaded.'));
      })
      .finally(() => {
        if (active) setAuditLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleAuditRows = useMemo(
    () => auditRows
      .filter(row => pointAuditType === 'ALL' || row.type === pointAuditType)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [auditRows, pointAuditType],
  );

  const averageTicket = summary.completedBookings > 0
    ? Math.round(summary.totalRevenue / summary.completedBookings)
    : 0;
  const seriesBuckets = Object.keys(summary.series).length;

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={`${styles.selectControl} ${styles.disabledControl}`} title="The current revenue API returns the complete server-side period grouping.">
          <CalendarClock size={16} aria-hidden="true" />
          <span className={styles.controlText}>All available dates</span>
        </div>

        <label className={styles.selectControl}>
          <BarChart3 size={16} aria-hidden="true" />
          <select value={revenuePeriod} onChange={event => setRevenuePeriod(event.target.value as RevenuePeriod)}>
            <option value="day">Day buckets</option>
            <option value="month">Month buckets</option>
            <option value="year">Year buckets</option>
          </select>
        </label>

        <div className={`${styles.selectControl} ${styles.disabledControl}`} title="The Back-end revenue endpoint does not expose a branch filter.">
          <Gauge size={16} aria-hidden="true" />
          <span className={styles.controlText}>All branches</span>
        </div>

        <label className={styles.selectControl}>
          <ShieldCheck size={16} aria-hidden="true" />
          <select value={pointAuditType} onChange={event => setPointAuditType(event.target.value as PointAuditTypeFilter)}>
            {pointAuditTypes.map(type => (
              <option key={type} value={type}>{type === 'ALL' ? 'All point logs' : type.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      {(revenueError || auditError) && (
        <div className={styles.feedbackStack}>
          {revenueError && <p className={styles.errorBanner} role="alert">{revenueError}</p>}
          {auditError && <p className={styles.errorBanner} role="alert">{auditError}</p>}
        </div>
      )}

      <div className={styles.revenueGrid}>
        <article className={styles.revenueCard}>
          <span>Completed revenue</span>
          <strong>{revenueLoading ? '…' : formatPrice(summary.totalRevenue)}</strong>
          <small>{revenueLoading ? 'Loading from the API' : `${summary.completedBookings.toLocaleString('vi-VN')} completed washes`}</small>
        </article>
        <article className={styles.revenueCard}>
          <span>Average ticket</span>
          <strong>{revenueLoading ? '…' : formatPrice(averageTicket)}</strong>
          <small>Computed from the completed totals returned by the Back-end</small>
        </article>
        <article className={styles.revenueCard}>
          <span>Audit events</span>
          <strong>{auditLoading ? '…' : visibleAuditRows.length.toLocaleString('vi-VN')}</strong>
          <small>{seriesBuckets} revenue bucket{seriesBuckets === 1 ? '' : 's'} in this grouping</small>
        </article>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.auditTable}>
          <thead><tr><th>Event</th><th>Customer</th><th>Type</th><th>Points</th><th>Logged</th></tr></thead>
          <tbody>
            {visibleAuditRows.map(transaction => (
              <tr key={transaction.id}>
                <td><strong>{transaction.description}</strong><span>{transaction.id}</span></td>
                <td>{customerNames[transaction.customerId] ?? `Customer #${transaction.customerId}`}</td>
                <td>{transaction.type.replace('_', ' ') || 'unknown'}</td>
                <td><strong className={transaction.points >= 0 ? styles.pointsPositive : styles.pointsNegative}>{transaction.points >= 0 ? '+' : ''}{transaction.points} pts</strong></td>
                <td>{safeFormatDate(transaction.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {auditLoading && <div className={styles.emptyState}><LoaderCircle className={styles.spinner} size={28} aria-hidden="true" /><strong>Loading audit logs…</strong><span>Requesting the live points ledger.</span></div>}
        {!auditLoading && visibleAuditRows.length === 0 && !auditError && <div className={styles.emptyState}><Sparkles size={28} aria-hidden="true" /><strong>No audit logs found</strong><span>Try another point transaction type.</span></div>}
      </div>
    </section>
  );
}
