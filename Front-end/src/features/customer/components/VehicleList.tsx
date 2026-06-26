import React, { useState } from 'react';
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
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    vehicleService.getVehicles(currentUser?.id || '')
  );
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formPlate, setFormPlate] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSize, setFormSize] = useState<CarSize>('sedan');
  const [formNotes, setFormNotes] = useState('');

  const refreshVehicles = () => {
    setVehicles(vehicleService.getVehicles(currentUser?.id || ''));
  };

  const resetForm = () => {
    setFormPlate('');
    setFormBrand('');
    setFormSize('sedan');
    setFormNotes('');
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
    setEditingVehicle(v);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formPlate || !formBrand) return;

    if (editingVehicle) {
      vehicleService.updateVehicle(editingVehicle.id, {
        licensePlate: formPlate,
        brand: formBrand,
        size: formSize,
        notes: formNotes,
      });
    } else {
      vehicleService.addVehicle(currentUser?.id || '', formPlate, formBrand, formSize, formNotes);
    }

    refreshVehicles();
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    vehicleService.deleteVehicle(id);
    refreshVehicles();
  };

  const sizeIcon = (size: string) => {
    const car = CAR_TYPES.find(c => c.id === size);
    return car?.icon || '🚗';
  };

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>🚗 Xe của tôi</h3>
        <button className={styles.addBtn} onClick={openAddForm}>+ Thêm xe mới</button>
      </div>

      {vehicles.length === 0 ? (
        <div className={styles.empty}>Chưa có xe nào. Hãy thêm chiếc xe đầu tiên của bạn!</div>
      ) : (
        <div className={styles.list}>
          {vehicles.map(v => (
            <div key={v.id} className={styles.vehicleItem}>
              <span className={styles.vehicleIcon}>{sizeIcon(v.size)}</span>
              <div className={styles.vehicleInfo}>
                <div className={styles.vehicleName}>{v.brand}</div>
                <div className={styles.vehiclePlate}>{v.licensePlate}</div>
              </div>
              <span className={styles.vehicleSize}>{v.size.toUpperCase()}</span>
              <div className={styles.vehicleActions}>
                <button className={styles.actionBtn} onClick={() => openEditForm(v)}>✏️</button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(v.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editingVehicle ? 'Sửa thông tin xe' : 'Thêm xe mới'}
        size="sm"
      >
        <div className={styles.formGrid}>
          <Input
            label="Biển số xe"
            placeholder="51G-123.45"
            value={formPlate}
            onChange={e => setFormPlate(e.target.value)}
          />
          <Input
            label="Hãng xe / Mẫu xe"
            placeholder="Toyota Camry"
            value={formBrand}
            onChange={e => setFormBrand(e.target.value)}
          />
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Kích thước xe
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
            label="Ghi chú (Không bắt buộc)"
            placeholder="VD: Xe màu trắng, ghế da"
            value={formNotes}
            onChange={e => setFormNotes(e.target.value)}
          />
          <div className={styles.formActions}>
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
              Huỷ
            </Button>
            <Button size="sm" onClick={handleSave}>
              {editingVehicle ? 'Cập nhật' : 'Thêm xe mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
