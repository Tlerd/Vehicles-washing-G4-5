import { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, Gauge, ShieldCheck, Sparkles } from 'lucide-react';
import type { Booking, PointsTransaction } from '../../../types';
import { formatDate, formatPrice } from '../../../utils/formatters';
import {
  getPointAuditRows,
  getRevenueSummary,
  PointAuditTypeFilter,
  RevenueBranchFilter,
  RevenuePeriod,
} from '../revenueAudit';
import styles from './RevenueAuditPanel.module.css';

const pointAuditTypes: PointAuditTypeFilter[] = ['ALL', 'earn', 'redeem', 'expire', 'tier_change'];

interface RevenueAuditPanelProps {
  bookings: Booking[];
  transactions: PointsTransaction[];
  getCustomerName: (customerId: string) => string;
}

export function RevenueAuditPanel({
  bookings,
  transactions,
  getCustomerName,
}: RevenueAuditPanelProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('day');
  const [revenueDate, setRevenueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revenueBranch, setRevenueBranch] = useState<RevenueBranchFilter>('ALL');
  const [pointAuditType, setPointAuditType] = useState<PointAuditTypeFilter>('ALL');

  const summary = useMemo(
    () =>
      getRevenueSummary({
        bookings,
        period: revenuePeriod,
        anchorDate: revenueDate,
        branch: revenueBranch,
      }),
    [bookings, revenueBranch, revenueDate, revenuePeriod],
  );

  const auditRows = useMemo(
    () => getPointAuditRows(transactions, pointAuditType),
    [pointAuditType, transactions],
  );

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <label className={styles.selectControl}>
          <CalendarClock size={16} aria-hidden="true" />
          <input
            type="date"
            value={revenueDate}
            onChange={event => setRevenueDate(event.target.value)}
          />
        </label>

        <label className={styles.selectControl}>
          <BarChart3 size={16} aria-hidden="true" />
          <select
            value={revenuePeriod}
            onChange={event => setRevenuePeriod(event.target.value as RevenuePeriod)}
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>

        <label className={styles.selectControl}>
          <Gauge size={16} aria-hidden="true" />
          <select
            value={revenueBranch}
            onChange={event => setRevenueBranch(event.target.value)}
          >
            <option value="ALL">All branches</option>
            <option value="D1">District 1</option>
            <option value="D7">District 7</option>
          </select>
        </label>

        <label className={styles.selectControl}>
          <ShieldCheck size={16} aria-hidden="true" />
          <select
            value={pointAuditType}
            onChange={event => setPointAuditType(event.target.value as PointAuditTypeFilter)}
          >
            {pointAuditTypes.map(type => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All point logs' : type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.revenueGrid}>
        <article className={styles.revenueCard}>
          <span>Revenue</span>
          <strong>{formatPrice(summary.revenue)}</strong>
          <small>{summary.completedWashes} completed washes</small>
        </article>
        <article className={styles.revenueCard}>
          <span>Average ticket</span>
          <strong>{formatPrice(summary.averageTicket)}</strong>
          <small>Computed from completed bookings only</small>
        </article>
        <article className={styles.revenueCard}>
          <span>Audit events</span>
          <strong>{auditRows.length}</strong>
          <small>Newest point changes first</small>
        </article>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.auditTable}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Points</th>
              <th>Logged</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.map(transaction => (
              <tr key={transaction.id}>
                <td>
                  <strong>{transaction.description}</strong>
                  <span>{transaction.id}</span>
                </td>
                <td>{getCustomerName(transaction.customerId)}</td>
                <td>{transaction.type.replace('_', ' ')}</td>
                <td>
                  <strong className={transaction.points >= 0 ? styles.pointsPositive : styles.pointsNegative}>
                    {transaction.points >= 0 ? '+' : ''}
                    {transaction.points} pts
                  </strong>
                </td>
                <td>{formatDate(transaction.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {auditRows.length === 0 && (
          <div className={styles.emptyState}>
            <Sparkles size={28} aria-hidden="true" />
            <strong>No audit logs found</strong>
            <span>Try another point transaction type.</span>
          </div>
        )}
      </div>
    </section>
  );
}
