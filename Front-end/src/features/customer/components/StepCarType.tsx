import React, { useEffect, useState } from 'react';
import { useCustomerBooking } from '../../../context/CustomerBookingContext';
import { useAuth } from '../../../context/AuthContext';
import { CAR_TYPES } from '../../../config/constants';
import { CarSize, Vehicle } from '../../../types';
import { vehicleService } from '../../../services/customer/vehicle.service';
import { Modal } from '../../../components/Modal/Modal';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import styles from '../styles/StepCarType.module.css';

export const StepCarType: React.FC = () => {
  const { draft, updateDraft } = useCustomerBooking();
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSize, setNewSize] = useState<CarSize>('sedan');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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
      carSize: vehicle.size, vehiclePlate: vehicle.licensePlate, vehicleBrand: vehicle.brand,
    });
  };

  const handleSelectCarType = (size: CarSize) => {
    setNewSize(size);
    setNewPlate('');
    setNewBrand('');
    setSaveError('');
    updateDraft({ vehicleId:null, carSize:size, vehiclePlate:'', vehicleBrand:'' });
    setShowAddVehicle(true);
  };

  const handleAddVehicle = async () => {
    if (!currentUser || currentUser.id === 'guest' || !newPlate.trim() || !newBrand.trim()) return;
    setIsSaving(true); setSaveError('');
    try {
      const created = await vehicleService.addVehicle(currentUser.id,newPlate.trim().toUpperCase(),newBrand.trim(),newSize);
      const refreshed = await vehicleService.getVehicles(currentUser.id);
      setVehicles(refreshed);
      handleSelectVehicle(created);
      setShowAddVehicle(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add vehicle.';
      setSaveError(message);
    } finally { setIsSaving(false); }
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
      <Modal isOpen={showAddVehicle} onClose={()=>setShowAddVehicle(false)} title="Add new vehicle" size="sm">
        <div className={styles.addVehicleForm}>
          <Input label="License plate" value={newPlate} onChange={e=>setNewPlate(e.target.value.toUpperCase())} placeholder="51A-12345" />
          <Input label="Brand / Model" value={newBrand} onChange={e=>setNewBrand(e.target.value)} placeholder="Toyota Camry" />
          <div><span className={styles.formLabel}>Vehicle size</span><div className={styles.sizeOptions}>{CAR_TYPES.map(car=><button type="button" key={car.id} className={newSize===car.id?styles.sizeActive:''} onClick={()=>setNewSize(car.id as CarSize)}>{car.icon} {car.name}</button>)}</div></div>
          {saveError && <p className={styles.formError}>{saveError}</p>}
          <div className={styles.formActions}><Button variant="secondary" onClick={()=>setShowAddVehicle(false)}>Cancel</Button><Button onClick={handleAddVehicle} loading={isSaving} disabled={!newPlate.trim()||!newBrand.trim()}>Add vehicle</Button></div>
        </div>
      </Modal>
    </div>
  );
};
