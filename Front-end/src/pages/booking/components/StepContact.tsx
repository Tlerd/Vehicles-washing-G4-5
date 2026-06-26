import React, { useState, useEffect } from 'react';
import { useBooking, Vehicle } from '../../../context/BookingContext';
import { User, Phone, Mail, Car, ChevronDown, Lock, Pencil, Info } from 'lucide-react';

export const StepContact: React.FC = () => {
  const { state, updateState, currentUser, vehicles } = useBooking();
  
  // Check if this is a registered customer (not guest)
  const isRegistered = currentUser !== null && currentUser.id !== 'guest';

  // Get vehicles belonging to the current user
  const userVehicles = isRegistered ? vehicles.filter(v => v.customerId === currentUser.id) : [];
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    userVehicles.find(v => v.isDefault)?.id || userVehicles[0]?.id || ''
  );

  // Auto-fill customer info for registered users when component mounts or vehicle changes
  useEffect(() => {
    if (isRegistered && currentUser) {
      const selectedVehicle = userVehicles.find(v => v.id === selectedVehicleId);
      updateState({
        customerInfo: {
          ...state.customerInfo,
          name: currentUser.name,
          phone: currentUser.phone,
          email: currentUser.email || '',
          licensePlate: selectedVehicle?.licensePlate || '',
          vehicleModel: selectedVehicle?.brand || '',
        }
      });
    }
  }, [selectedVehicleId]);

  const handleInputChange = (field: string, value: any) => {
    updateState(prev => ({
      customerInfo: { ...prev.customerInfo, [field]: value }
    }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const v = userVehicles.find(ve => ve.id === vehicleId);
    if (v) {
      updateState({
        customerInfo: {
          ...state.customerInfo,
          licensePlate: v.licensePlate,
          vehicleModel: v.brand,
        },
        vehicleSize: v.size,
      });
    }
  };

  const isFormValid = 
    state.customerInfo.name && 
    state.customerInfo.phone && 
    state.customerInfo.licensePlate && 
    state.customerInfo.vehicleModel &&
    (!state.customerInfo.createAccount || state.customerInfo.password);

  // ─── REGISTERED USER VIEW ───
  if (isRegistered) {
    const selectedVehicle = userVehicles.find(v => v.id === selectedVehicleId);

    return (
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Xác Nhận Thông Tin</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Thông tin được lấy từ tài khoản của bạn.</p>

        <div className="glass-card p-6 space-y-5">
          {/* Info notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Thông tin cá nhân được tự động điền từ tài khoản. Để chỉnh sửa, vui lòng vào <strong className="text-blue-400">Thông tin cá nhân</strong> trong Dashboard.</span>
          </div>

          {/* Vehicle Selector — only if more than 1 vehicle */}
          {userVehicles.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Chọn xe
              </label>
              <div className="relative">
                <select
                  value={selectedVehicleId}
                  onChange={e => handleVehicleChange(e.target.value)}
                  className="w-full glass-input appearance-none pr-10 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  {userVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} — {v.licensePlate} ({v.size}){v.isDefault ? ' ★ Mặc định' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Read-only Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Họ và tên
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span>{currentUser.name}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Số điện thoại
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span>{currentUser.phone}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span>{currentUser.email || '—'}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Loại xe
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span>{selectedVehicle?.brand || '—'}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Biển số xe
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span className="font-mono">{selectedVehicle?.licensePlate || '—'}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Kích thước
              </label>
              <div className="glass-input py-2 text-sm flex items-center justify-between bg-slate-800/30 cursor-not-allowed opacity-80">
                <span className="capitalize">{selectedVehicle?.size || '—'}</span>
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => updateState({ currentStep: 3 })} className="btn-secondary">Quay lại</button>
          <button 
            onClick={() => updateState({ currentStep: 5 })}
            className="btn-primary"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      </div>
    );
  }

  // ─── GUEST / UNREGISTERED VIEW ───
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-2 text-center">Thông Tin Liên Hệ</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Vui lòng điền đầy đủ thông tin. Các trường (*) là bắt buộc.</p>

      <div className="glass-card p-6 space-y-4">
        {/* Editable notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
          <Pencil className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Bạn đang đặt với tư cách <strong>khách vãng lai</strong>. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Họ và tên *
            </label>
            <input 
              type="text" 
              required 
              value={state.customerInfo.name} 
              onChange={e => handleInputChange('name', e.target.value)} 
              className="glass-input" 
              placeholder="Nguyễn Văn A" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Số điện thoại *
            </label>
            <input 
              type="tel" 
              required 
              value={state.customerInfo.phone} 
              onChange={e => handleInputChange('phone', e.target.value)} 
              className="glass-input" 
              placeholder="0901234567" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input 
            type="email" 
            value={state.customerInfo.email} 
            onChange={e => handleInputChange('email', e.target.value)} 
            className="glass-input" 
            placeholder="email@example.com" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Biển số xe *
            </label>
            <input 
              type="text" 
              required 
              value={state.customerInfo.licensePlate} 
              onChange={e => handleInputChange('licensePlate', e.target.value)} 
              className="glass-input" 
              placeholder="VD: 51F-12345" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Hãng / Model xe *
            </label>
            <input 
              type="text" 
              required 
              value={state.customerInfo.vehicleModel} 
              onChange={e => handleInputChange('vehicleModel', e.target.value)} 
              className="glass-input" 
              placeholder="Toyota Camry" 
            />
          </div>
        </div>

        {/* Create Account Checkbox */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox"
              checked={!!state.customerInfo.createAccount}
              onChange={e => handleInputChange('createAccount', e.target.checked)}
              className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange accent-orange-500 cursor-pointer"
            />
            <span className="text-sm font-semibold">Tạo tài khoản để tích điểm & xem lịch sử</span>
          </label>

          {state.customerInfo.createAccount && (
            <div className="flex flex-col gap-1 mt-4 max-w-sm">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mật khẩu tài khoản</label>
              <input 
                type="password" 
                required 
                value={state.customerInfo.password || ''} 
                onChange={e => handleInputChange('password', e.target.value)} 
                className="glass-input" 
                placeholder="Tối thiểu 6 ký tự" 
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={() => updateState({ currentStep: 3 })} className="btn-secondary">Quay lại</button>
        <button 
          disabled={!isFormValid}
          onClick={() => updateState({ currentStep: 5 })}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tiếp tục thanh toán
        </button>
      </div>
    </div>
  );
};
