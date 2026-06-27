import React, { createContext, useContext, useState } from 'react';

export type VehicleSize = 'hatchback' | 'sedan' | 'suv' | 'pickup';

export interface BookingData {
  currentStep: number;
  vehicleSize: VehicleSize;
  branchId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedServices: string[];
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    licensePlate: string;
    vehicleModel: string;
    createAccount?: boolean;
    password?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: 'Member' | 'Silver' | 'Gold' | 'Platinum';
  accumulatedPoints: number;
  totalSpend: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  size: VehicleSize;
  notes?: string;
  isDefault: boolean;
}

export interface Booking {
  id: string;
  bookingRef?: string;
  customerId: string;
  vehicleId: string;
  branchId: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  pointsEarned: number;
  appliedVoucherId?: string;
  createdAt: string;
}

export interface RedeemedVoucher {
  id: string;
  customerId: string;
  type: 'discount_50k' | 'free_basic' | 'free_detail';
  title: string;
  pointsCost: number;
  status: 'active' | 'used';
  code: string;
}

export interface TransactionLog {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'tier_change';
  points: number;
  description: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  targetTier: string;
  createdAt: string;
}

interface BookingContextType {
  state: BookingData;
  updateState: (updates: Partial<BookingData> | ((prev: BookingData) => Partial<BookingData>)) => void;
  resetBooking: () => void;
  multiplier: number;
  
  // Minimal Role switching properties
  activeRole: 'customer' | 'washing_counter' | 'admin';
  setActiveRole: (role: 'customer' | 'washing_counter' | 'admin') => void;
  userSession: { name: string; phone: string; role: 'customer' | 'washing_counter' | 'admin' } | null;
  setUserSession: (session: { name: string; phone: string; role: 'customer' | 'washing_counter' | 'admin' } | null) => void;
  
  // Mock Database State & Methods
  currentUser: Customer | null;
  setCurrentUser: (user: Customer | null) => void;
  customers: Customer[];
  vehicles: Vehicle[];
  bookings: Booking[];
  vouchers: RedeemedVoucher[];
  transactionLogs: TransactionLog[];
  promotions: Promotion[];

