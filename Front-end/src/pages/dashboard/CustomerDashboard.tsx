import React, { useState } from 'react';
import { useBooking, Customer, Vehicle, RedeemedVoucher } from '../../context/BookingContext';
import {
  Car, Calendar, CreditCard, Gift, Award, Plus, Trash2, Edit, Check, ShieldAlert, Sparkles, AlertCircle, Upload
} from 'lucide-react';

interface CustomerDashboardProps {
  onStartBooking: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onStartBooking }) => {
  const {
    currentUser, customers, vehicles, bookings, vouchers, transactionLogs, promotions,
    addVehicle, updateVehicle, deleteVehicle, redeemVoucher
  } = useBooking();

  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'loyalty' | 'redeem' | 'promotions'>('info');

  // Vehicle Form States
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Vehicle | null>(null);
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState<'hatchback' | 'sedan' | 'suv' | 'pickup'>('sedan');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isUploadingLPR, setIsUploadingLPR] = useState(false);

  if (!currentUser) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

  // Filter lists for current user
  const userVehicles = vehicles.filter(v => v.customerId === currentUser.id);
  const userBookings = bookings.filter(b => b.customerId === currentUser.id);
  const userLogs = transactionLogs.filter(l => l.customerId === currentUser.id);
  const userVouchers = vouchers.filter(v => v.customerId === currentUser.id);

  // Next Tier calculation
  const completedWashes = userBookings.filter(b => b.status === 'COMPLETED').length;
  const currentTier = currentUser.tier;

  let nextTierName = '';
  let washesNeeded = 0;
  let spendNeeded = 0;
  let progressPercent = 0;

  // FR-007: Points expiring in the next 30 days (BR-008)
  // In production this comes from the backend. Here we simulate with transaction logs.
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const oneYearFromEarnDate = (earnDate: string) => {
    const d = new Date(earnDate);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  };
  const expiringLogs = userLogs.filter(l => {
    if (l.points <= 0) return false;
    const expireDate = oneYearFromEarnDate(l.createdAt);
    return expireDate >= now && expireDate <= thirtyDaysFromNow;
  });
  const expiringPointsTotal = expiringLogs.reduce((sum, l) => sum + l.points, 0);

  if (currentTier === 'Member') {
    nextTierName = 'Silver';
    washesNeeded = Math.max(0, 5 - completedWashes);
    spendNeeded = Math.max(0, 2000000 - currentUser.totalSpend);
    progressPercent = Math.min(100, (completedWashes / 5) * 100);
  } else if (currentTier === 'Silver') {
    nextTierName = 'Gold';
    washesNeeded = Math.max(0, 15 - completedWashes);
    spendNeeded = Math.max(0, 6000000 - currentUser.totalSpend);
    progressPercent = Math.min(100, (completedWashes / 15) * 100);
  } else if (currentTier === 'Gold') {
    nextTierName = 'Platinum';
    washesNeeded = Math.max(0, 30 - completedWashes);
    spendNeeded = Math.max(0, 15000000 - currentUser.totalSpend);
    progressPercent = Math.min(100, (completedWashes / 30) * 100);
  }

  // LPR Scanner Mock
  const handleLPRPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingLPR(true);
    setTimeout(() => {
      // Simulate reading plate from image
      const platesMock = ['51K-928.37', '51H-283.91', '30F-928.18', '59C-382.19'];
      const chosenPlate = platesMock[Math.floor(Math.random() * platesMock.length)];
      setPlate(chosenPlate);
      setBrand('Mercedes GLC');
      setSize('suv');
      setIsUploadingLPR(false);
    }, 1500);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVeh) {
      updateVehicle(editingVeh.id, { licensePlate: plate, brand, size, notes, isDefault });
    } else {
      addVehicle({
        customerId: currentUser.id,
        licensePlate: plate,
        brand,
        size,
        notes,
        isDefault
      });
    }
    // reset
    setPlate('');
    setBrand('');
    setSize('sedan');
    setNotes('');
    setIsDefault(false);
    setShowAddVeh(false);
    setEditingVeh(null);
  };

  const handleEditClick = (v: Vehicle) => {
    setEditingVeh(v);
    setPlate(v.licensePlate);
    setBrand(v.brand);
    setSize(v.size);
    setNotes(v.notes || '');
    setIsDefault(v.isDefault);
    setShowAddVeh(true);
  };

  const handleRedeem = (type: RedeemedVoucher['type'], points: number, title: string) => {
    if (currentUser.accumulatedPoints < points) {
      alert('Insufficient points balance.');
      return;
    }
    const ok = redeemVoucher(currentUser.id, type, points, title);
    if (ok) {
      alert(`Voucher "${title}" redeemed successfully!`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 text-slate-100 flex-1 flex flex-col md:flex-row gap-8">
      {/* Sidebar: Profile Summary */}
      <div className="w-full md:w-80 shrink-0 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white leading-tight">{currentUser.name}</h2>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${currentTier === 'Platinum' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  currentTier === 'Gold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    currentTier === 'Silver' ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' :
                      'bg-slate-850 text-slate-400 border border-slate-800'
                }`}>
                {currentTier} Member
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300 pt-3 border-t border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-bold">{currentUser.phone}</span>
            </div>
            {currentUser.email && (
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-bold">{currentUser.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Total Spend:</span>
              <span className="font-bold text-white">{currentUser.totalSpend.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Washes count:</span>
              <span className="font-bold text-white">{completedWashes} washes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loyalty Points:</span>
              <span className="font-extrabold text-orange-400 text-sm">{currentUser.accumulatedPoints} pts</span>
            </div>
          </div>

          <button
            onClick={onStartBooking}
            className="w-full bg-orange-500 hover:bg-orange-450 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-6 flex justify-center items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Book a New Wash
          </button>
        </div>

        {/* Tab Selector Links */}
        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-2xl flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeTab === 'info' ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Car className="w-4 h-4" /> Profile & Vehicles
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeTab === 'history' ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Calendar className="w-4 h-4" /> Booking History
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeTab === 'loyalty' ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Award className="w-4 h-4" /> Loyalty Progress
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeTab === 'redeem' ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Gift className="w-4 h-4" /> Redeem Rewards
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeTab === 'promotions' ? 'bg-blue-600/15 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sparkles className="w-4 h-4" /> System Campaigns
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 space-y-6">

        {/* TAB 1: Profile & Vehicles */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Registered Vehicles</h2>
              {!showAddVeh && (
                <button
                  onClick={() => setShowAddVeh(true)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl text-blue-400 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Vehicle
                </button>
              )}
            </div>

            {showAddVeh && (
              <form onSubmit={handleSaveVehicle} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                  {editingVeh ? 'Edit Vehicle Info' : 'Register New Vehicle'}
                </h3>

                {/* LPR Image Upload Simulation */}
                {!editingVeh && (
                  <div className="bg-slate-950/80 border border-dashed border-slate-800 p-4 rounded-xl text-center flex flex-col items-center justify-center relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="lpr-upload"
                      onChange={handleLPRPhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 font-semibold">Upload Photo of License Plate</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Let AI automatically fill license plate details</span>
                    {isUploadingLPR && (
                      <span className="text-xs text-blue-400 mt-2 animate-pulse">Scanning plate photo...</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">License Plate</label>
                    <input
                      type="text"
                      required
                      value={plate}
                      onChange={e => setPlate(e.target.value)}
                      placeholder="e.g. 51G-123.45"
                      className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">Car Brand / Model</label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="e.g. Toyota Camry"
                      className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">Vehicle Size</label>
                    <select
                      value={size}
                      onChange={e => setSize(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="hatchback">Hatchback (Small)</option>
                      <option value="sedan">Sedan (Medium)</option>
                      <option value="suv">SUV / CUV (Large)</option>
                      <option value="pickup">Pickup Truck (Extra Large)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">Notes / Special Instructions</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Low clearance, ceramic coated"
                      className="bg-slate-950 border border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="set-default"
                    checked={isDefault}
                    onChange={e => setIsDefault(e.target.checked)}
                    className="w-4 h-4 bg-slate-950 border-slate-800 text-blue-500 accent-blue-500 rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="set-default" className="text-xs text-slate-300 font-semibold select-none cursor-pointer">Set as default vehicle</label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddVeh(false); setEditingVeh(null); }}
                    className="bg-slate-850 hover:bg-slate-800 text-xs px-4 py-2 border border-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            )}

            {userVehicles.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/20 border border-slate-850 rounded-2xl text-slate-400">
                <Car className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                <p>No registered vehicles found. Add your car to enable faster bookings!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userVehicles.map(v => (
                  <div key={v.id} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl relative flex gap-4">
                    <div className="p-3 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white text-base font-mono">{v.licensePlate}</span>
                        {v.isDefault && (
                          <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">{v.brand}</p>
                      <p className="text-[10px] text-slate-400 capitalize mt-1">Size: {v.size} | Notes: {v.notes || 'None'}</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleEditClick(v)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors border border-slate-700"
                        title="Edit Vehicle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteVehicle(v.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg transition-colors border border-slate-700"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Booking History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">My Booking History</h2>

            <div className="p-4 bg-orange-500/5 text-orange-400 border border-orange-500/10 rounded-xl text-xs leading-relaxed flex gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Policy:</strong> VinaWash operates on a 100% manual bank transfer policy. Bookings cannot be cancelled by the customer once submitted to prevent slot-hoarding.
              </span>
            </div>

            {userBookings.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/20 border border-slate-850 rounded-2xl text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                <p>No bookings made yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userBookings.map(b => {
                  const vehicle = vehicles.find(v => v.id === b.vehicleId);

                  return (
                    <div key={b.id} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-slate-300">Ref: <span className="font-mono text-white text-base">{b.bookingRef || b.id}</span></span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${b.status === 'COMPLETED' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                              b.status === 'CHECKED_IN' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                                b.status === 'CONFIRMED' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                                  b.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' :
                                    'bg-red-500/15 text-red-400 border border-red-500/25'
                            }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">
                          Branch: {b.branchId === 'D1' ? 'District 1' : 'District 7'} | Date: {b.bookingDate} at {b.bookingTime}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Vehicle Plate: <span className="font-mono font-bold text-slate-300">{vehicle?.licensePlate || 'Unknown'}</span> | Model: {vehicle?.brand || 'Unknown'}
                        </p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <span className="font-extrabold text-orange-500 text-lg block">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Points: +{b.pointsEarned} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Loyalty & Points */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Loyalty Engine</h2>

            {/* Progress bar */}
            {nextTierName && (
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-end flex-wrap gap-2">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Tier Progress</span>
                    <h3 className="text-lg font-bold text-white mt-1">Path to {nextTierName} Tier</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Currently completed: <strong className="text-white">{completedWashes}</strong> washes
                  </span>
                </div>

                {/* Visual Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                    <span>{currentTier}</span>
                    <span>{nextTierName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-950/20 border border-blue-900/30 text-blue-400 text-xs rounded-xl flex gap-2.5 leading-relaxed mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    To upgrade, you need <strong>{washesNeeded} more washes</strong> OR <strong>{spendNeeded.toLocaleString('vi-VN')} VND spend</strong> within the rolling 12 months.
                  </span>
                </div>
              </div>
            )}

            {/* FR-007: Expiring Points Warning Banner */}
            {expiringPointsTotal > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-400">⚠ Points Expiring Soon!</p>
                  <p className="text-amber-300/80 text-xs mt-1 leading-relaxed">
                    <strong className="text-amber-300">{expiringPointsTotal} points</strong> from {expiringLogs.length} transaction(s) will expire within the next 30 days.
                    Use them to redeem vouchers before they're lost!
                  </p>
                </div>
              </div>
            )}

            {/* Point Transaction Logs */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Points Transaction History</h3>
              {userLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No point transactions logged.</p>
              ) : (
                <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-850">
                  {userLogs.map(l => (
                    <div key={l.id} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{l.description}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">{new Date(l.createdAt).toLocaleString()}</span>
                      </div>
                      <span className={`font-extrabold text-sm ${l.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {l.points >= 0 ? `+${l.points}` : l.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Redeem Rewards */}
        {activeTab === 'redeem' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">My Points Balance:</span>
                <span className="font-extrabold text-2xl text-orange-400">{currentUser.accumulatedPoints} points</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs max-w-sm leading-relaxed text-slate-300">
                <Sparkles className="w-4 h-4 text-orange-400 inline mr-1" />
                <strong>New User Policy:</strong> First wash bills &gt;300k earn a free 50k voucher, &gt;500k earn a 100k voucher!
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Rewards Exchange Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reward 1 */}
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase block">500 Points</span>
                    <h4 className="font-extrabold text-base text-white">50k Discount Voucher</h4>
                    <p className="text-[11px] text-slate-400">Subtracts 50,000 VND from your total bill.</p>
                  </div>
                  <button
                    disabled={currentUser.accumulatedPoints < 500}
                    onClick={() => handleRedeem('discount_50k', 500, '50,000 VND Discount Voucher')}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl text-xs transition-all shadow"
                  >
                    Redeem Reward
                  </button>
                </div>

                {/* Reward 2 */}
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase block">1,800 Points</span>
                    <h4 className="font-extrabold text-base text-white">Free Basic Wash</h4>
                    <p className="text-[11px] text-slate-400">Gets a completely free VW Basic Wash combo.</p>
                  </div>
                  <button
                    disabled={currentUser.accumulatedPoints < 1800}
                    onClick={() => handleRedeem('free_basic', 1800, 'Free Basic Wash Voucher')}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl text-xs transition-all shadow"
                  >
                    Redeem Reward
                  </button>
                </div>

                {/* Reward 3 */}
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase block">2,800 Points</span>
                    <h4 className="font-extrabold text-base text-white">Free Detail Wash</h4>
                    <p className="text-[11px] text-slate-400">Gets a completely free deep-cleaning Detail Wash.</p>
                  </div>
                  <button
                    disabled={currentUser.accumulatedPoints < 2800}
                    onClick={() => handleRedeem('free_detail', 2800, 'Free Detail Wash Voucher')}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl text-xs transition-all shadow"
                  >
                    Redeem Reward
                  </button>
                </div>
              </div>
            </div>

            {/* Redeemed Vouchers */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">My Redeemed Vouchers</h3>
              {userVouchers.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No vouchers redeemed or earned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userVouchers.map(v => (
                    <div key={v.id} className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{v.title}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">Code: {v.id}</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${v.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          v.status === 'used' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-slate-850 text-slate-500 border border-slate-800'
                        }`}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: System Promotions */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">Active System Campaigns</h2>
            <div className="grid grid-cols-1 gap-4">
              {promotions.filter(p => p.description).map(p => (
                <div key={p.id} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex gap-4">
                  <div className="p-3 bg-slate-850 text-orange-400 rounded-xl border border-slate-800 flex items-center justify-center shrink-0">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-white text-base">{p.title}</h4>
                      <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold px-2 rounded-full">
                        Target: {p.targetTier || 'All'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{p.description}</p>
                    {p.description && (
                      <span className="text-xs text-green-400 font-bold block mt-2">Discount value: -{p.description}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
