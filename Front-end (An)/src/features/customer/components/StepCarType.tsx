import React, { useEffect, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { CAR_TYPES } from '../../../config/constants';
import { CarSize, Vehicle } from '../../../types';
import { vehicleService } from '../../../services/customer/vehicle.service';
import styles from '../styles/StepCarType.module.css';

export const StepCarType: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      setIsLoading(true);
      vehicleService.getVehicles(currentUser.id)
        .then(setVehicles)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    updateDraft({ 
      vehicleId: vehicle.id,
      carSize: vehicle.size 
    });
  };

  const handleSelectCarType = (size: CarSize) => {
    updateDraft({ 
      vehicleId: null,
      carSize: size 
    });
  };

  return (
    <div className={styles.container}>
      {vehicles.length > 0 && (
        <>
          <h3 className={styles.title}>Select from your vehicles</h3>
          <p className={styles.subtitle}>Choose one of your saved vehicles for this booking</p>
          
          <div className={styles.grid} style={{ marginBottom: '2rem' }}>
            {vehicles.map(v => (
              <div
                key={v.id}
                className={`${styles.card} ${draft.vehicleId === v.id ? styles.cardSelected : ''}`}
                onClick={() => handleSelectVehicle(v)}
              >
                <span className={styles.cardIcon}>{CAR_TYPES.find(c => c.id === v.size)?.icon || '🚗'}</span>
                <div className={styles.cardName}>{v.brand}</div>
                <div className={styles.cardDesc}>{v.licensePlate}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className={styles.title}>{vehicles.length > 0 ? 'Or select a vehicle type' : 'Select your vehicle type'}</h3>
      <p className={styles.subtitle}>Choose the type that best matches your vehicle</p>

      <div className={styles.grid}>
        {CAR_TYPES.map(car => (
          <div
            key={car.id}
            className={`${styles.card} ${!draft.vehicleId && draft.carSize === car.id ? styles.cardSelected : ''}`}
            onClick={() => handleSelectCarType(car.id as CarSize)}
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
