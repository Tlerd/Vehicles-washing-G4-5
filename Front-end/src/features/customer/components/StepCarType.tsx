import React from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { CAR_TYPES } from '../../../config/constants';
import { CarSize } from '../../../types';
import styles from '../styles/StepCarType.module.css';

export const StepCarType: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Chọn loại phương tiện của bạn</h3>
      <p className={styles.subtitle}>Chọn loại xe phù hợp nhất với phương tiện của bạn</p>

      <div className={styles.grid}>
        {CAR_TYPES.map(car => (
          <div
            key={car.id}
            className={`${styles.card} ${draft.carSize === car.id ? styles.cardSelected : ''}`}
            onClick={() => updateDraft({ carSize: car.id as CarSize })}
          >
            <span className={styles.cardIcon}>{car.icon}</span>
            <div className={styles.cardName}>{car.name}</div>
            <div className={styles.cardDesc}>{car.description}</div>
            <span className={styles.cardMultiplier}>×{car.multiplier}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
