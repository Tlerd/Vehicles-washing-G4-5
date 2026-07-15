import React, { useEffect, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { catalogService } from '../../../services/customer/catalog.service';
import { Branch } from '../../../types';
import styles from '../styles/StepBranch.module.css';

export const StepBranch: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const [branches, setBranches] = useState<Branch[]>(catalogService.getCachedBranches());
  const [isLoading, setIsLoading] = useState(branches.length === 0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    catalogService.getBranches()
      .then(items => {
        if (active) setBranches(items);
      })
      .catch(error => {
        console.error('Failed to load branch catalog', error);
        if (active) setLoadError('Unable to load available branches. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Select branch</h3>
      <p className={styles.subtitle}>Choose the nearest location for your booking</p>

      {isLoading && <div className={styles.notice}>Loading available branches...</div>}
      {loadError && <div className={`${styles.notice} ${styles.errorNotice}`}>{loadError}</div>}

      <div className={styles.grid}>
        {branches.map(branch => {
          const isAvailable = branch.status !== 'COMING_SOON';
          return (
            <div
              key={branch.id}
              className={`${styles.card} ${draft.branchId === branch.id ? styles.cardSelected : ''} ${!isAvailable ? styles.cardDisabled : ''}`}
              onClick={() => isAvailable && updateDraft({ branchId: branch.id, date: null, time: null, endTime: undefined, durationMinutes: undefined })}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📍</span>
                  <div className={styles.cardName}>{branch.name}</div>
                </div>
                <div className={`${styles.badge} ${isAvailable ? styles.badgeAvailable : styles.badgeBusy}`}>
                  {isAvailable ? '🟢 Available' : '🔴 Coming soon'}
                </div>
              </div>
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
          );
        })}
      </div>
    </div>
  );
};
