export type CarSize = 'hatchback' | 'sedan' | 'suv' | 'pickup';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type CustomerTier = 'Member' | 'Silver' | 'Gold' | 'Platinum';
export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: CustomerTier;
  accumulatedPoints: number;
  totalSpend: number;
  totalWashes?: number;
  createdAt: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  size: CarSize;
  notes?: string;
  isDefault: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // minutes
  category: 'combo' | 'single';
  group?: string;
  icon: string;
  includes?: string[];
  suitableFor?: string;
  benefits?: string[];
  isPremium?: boolean;
}

export interface LoyaltyTierDef {
  name: CustomerTier;
  multiplier: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  status?: 'ACTIVE' | 'COMING_SOON';
}

export interface TimeSlot {
  time: string;
  endTime: string;
  durationMinutes: number;
  available: boolean;
}

export interface Booking {
  id: string;
  bookingRef?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  vehicleId: string;
  licensePlate?: string;
  vehicleBrand?: string;
  services: string[];
  carSize: CarSize;
  branchId: string;
  date: string;
  time: string;
  endTime?: string;
  durationMinutes?: number;
  totalPrice: number;
  status: BookingStatus;
  pointsEarned: number;
  appliedVoucherId?: string;
  createdAt: string;
}

export interface BookingDraft {
  currentStep: number;
  carSize: CarSize;
  selectedServices: string[];
  branchId: string | null;
  date: string | null;
  time: string | null;
  vehicleId: string | null;
  vehiclePlate: string;
  vehicleBrand: string;
  endTime?: string;
  durationMinutes?: number;
  bookingId?: string;
  bookingRef?: string;
  vietQrUrl?: string;
  confirmedTotalPrice?: number;
  voucherId?: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  bgGradient: string;
  icon: string;
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'tier_change';
  points: number;
  description: string;
  createdAt: string;
}
