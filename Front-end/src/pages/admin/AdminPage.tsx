import React, { useState, useEffect, useRef } from 'react';
import { useBooking, Customer, Booking, RedeemedVoucher, TransactionLog, Promotion } from '../../context/BookingContext';
import { 
  Users, Calendar, BarChart3, Search, Filter, ArrowUpDown, Eye, X, Edit, Plus, BrainCircuit, CreditCard 
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { 
    customers, bookings, vehicles, transactionLogs, promotions,
    updateBookingStatus, addPromotion 
  } = useBooking();

  const [activeTab, setActiveTab] = useState<'customers' | 'bookings' | 'stats'>('customers');

  // Customer Tab States
  const [custSearch, setCustSearch] = useState('');
  const [custFilterTier, setCustFilterTier] = useState<string>('ALL');
  const [custSortBy, setCustSortBy] = useState<'date' | 'spend' | 'points'>('date');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Edit Customer Profile
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Booking Tab States
  const [bkStatusFilter, setBkStatusFilter] = useState<string>('ALL');
  const [bkSortBy, setBkSortBy] = useState<'time' | 'price'>('time');
  const [visibleBookingsCount, setVisibleBookingsCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stats Tab States
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'month' | 'year'>('day');

  // Campaign Creator States
  const [campGoal, setCampGoal] = useState('');
  const [campTier, setCampTier] = useState<'All' | 'Member' | 'Silver' | 'Gold' | 'Platinum'>('All');
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campDiscount, setCampDiscount] = useState(10);

  // --- Filtering Customers ---
  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                        c.phone.includes(custSearch) ||
                        vehicles.some(v => v.customerId === c.id && v.licensePlate.toLowerCase().includes(custSearch.toLowerCase()));
    const matchTier = custFilterTier === 'ALL' || c.tier === custFilterTier;
    return matchSearch && matchTier;
  }).sort((a, b) => {
    if (custSortBy === 'spend') return b.totalSpend - a.totalSpend;
    if (custSortBy === 'points') return b.accumulatedPoints - a.accumulatedPoints;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // --- Filtering Bookings (with infinite scroll mock) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredBookings = bookings.filter(b => {
    const isToday = b.bookingDate === todayStr;
    const matchStatus = bkStatusFilter === 'ALL' || b.status === bkStatusFilter;
    return matchStatus; // You can toggle to default to today or let them filter
  }).sort((a, b) => {
    if (bkSortBy === 'price') return b.totalPrice - a.totalPrice;
    return b.bookingTime.localeCompare(a.bookingTime);
  });

  // Infinite scroll simulator
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      // Near bottom, load more
      if (visibleBookingsCount < filteredBookings.length) {
        setVisibleBookingsCount(prev => prev + 5);
      }
    }
  };

  // --- Campaign Creator Logic ---
  const generateCampaignDetails = () => {
    if (!campGoal) return;
    // Mocking an AI generation of promotion text based on Goal and Tier
    setCampTitle(`AI Promo: Boost ${campTier} Tier`);
    setCampDesc(`Special campaign to ${campGoal.toLowerCase()} targeting our valued ${campTier} tier members.`);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle || !campDesc) return;
    addPromotion(campTitle, campDesc, campDiscount, campTier);
    alert('AI Promotion Campaign created and published successfully!');
    setCampGoal('');
    setCampTitle('');
    setCampDesc('');
  };

  // Open Details View Modal
  const handleViewCustomer = (c: Customer) => {
    setSelectedCust(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email || '');
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    selectedCust.name = editName;
    selectedCust.phone = editPhone;
    selectedCust.email = editEmail;
    alert('Customer profile updated successfully!');
    setSelectedCust(null);
  };

  // --- Statistics Calculations ---
  const getStats = () => {
    const completedBk = bookings.filter(b => b.status === 'COMPLETED');
    let totalRevenue = 0;
    let counts = 0;
    
    if (statsPeriod === 'day') {
      const today = new Date().toISOString().split('T')[0];
      const todayBk = completedBk.filter(b => b.bookingDate === today);
      totalRevenue = todayBk.reduce((sum, b) => sum + b.totalPrice, 0);
      counts = todayBk.length;
    } else if (statsPeriod === 'month') {
      const currentMonth = new Date().toISOString().slice(0, 7); // yyyy-MM
      const monthBk = completedBk.filter(b => b.bookingDate.startsWith(currentMonth));
      totalRevenue = monthBk.reduce((sum, b) => sum + b.totalPrice, 0);
      counts = monthBk.length;
    } else {
      const currentYear = new Date().getFullYear().toString();
      const yearBk = completedBk.filter(b => b.bookingDate.startsWith(currentYear));
      totalRevenue = yearBk.reduce((sum, b) => sum + b.totalPrice, 0);
      counts = yearBk.length;
    }
    
    return { revenue: totalRevenue, washes: counts };
  };

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8 text-slate-100 flex-1 flex flex-col gap-6">
      
      {/* Top Banner and Navigation Tabs */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Administration Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Configure promotions, audit users and monitor transaction logs.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'customers' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Customer Directory
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bookings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Bookings Audit
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stats' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Statistics & Campaigns
          </button>
        </div>
      </div>

      {/* TAB 1: Customer Directory */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text"
                value={custSearch}
                onChange={e => setCustSearch(e.target.value)}
                placeholder="Search by name, phone, plate..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2 shrink-0">
              {/* Tier Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={custFilterTier}
                  onChange={e => setCustFilterTier(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="Member">Member</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={custSortBy}
                  onChange={e => setCustSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
                >
                  <option value="date">Register Date</option>
                  <option value="spend">Total Spend</option>
                  <option value="points">Points Balance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map(c => {
              const countVeh = vehicles.filter(v => v.customerId === c.id).length;
              const countBk = bookings.filter(b => b.customerId === c.id && b.status === 'COMPLETED').length;

              return (
                <div key={c.id} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base leading-tight">{c.name}</h3>
                    <span className="text-slate-400 font-mono text-xs">{c.phone}</span>
                    
                    <div className="flex flex-wrap gap-2 items-center mt-2.5">
                      <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded ${
                        c.tier === 'Platinum' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        c.tier === 'Gold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        c.tier === 'Silver' ? 'bg-slate-455/10 text-slate-300 border border-slate-400/20' :
                        'bg-slate-850 text-slate-400 border border-slate-800'
                      }`}>
                        {c.tier}
                      </span>
                      <span className="text-[10px] text-slate-500">{countVeh} cars • {countBk} washes</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="font-bold text-orange-400 text-sm block">{c.accumulatedPoints} pts</span>
                    <button 
                      onClick={() => handleViewCustomer(c)}
                      className="p-1.5 bg-slate-850 hover:bg-slate-800 text-xs font-semibold rounded-lg border border-slate-800 text-blue-400 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Bookings Audit (with Infinite Scroll) */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Audit Bookings List
            </h2>

            <div className="flex gap-2">
              <select
                value={bkStatusFilter}
                onChange={e => { setBkStatusFilter(e.target.value); setVisibleBookingsCount(10); }}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={bkSortBy}
                onChange={e => setBkSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
              >
                <option value="time">Sort by Time</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>

          {/* Bookings scroll container */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[550px] overflow-y-auto space-y-3 bg-slate-900/20 border border-slate-850 p-4 rounded-2xl scrollbar-thin"
          >
            {filteredBookings.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-12">No bookings found matching filters.</p>
            ) : (
              filteredBookings.slice(0, visibleBookingsCount).map(b => {
                const customer = customers.find(c => c.id === b.customerId);
                const vehicle = vehicles.find(v => v.id === b.vehicleId);

                return (
                  <div key={b.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-200 block text-sm">{customer?.name || 'Guest'}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                          b.status === 'CHECKED_IN' ? 'bg-blue-500/10 text-blue-400' :
                          b.status === 'CONFIRMED' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {b.status}
                        </span>
                        <span className="font-mono text-slate-500 text-[10px]">{b.bookingRef}</span>
                      </div>
                      <p className="text-slate-400">
                        Date: <strong className="text-slate-300">{b.bookingDate} {b.bookingTime}</strong> | Branch: <strong className="text-slate-300">{b.branchId}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Vehicle: <strong className="text-slate-400 font-mono">{vehicle?.licensePlate} ({vehicle?.size})</strong>
                      </p>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <span className="font-extrabold text-orange-500 text-sm block">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                      {b.status === 'PENDING' && (
                        <div className="flex gap-1 mt-1.5">
                          <button onClick={() => updateBookingStatus(b.id, 'CANCELLED')} className="px-2 py-1 bg-red-950/30 text-red-400 rounded text-[10px] font-bold">Reject</button>
                          <button onClick={() => updateBookingStatus(b.id, 'CONFIRMED')} className="px-2 py-1 bg-green-950/30 text-green-400 rounded text-[10px] font-bold">Approve</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {visibleBookingsCount < filteredBookings.length && (
              <div className="text-center pt-3">
                <button 
                  onClick={() => setVisibleBookingsCount(prev => prev + 5)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-1.5 rounded-lg border border-slate-700 text-[11px]"
                >
                  Load More Bookings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Statistics & AI Campaigns */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          
          {/* Revenue Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Metric Box */}
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-36">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Income Breakdown</span>
                <div className="flex gap-1.5 mt-2.5">
                  <button onClick={() => setStatsPeriod('day')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${statsPeriod === 'day' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Day</button>
                  <button onClick={() => setStatsPeriod('month')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${statsPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Month</button>
                  <button onClick={() => setStatsPeriod('year')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${statsPeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Year</button>
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white block">{stats.revenue.toLocaleString('vi-VN')} VND</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Aggregated from {stats.washes} completed washes</span>
              </div>
            </div>

            {/* AI Promotion Campaign Creator */}
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl md:col-span-2 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit className="text-blue-400 w-5 h-5" /> AI Campaign Builder
              </h3>
              
              <form onSubmit={handleCreateCampaign} className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marketing Goal</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={campGoal}
                        onChange={e => setCampGoal(e.target.value)}
                        placeholder="e.g. Increase repeat visits of silver members"
                        className="flex-1 bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded-lg text-slate-200 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={generateCampaignDetails}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs px-3 rounded-lg border border-slate-700 shrink-0 font-bold"
                      >
                        Draft AI
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Tier</label>
                    <select
                      value={campTier}
                      onChange={e => setCampTier(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded-lg text-slate-200 focus:outline-none"
                    >
                      <option value="All">All Tiers</option>
                      <option value="Member">Member</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campaign Title</label>
                    <input 
                      type="text"
                      required
                      value={campTitle}
                      onChange={e => setCampTitle(e.target.value)}
                      placeholder="Title details"
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount (%)</label>
                    <input 
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={campDiscount}
                      onChange={e => setCampDiscount(parseInt(e.target.value) || 0)}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <input 
                    type="text"
                    required
                    value={campDesc}
                    onChange={e => setCampDesc(e.target.value)}
                    placeholder="Short summary details to display to customers"
                    className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all"
                >
                  Create & Launch Promotion Campaign
                </button>
              </form>
            </div>

          </div>

          {/* Audit Point transaction logs */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Points Transaction Audit Logs</h3>
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-850 max-h-[300px] overflow-y-auto">
              {transactionLogs.map(l => {
                const customer = customers.find(c => c.id === l.customerId);
                
                return (
                  <div key={l.id} className="p-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{l.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Customer: <strong className="text-slate-300">{customer?.name || 'Guest'} ({customer?.phone})</strong>
                      </p>
                      <span className="text-[9px] text-slate-500 block mt-1">{new Date(l.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`font-extrabold text-sm ${l.pointsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {l.pointsChange >= 0 ? `+${l.pointsChange}` : l.pointsChange} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Customer Registry Detail Modal */}
      {selectedCust && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button 
              onClick={() => setSelectedCust(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="text-blue-500 w-5 h-5" /> Customer Profile details
            </h3>

            {/* Profile edit form */}
            <form onSubmit={handleUpdateCustomer} className="space-y-4 border-b border-slate-800 pb-5 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded text-slate-200 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                  <input type="tel" required value={editPhone} onChange={e => setEditPhone(e.target.value)} className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded text-slate-200 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs rounded text-slate-200 focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedCust(null)} className="bg-slate-850 text-xs px-3 py-1.5 rounded border border-slate-800">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded shadow">Update Profile</button>
              </div>
            </form>

            {/* Vehicles, history list */}
            <div className="space-y-4">
              {/* Vehicles */}
              <div>
                <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Registered Vehicles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {vehicles.filter(v => v.customerId === selectedCust.id).map(v => (
                    <div key={v.id} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-300">
                      <div>Plate: <strong className="text-white">{v.licensePlate}</strong></div>
                      <div>Model: {v.brand} | Size: {v.size}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking/Wash history */}
              <div>
                <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Wash History</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {bookings.filter(b => b.customerId === selectedCust.id).map(b => (
                    <div key={b.id} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 text-[10px] flex justify-between items-center text-slate-400">
                      <div>
                        Date: <strong className="text-slate-300">{b.bookingDate} {b.bookingTime}</strong> | Status: <strong className="text-orange-400">{b.status}</strong>
                      </div>
                      <span className="font-bold text-white">{b.totalPrice.toLocaleString('vi-VN')} VND</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
