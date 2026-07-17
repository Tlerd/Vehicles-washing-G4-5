import React from 'react';
import { PointsTransaction } from '../../../types';
import { getRelativeTime } from '../../../utils/formatters';
import styles from '../styles/PointsHistory.module.css';

interface PointsHistoryProps {
  transactions: PointsTransaction[];
}

const getIcon = (type: string): string => {
  switch (type) {
    case 'earn': return '📈';
    case 'redeem': return '🎁';
    case 'tier_change': return '🏆';
    case 'expire': return '⏳';
    default: return '•';
  }
};

const getIconClass = (type: string, s: typeof styles): string => {
  switch (type) {
    case 'earn': return s.iconEarn;
    case 'redeem': return s.iconRedeem;
    case 'tier_change': return s.iconTierChange;
    case 'expire': return s.iconExpire;
    default: return '';
  }
};

export const PointsHistory: React.FC<PointsHistoryProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return <div className={styles.empty}>No points activity yet</div>;
  }

  return (
    <div className={styles.list}>
      {transactions.map(tx => (
        <div key={tx.id} className={styles.item}>
          <div className={`${styles.icon} ${getIconClass(tx.type, styles)}`}>
            {getIcon(tx.type)}
          </div>
          <div className={styles.content}>
            <div className={styles.desc}>{tx.description}</div>
            <div className={styles.time}>{getRelativeTime(tx.createdAt)}</div>
          </div>
          <span className={`${styles.points} ${
            tx.points > 0 ? styles.pointsPositive :
            tx.points < 0 ? styles.pointsNegative :
            styles.pointsNeutral
          }`}>
            {tx.points > 0 ? '+' : ''}{tx.points === 0 ? '—' : tx.points}
          </span>
        </div>
      ))}
    </div>
  );
};
