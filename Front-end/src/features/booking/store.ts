import { create } from 'zustand';
import type { ContactInfo, VehicleInfo, VehicleSize } from '@/types';

export const WIZARD_STEPS = [
  'Chi nhánh',
  'Dịch vụ',
  'Ngày giờ',
  'Chọn xe',
  'Xem lại',
  'Xác nhận',
] as const;

export const LAST_STEP = WIZARD_STEPS.length - 1;

interface BookingState {
  step: number;
  branchId?: string;
  serviceIds: string[];
  comboIds: string[];
  dayKey?: string;
  slotTime?: string;
  vehicle: VehicleInfo;
  contact: ContactInfo;

  goTo: (step: number) => void;
  next: () => void;
  prev: () => void;
  setBranch: (id: string) => void;
  toggleService: (id: string) => void;
  toggleCombo: (id: string) => void;
  setSlot: (dayKey: string, slotTime: string) => void;
  setSize: (size: VehicleSize) => void;
  setVehicle: (patch: Partial<VehicleInfo>) => void;
  setContact: (patch: Partial<ContactInfo>) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  branchId: undefined,
  serviceIds: [] as string[],
  comboIds: [] as string[],
  dayKey: undefined,
  slotTime: undefined,
  vehicle: { size: 'S' as VehicleSize, plate: '', brand: '', model: '' },
  contact: { name: '', phone: '' },
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initial,

  goTo: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, LAST_STEP) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setBranch: (branchId) => set({ branchId }),
  toggleService: (id) =>
    set((s) => ({
      serviceIds: s.serviceIds.includes(id)
        ? s.serviceIds.filter((x) => x !== id)
        : [...s.serviceIds, id],
    })),
  toggleCombo: (id) =>
    set((s) => ({
      comboIds: s.comboIds.includes(id)
        ? s.comboIds.filter((x) => x !== id)
        : [...s.comboIds, id],
    })),
  setSlot: (dayKey, slotTime) => set({ dayKey, slotTime }),
  setSize: (size) => set((s) => ({ vehicle: { ...s.vehicle, size } })),
  setVehicle: (patch) => set((s) => ({ vehicle: { ...s.vehicle, ...patch } })),
  setContact: (patch) => set((s) => ({ contact: { ...s.contact, ...patch } })),
  reset: () => set({ ...initial }),
}));
