import React from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { BRANCHES } from '../../../config/constants';
import styles from '../styles/StepBranch.module.css';

export const StepBranch: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Select branch</h3>
      <p className={styles.subtitle}>Choose the nearest location for your booking</p>

      <div className={styles.grid}>
        {BRANCHES.map(branch => (
          <div
            key={branch.id}
            className={`${styles.card} ${draft.branchId === branch.id ? styles.cardSelected : ''}`}
            onClick={() => updateDraft({ branchId: branch.id })}
          >
            <span className={styles.cardIcon}>📍</span>
            <div className={styles.cardName}>{branch.name}</div>
            <div className={styles.cardAddress}>{branch.address}</div>
            <div className={styles.cardMeta}>
              <span className={styles.cardMetaItem}>
                <span className={styles.cardMetaIcon}>📞</span>
                {branch.phone}
              </span>
              <span className={styles.cardMetaItem}>
                <span className={styles.cardMetaIcon}>🕐</span>
                {branch.openTime} - {branch.closeTime}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
