import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, CarSize } from '../../../types';
import { vehicleService } from '../../../services/customer/vehicle.service';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { Modal } from '../../../components/Modal/Modal';
import { CAR_TYPES } from '../../../config/constants';
import styles from '../styles/VehicleList.module.css';

export const VehicleList: React.FC = () => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formPlate, setFormPlate] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSize, setFormSize] = useState<CarSize>('sedan');
  const [formNotes, setFormNotes] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Delete confirmation states
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVehicles = async () => {
    if (!currentUser || currentUser.id === 'guest') {
      setVehicles([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await vehicleService.getVehicles(currentUser.id);
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [currentUser]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const resetForm = () => {
    setFormPlate('');
    setFormBrand('');
    setFormSize('sedan');
    setFormNotes('');
    setFormIsDefault(false);
    setEditingVehicle(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (v: Vehicle) => {
    setFormPlate(v.licensePlate);
    setFormBrand(v.brand);
    setFormSize(v.size);
    setFormNotes(v.notes || '');
    setFormIsDefault(v.isDefault);
    setEditingVehicle(v);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formPlate.trim() || !formBrand.trim() || !currentUser || currentUser.id === 'guest') return;
    setIsSaving(true);
    
    try {
      if (editingVehicle) {
        // Submit only changed fields
        const updates: Partial<Vehicle> = {};
        const normalizedPlate = formPlate.trim().toUpperCase();
        const normalizedBrand = formBrand.trim();
        if (editingVehicle.licensePlate !== normalizedPlate) updates.licensePlate = normalizedPlate;
        if (editingVehicle.brand !== normalizedBrand) updates.brand = normalizedBrand;
        if (editingVehicle.size !== formSize) updates.size = formSize;
        if (editingVehicle.notes !== formNotes) updates.notes = formNotes;
        if (!editingVehicle.isDefault && formIsDefault) updates.isDefault = true;
        
        if (Object.keys(updates).length > 0) {
          await vehicleService.updateVehicle(editingVehicle.id, updates);
        }
      } else {
        await vehicleService.addVehicle(currentUser.id, formPlate.trim().toUpperCase(), formBrand.trim(), formSize, formNotes.trim(), formIsDefault);
      }
      await fetchVehicles();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save vehicle', error);
      alert('Could not save vehicle. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (v: Vehicle) => {
    setVehicleToDelete(v);
  };

  const handleSetDefault = async (vehicle: Vehicle) => {
    if (!currentUser || vehicle.isDefault) return;
    setSettingDefaultId(vehicle.id);
    try {
      await vehicleService.setDefaultVehicle(vehicle.id, currentUser.id);
      await fetchVehicles();
    } catch (error) {
      console.error('Failed to set default vehicle', error);
      alert('Could not set this vehicle as default.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      await fetchVehicles();
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Failed to delete vehicle', error);
      alert('Could not delete vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  const sizeIcon = (size: string) => {
    const car = CAR_TYPES.find(c => c.id === size);
    return car?.icon || '🚗';
  };

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>My vehicles</h3>
        <button className={styles.addBtn} onClick={openAddForm}>+ Add new vehicle</button>
      </div>

      <div className={styles.searchWrap}>
        <Input 
          placeholder="Search by plate or brand..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm ? 'No vehicles match your search.' : 'No vehicles yet. Add your first vehicle!'}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredVehicles.map(v => (
            <div key={v.id} className={styles.vehicleItem}>
              <span className={styles.vehicleIcon}>{sizeIcon(v.size)}</span>
              <div className={styles.vehicleInfo}>
                <div className={styles.vehicleName}>{v.brand}</div>
                <div className={styles.vehiclePlate}>{v.licensePlate}</div>
                {v.isDefault && <span className={styles.defaultBadge}>✓ Default vehicle</span>}
              </div>
              <span className={styles.vehicleSize}>{v.size.toUpperCase()}</span>
              <div className={styles.vehicleActions}>
                {!v.isDefault && (
                  <button
                    className={styles.defaultBtn}
                    onClick={() => handleSetDefault(v)}
                    disabled={settingDefaultId === v.id}
                  >
                    {settingDefaultId === v.id ? 'Setting...' : 'Set default'}
                  </button>
                )}
                <button className={styles.actionBtn} onClick={() => openEditForm(v)} aria-label={`Edit ${v.licensePlate}`}>✏️</button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => confirmDelete(v)} aria-label={`Delete ${v.licensePlate}`}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editingVehicle ? 'Edit vehicle info' : 'Add new vehicle'}
        size="sm"
      >
        <div className={styles.formGrid}>
          <Input
            label="License plate"
            placeholder="51G-123.45"
            value={formPlate}
            onChange={e => setFormPlate(e.target.value)}
          />
          <Input
            label="Brand / Model"
            placeholder="Toyota Camry"
            value={formBrand}
            onChange={e => setFormBrand(e.target.value)}
          />
          <div>
            <label className={styles.fieldLabel}>
              Vehicle size
            </label>
            <div className={styles.sizeSelect}>
              {CAR_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`${styles.sizeOption} ${formSize === ct.id ? styles.sizeOptionActive : ''}`}
                  onClick={() => setFormSize(ct.id as CarSize)}
                  type="button"
                >
                  {ct.icon} {ct.name}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Notes (Optional)"
            placeholder="E.g., White car, leather seats"
            value={formNotes}
            onChange={e => setFormNotes(e.target.value)}
          />
          <label className={styles.defaultCheckbox}>
            <input
              type="checkbox"
              checked={formIsDefault}
              disabled={editingVehicle?.isDefault}
              onChange={e => setFormIsDefault(e.target.checked)}
            />
            Set as default vehicle
          </label>
          <div className={styles.formActions}>
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !formPlate || !formBrand}>
              {isSaving ? 'Saving...' : editingVehicle ? 'Update' : 'Add new vehicle'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className={styles.confirmContent}>
          <p className={styles.confirmText}>
            Are you sure you want to delete the vehicle <strong>{vehicleToDelete?.licensePlate} ({vehicleToDelete?.brand})</strong>? 
            This action cannot be undone.
          </p>
          <div className={styles.formActions}>
            <Button variant="secondary" size="sm" onClick={() => setVehicleToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
