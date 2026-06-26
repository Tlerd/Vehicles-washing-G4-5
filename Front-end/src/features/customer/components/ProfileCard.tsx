import React from 'react';
import { Customer } from '../../../types';
import { formatDate } from '../../../utils/formatters';
import styles from '../styles/ProfileCard.module.css';

interface ProfileCardProps {
  customer: Customer;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ customer }) => {
  return (
    <div className={styles.profileCard}>
      <div className={styles.avatarLarge}>
        {customer.name.charAt(0).toUpperCase()}
      </div>
      <div className={styles.name}>{customer.name}</div>
      <div className={styles.email}>{customer.email || customer.phone}</div>
      <div className={styles.tierBadge}>{customer.tier}</div>
      <div className={styles.memberSince}>
        Thành viên từ {formatDate(customer.createdAt)}
      </div>
    </div>
  );
};