  loginCustomer: (phone: string) => Customer | null;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  redeemVoucher: (customerId: string, type: 'discount_50k' | 'free_basic' | 'free_detail', points: number, title: string) => boolean;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  addPromotion: (title: string, description: string, discountOrMultiplier: number, targetTier: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialData: BookingData = {
  currentStep: 1,
  vehicleSize: 'sedan',
  branchId: null,
  selectedDate: null,
  selectedTime: null,
  selectedServices: [],
  customerInfo: { name: '', phone: '', email: '', licensePlate: '', vehicleModel: '' }
};

const multipliers: Record<VehicleSize, number> = {
  hatchback: 0.9,
  sedan: 1.0,
  suv: 1.2,
  pickup: 1.4
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingData>(initialData);
  const [activeRole, setActiveRole] = useState<'customer' | 'washing_counter' | 'admin'>('customer');
  const [userSession, setUserSession] = useState<{ name: string; phone: string; role: 'customer' | 'washing_counter' | 'admin' } | null>(null);
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);

  // Mock Databases
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'c1',
      name: 'John Doe',
      phone: '0901234567',
      email: 'john@example.com',
      tier: 'Gold',
      accumulatedPoints: 2450,
      totalSpend: 7500000,
      createdAt: '2026-01-10T12:00:00Z'
    },
    {
      id: 'c2',
      name: 'Bob Marvin',
      phone: '0912345678',
      email: 'bob@example.com',
      tier: 'Silver',
      accumulatedPoints: 800,
      totalSpend: 2800000,
      createdAt: '2026-02-15T12:00:00Z'
    },
    {
      id: 'c3',
      name: 'Alice Cooper',
      phone: '0907654321',
      email: 'alice@example.com',
      tier: 'Platinum',
      accumulatedPoints: 4200,
      totalSpend: 16500000,
      createdAt: '2026-03-10T12:00:00Z'
    }
  ]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'v1', customerId: 'c1', licensePlate: '51G-123.45', brand: 'Toyota Camry', size: 'sedan', isDefault: true },
    { id: 'v2', customerId: 'c2', licensePlate: '51A-999.99', brand: 'Honda CRV', size: 'suv', isDefault: true },
    { id: 'v3', customerId: 'c3', licensePlate: '30F-888.88', brand: 'Porsche 911', size: 'hatchback', isDefault: true }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'b1',
      bookingRef: 'AWP-1001',
      customerId: 'c1',
      vehicleId: 'v1',
      branchId: 'D1',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '09:00',
      totalPrice: 280000,
      status: 'COMPLETED',
      pointsEarned: 280,
      createdAt: new Date().toISOString()
    },
    {
      id: 'b2',
      bookingRef: 'AWP-1002',
      customerId: 'c2',
      vehicleId: 'v2',
      branchId: 'D7',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '11:00',
      totalPrice: 180000,
      status: 'CONFIRMED',
      pointsEarned: 180,
      createdAt: new Date().toISOString()
    },
    {
      id: 'b3',
      bookingRef: 'AWP-1003',
      customerId: 'c3',
      vehicleId: 'v3',
      branchId: 'D1',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '14:30',
      totalPrice: 640000,
      status: 'PENDING',
      pointsEarned: 640,
      createdAt: new Date().toISOString()
    }
  ]);

  const [vouchers, setVouchers] = useState<RedeemedVoucher[]>([
    { id: 'vo1', customerId: 'c1', type: 'discount_50k', title: '50k Discount Voucher', pointsCost: 500, status: 'active', code: 'DISC50K-1' }
  ]);

  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([
    { id: 't1', customerId: 'c1', type: 'earn', points: 280, description: 'Earned from booking AWP-1001', createdAt: new Date().toISOString() },
    { id: 't2', customerId: 'c1', type: 'tier_change', points: 0, description: 'Upgraded to Gold Tier', createdAt: new Date().toISOString() }
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: 'p1', title: 'Summer Shine Extra Points', description: 'Get x1.2 points on all washes this summer', multiplier: 1.2, targetTier: 'All', createdAt: new Date().toISOString() }
  ]);

  // Methods
  const loginCustomer = (phone: string) => {
    const found = customers.find(c => c.phone === phone);
    return found || null;
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...vehicle,
      id: `v_${Date.now()}`
    };
    setVehicles(prev => [...prev, newVeh]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const redeemVoucher = (customerId: string, type: 'discount_50k' | 'free_basic' | 'free_detail', points: number, title: string) => {
    let success = false;
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId && c.accumulatedPoints >= points) {
        success = true;
        return {
          ...c,
          accumulatedPoints: c.accumulatedPoints - points
        };
      }
      return c;
    }));

    if (success) {
      const newVoucher: RedeemedVoucher = {
        id: `vo_${Date.now()}`,
        customerId,
        type,
        title,
        pointsCost: points,
        status: 'active',
        code: `VC-${Math.floor(1000 + Math.random() * 9000)}`
      };
      setVouchers(prev => [...prev, newVoucher]);

      const newLog: TransactionLog = {
        id: `t_${Date.now()}`,
        customerId,
        type: 'redeem',
        points: -points,
        description: `Redeemed ${title}`,
        createdAt: new Date().toISOString()
      };
      setTransactionLogs(prev => [...prev, newLog]);
    }
    return success;
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        const oldStatus = b.status;
        const updated = { ...b, status };

        if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
          const customer = customers.find(c => c.id === b.customerId);
          if (customer) {
            const pointsEarned = b.pointsEarned;
            const newSpend = customer.totalSpend + b.totalPrice;
            const newPoints = customer.accumulatedPoints + pointsEarned;

            // Determine new tier
            let newTier = customer.tier;
            const washesCount = prev.filter(bk => bk.customerId === customer.id && (bk.status === 'COMPLETED' || bk.id === id)).length;
            
            if (washesCount >= 30 || newSpend >= 15000000) {
              newTier = 'Platinum';
            } else if (washesCount >= 15 || newSpend >= 6000000) {
              newTier = 'Gold';
            } else if (washesCount >= 5 || newSpend >= 2000000) {
              newTier = 'Silver';
            }

            // Update Customer
            setCustomers(custs => custs.map(c => c.id === customer.id ? {
              ...c,
              totalSpend: newSpend,
              accumulatedPoints: newPoints,
              tier: newTier
            } : c));

            // Create log for earning
            const earnLog: TransactionLog = {
              id: `t_earn_${Date.now()}`,
              customerId: customer.id,
              type: 'earn',
              points: pointsEarned,
              description: `Earned from booking ${b.bookingRef || b.id}`,
              createdAt: new Date().toISOString()
            };
            
            const logsToAdd = [earnLog];
            if (newTier !== customer.tier) {
              logsToAdd.push({
                id: `t_tier_${Date.now()}`,
                customerId: customer.id,
                type: 'tier_change',
                points: 0,
                description: `Upgraded to ${newTier} Tier`,
                createdAt: new Date().toISOString()
              });
            }

            setTransactionLogs(logs => [...logs, ...logsToAdd]);
          }
        }
        return updated;
      }
      return b;
    }));
  };

  const addPromotion = (title: string, description: string, discountOrMultiplier: number, targetTier: string) => {
    const newPromo: Promotion = {
      id: `p_${Date.now()}`,
      title,
      description,
      multiplier: discountOrMultiplier > 10 ? 1 + discountOrMultiplier / 100 : discountOrMultiplier,
      targetTier,
      createdAt: new Date().toISOString()
    };
    setPromotions(prev => [...prev, newPromo]);
  };

  const updateState = (updates: Partial<BookingData> | ((prev: BookingData) => Partial<BookingData>)) => {
    setState(prev => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
  };

  const resetBooking = () => setState(initialData);
  const multiplier = multipliers[state.vehicleSize];

  return (
    <BookingContext.Provider value={{ 
      state, 
      updateState, 
      resetBooking, 
      multiplier,
      activeRole,
      setActiveRole,
      userSession,
      setUserSession,
      currentUser,
      setCurrentUser,
      customers,
      vehicles,
      bookings,
      vouchers,
      transactionLogs,
      promotions,
      loginCustomer,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      redeemVoucher,
      updateBookingStatus,
      addPromotion
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
