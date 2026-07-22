<<<<<<< HEAD
/** Domain types — align these shapes with approved backend DTOs. */
=======
/** Domain types — aligned to the planned BE DTOs. Phase 1 is served by mock
 *  data (src/lib/mock); swapping to the real API keeps these shapes. */
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e

export type VehicleSize = 'S' | 'M' | 'L';

export type BookingMode = 'slot' | 'flexible';
export type BayType = 'QUICK' | 'DETAIL' | 'UNIVERSAL';
export type CategoryKind = 'SINGLE' | 'COMBO';

export interface Branch {
  id: string;
  name: string;
  address: string;
  openTime: string; // "07:00"
  closeTime: string; // "18:00"
  slotDurationMin: number; // 15 (D-14)
  minAdvanceMin: number; // 90 slot / 60 flexible (bug #8)
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string; // lucide icon name
  kind: CategoryKind;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  /** base price for size S; other sizes derive via BR-001 when isSizeDependent */
  basePrice: number;
  isSizeDependent: boolean; // D-03
  durationMin: number;
  bufferMin: number; // D-14
  requiredBayType: BayType; // D-17
  bookingMode: BookingMode;
  description?: string;
}

export interface Combo {
  id: string;
  categoryId: string;
  name: string;
  price: number; // flat, size-independent for Phase 1
  includes: string[]; // service ids (combo_includes → duplicate warning)
  durationMin: number;
  bufferMin: number;
  requiredBayType: BayType;
  description?: string;
}

export type SlotStatus = 'free' | 'held' | 'full' | 'picked';

export interface Slot {
  time: string; // ISO datetime in branch local time
  status: SlotStatus;
  remaining: number; // bays still free
}

export interface CartItem {
  refId: string; // service id or combo id
  kind: CategoryKind;
  name: string;
  unitPrice: number; // resolved for the chosen size
}

export interface VehicleInfo {
  size: VehicleSize;
  plate: string;
  brand: string;
  model: string;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

/* ---------------------------------------------------------------------- *
<<<<<<< HEAD
 * Customer domain types. Add UI consumers only when an approved backend
 * contract is available.
=======
 * Customer domain (Phase 2). Served by src/lib/mock/customer.ts until the
 * real API lands; TanStack Query hooks in customerApi.ts are the only files
 * that change when it does.
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
 * ---------------------------------------------------------------------- */

export type TierId = 'member' | 'silver' | 'gold' | 'platinum';

export interface Tier {
  id: TierId;
  name: string;
  minPoints: number;
  depositWaived: boolean; // D-26
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  tierId: TierId;
  points: number;
}

export interface VehicleRecord extends VehicleInfo {
  id: string;
}

export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CHANGE_REQUESTED';

export interface BookingRecord {
  id: string;
  branchName: string;
  serviceNames: string[];
  dayKey: string; // yyyy-MM-dd
  time: string; // "HH:mm"
  total: number;
  status: BookingStatus;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface PointEntry {
  id: string;
  dayKey: string;
  points: number; // positive = earned, negative = redeemed
  reason: string;
}

export interface VoucherOffer {
  id: string;
  name: string;
  description: string;
  costPoints: number;
  minTierId: TierId; // lỗi #16: voucher gated by tier (vouchers.min_tier_id)
}
