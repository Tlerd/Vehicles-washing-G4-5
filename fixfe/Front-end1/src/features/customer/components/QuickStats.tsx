import React from 'react';
import { formatPrice } from '../../../utils/formatters';
import styles from '../styles/QuickStats.module.css';

interface QuickStatsProps {
  points: number;
  totalBookings: number;
  completedWashes: number;
  totalSpent: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  points, totalBookings, completedWashes, totalSpent,
}) => {
  const stats = [
    { icon: '⭐', value: points.toLocaleString(), label: 'Points' },
    { icon: '📅', value: totalBookings.toString(), label: 'Total bookings' },
    { icon: '✅', value: completedWashes.toString(), label: 'Completed' },
    { icon: '💰', value: formatPrice(totalSpent), label: 'Total spent' },
  ];

  return (
    <div className={styles.statsRow}>
      {stats.map((stat, i) => (
        <div key={i} className={styles.statCard}>
          <span className={styles.statIcon}>{stat.icon}</span>
          <span className={styles.statValue}>{stat.value}</span>
          <span className={styles.statLabel}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
};
