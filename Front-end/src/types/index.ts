export type CarSize = 'hatchback' | 'sedan' | 'suv' | 'pickup';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type CustomerTier = 'Member' | 'Silver' | 'Gold' | 'Platinum';
export type UserRole = 'ADMIN' | 'COUNTER' | 'CUSTOMER';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: CustomerTier;
  accumulatedPoints: number;
  totalSpend: number;
  createdAt: string;
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
  bookingAdvanceLimit: number;
  requiredPoints: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  isAvailable?: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  bookingRef?: string;
  customerId: string;
  vehicleId: string;
  services: string[];
  carSize: CarSize;
  branchId: string;
  date: string;
  time: string;
  totalPrice: number;
  status: BookingStatus;
  pointsEarned: number;
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
  bookingId?: string;
  appliedVoucherId?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  bgGradient: string;
  icon: string;
  isActive?: boolean;
  targetTier?: CustomerTier | 'ALL';
  createdAt?: string;
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'tier_change';
  points: number;
  description: string;
  createdAt: string;
}

export interface RedeemedVoucher {
  id: string;
  customerId: string;
  type: 'discount_50k' | 'free_basic' | 'free_detail';
  title: string;
  pointsCost: number;
  code: string;
  isUsed: boolean;
  createdAt: string;
}

export interface VoucherCatalogItem {
  id: string;
  type: 'discount_50k' | 'free_basic' | 'free_detail';
  title: string;
  pointsCost: number;
  description: string;
}
