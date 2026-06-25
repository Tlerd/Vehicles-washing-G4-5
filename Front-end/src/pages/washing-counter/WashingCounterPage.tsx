import React, { useState } from 'react';
import { useBooking, Booking } from '../../context/BookingContext';
import { Play, Check, X, ShieldAlert, Car, Clock, RefreshCw, UserCheck } from 'lucide-react';

export const WashingCounterPage: React.FC = () => {
  const { bookings, customers, vehicles, updateBookingStatus } = useBooking();
  const [filterBranch, setFilterBranch] = useState<'ALL' | 'D1' | 'D7'>('ALL');

  // Filter bookings based on active branch selection
  const activeBookings = bookings.filter(b => {
    const matchBranch = filterBranch === 'ALL' || b.branchId === filterBranch;
    return matchBranch;
  });

  const pendingBookings = activeBookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = activeBookings.filter(b => b.status === 'CONFIRMED');
  const checkedInBookings = activeBookings.filter(b => b.status === 'CHECKED_IN');
  const completedBookings = activeBookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 text-slate-100 flex-1 flex flex-col gap-6">
      {/* Header and Branch Filter */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Washing Counter Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Manage check-in, approvals, and point redemptions in real-time.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setFilterBranch('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterBranch === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Branches
          </button>
          <button 
            onClick={() => setFilterBranch('D1')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterBranch === 'D1' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            District 1
          </button>
          <button 
            onClick={() => setFilterBranch('D7')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filterBranch === 'D7' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            District 7
          </button>
        </div>
      </div>

      {/* Kanban-style Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        
        {/* Column 1: Approval Queue (PENDING) */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-ping" />
              Approvals ({pendingBookings.length})
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">Pending</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {pendingBookings.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No pending appointments.</p>
            ) : (
              pendingBookings.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const vehicle = vehicles.find(v => v.id === b.vehicleId);

                return (
                  <div key={b.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-200 block text-sm">{customer?.name || 'Guest'}</span>
                        <span className="text-slate-400 font-mono">{customer?.phone}</span>
                      </div>
                      <span className="font-mono bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-300">{b.bookingRef}</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg space-y-1 text-[11px] text-slate-400">
                      <div>Branch: <strong className="text-slate-200">{b.branchId}</strong></div>
                      <div>Vehicle: <strong className="text-slate-200 font-mono">{vehicle?.licensePlate} ({vehicle?.size})</strong></div>
                      <div>Time: <strong className="text-slate-200">{b.bookingDate} {b.bookingTime}</strong></div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-850">
                      <span className="font-extrabold text-orange-500 text-sm">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'CANCELLED')}
                          className="p-1.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 rounded-lg transition-all"
                          title="Reject Appointment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'CONFIRMED')}
                          className="p-1.5 bg-green-950/20 border border-green-900/30 text-green-400 hover:bg-green-950/40 rounded-lg transition-all flex items-center gap-1 font-bold text-[10px] px-2.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Expected Queue (CONFIRMED) */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              Expected Today ({confirmedBookings.length})
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">Confirmed</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {confirmedBookings.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No arriving vehicles expected.</p>
            ) : (
              confirmedBookings.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const vehicle = vehicles.find(v => v.id === b.vehicleId);

                return (
                  <div key={b.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-200 block text-sm">{customer?.name || 'Guest'}</span>
                        <span className="text-slate-400 font-mono">{customer?.phone}</span>
                      </div>
                      <span className="font-mono bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-300">{b.bookingRef}</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg space-y-1 text-[11px] text-slate-400">
                      <div>Branch: <strong className="text-slate-200">{b.branchId}</strong></div>
                      <div>Vehicle: <strong className="text-slate-200 font-mono">{vehicle?.licensePlate} ({vehicle?.size})</strong></div>
                      <div>Time: <strong className="text-slate-200">{b.bookingDate} {b.bookingTime}</strong></div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-850">
                      <span className="font-extrabold text-orange-500 text-sm">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                      <button 
                        onClick={() => updateBookingStatus(b.id, 'CHECKED_IN')}
                        className="bg-orange-500 hover:bg-orange-450 text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px]"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Check-in (LPR)
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Washing Queue (CHECKED_IN) */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              Currently Washing ({checkedInBookings.length})
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">Checked-in</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {checkedInBookings.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No vehicles in wash bay.</p>
            ) : (
              checkedInBookings.map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const vehicle = vehicles.find(v => v.id === b.vehicleId);
                
                // Estimate points to earn based on tier
                const tierMultipliers = { Member: 1.0, Silver: 1.1, Gold: 1.2, Platinum: 1.3 };
                const cTier = customer?.tier || 'Member';
                const mult = tierMultipliers[cTier] || 1.0;
                const pointsToEarn = Math.floor((b.totalPrice / 1000) * mult);

                return (
                  <div key={b.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-200 block text-sm">{customer?.name || 'Guest'}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                          cTier === 'Platinum' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          cTier === 'Gold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          cTier === 'Silver' ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {cTier} ({mult}x)
                        </span>
                      </div>
                      <span className="font-mono bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-300">{b.bookingRef}</span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg space-y-1 text-[11px] text-slate-400">
                      <div>Vehicle: <strong className="text-slate-200 font-mono">{vehicle?.licensePlate} ({vehicle?.size})</strong></div>
                      <div>Est. Points: <strong className="text-green-400">+{pointsToEarn} pts</strong></div>
                      {b.appliedVoucherId && (
                        <div className="text-[10px] text-green-400 border-t border-slate-800 pt-1.5 mt-1.5 font-bold">
                          [Voucher Applied] Code: {b.appliedVoucherId}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-850">
                      <span className="font-extrabold text-orange-500 text-sm">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                      <button 
                        onClick={() => updateBookingStatus(b.id, 'COMPLETED')}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px]"
                      >
                        <Check className="w-3.5 h-3.5" /> Checkout & Tích điểm
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
