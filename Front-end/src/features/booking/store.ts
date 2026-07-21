import { create } from 'zustand';
<<<<<<< Updated upstream
import type { ContactInfo, VehicleInfo, VehicleSize } from '@/types';
=======
import type { VehicleSizeCode } from '@/lib/api/vehicles';
>>>>>>> Stashed changes

export const WIZARD_STEPS = [
  'Chi nhánh',
  'Dịch vụ',
  'Ngày giờ',
  'Chọn xe',
  'Xem lại',
  'Xác nhận',
] as const;

export const LAST_STEP = WIZARD_STEPS.length - 1;

<<<<<<< Updated upstream
interface BookingState {
  step: number;
  branchId?: string;
  serviceIds: string[];
  comboIds: string[];
  dayKey?: string;
  slotTime?: string;
  vehicle: VehicleInfo;
  contact: ContactInfo;
=======
export interface ManualVehicle {
  size: VehicleSizeCode;
  plate: string;
  brand: string;
}

interface BookingState {
  step: number;
  branchId?: string;
  serviceCodes: string[];
  dayKey?: string;
  slotTime?: string;
  /** A saved Garage vehicle id; undefined means the manual-entry fields below
   *  are used instead (CreateBookingRequest accepts vehicleId XOR the
   *  licensePlate/brand/vehicleSize triple). */
  savedVehicleId?: string;
  manualVehicle: ManualVehicle;
>>>>>>> Stashed changes

  goTo: (step: number) => void;
  next: () => void;
  prev: () => void;
  setBranch: (id: string) => void;
<<<<<<< Updated upstream
  toggleService: (id: string) => void;
  toggleCombo: (id: string) => void;
  setSlot: (dayKey: string, slotTime: string) => void;
  setSize: (size: VehicleSize) => void;
  setVehicle: (patch: Partial<VehicleInfo>) => void;
  setContact: (patch: Partial<ContactInfo>) => void;
=======
  toggleService: (code: string) => void;
  setSlot: (dayKey: string, slotTime: string) => void;
  /** Switch which day's slots are being viewed, clearing any slot picked for
   *  a different day so a stale pair can't silently carry through to Review. */
  viewDay: (dayKey: string) => void;
  selectSavedVehicle: (id: string | undefined) => void;
  setManualVehicle: (patch: Partial<ManualVehicle>) => void;
>>>>>>> Stashed changes
  reset: () => void;
}

const initial = {
  step: 0,
  branchId: undefined,
<<<<<<< Updated upstream
  serviceIds: [] as string[],
  comboIds: [] as string[],
  dayKey: undefined,
  slotTime: undefined,
  vehicle: { size: 'S' as VehicleSize, plate: '', brand: '', model: '' },
  contact: { name: '', phone: '' },
=======
  serviceCodes: [] as string[],
  dayKey: undefined,
  slotTime: undefined,
  savedVehicleId: undefined,
  manualVehicle: { size: 'SEDAN' as VehicleSizeCode, plate: '', brand: '' },
>>>>>>> Stashed changes
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initial,

  goTo: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, LAST_STEP) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setBranch: (branchId) => set({ branchId }),
<<<<<<< Updated upstream
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
=======
  toggleService: (code) =>
    set((s) => ({
      serviceCodes: s.serviceCodes.includes(code)
        ? s.serviceCodes.filter((x) => x !== code)
        : [...s.serviceCodes, code],
    })),
  setSlot: (dayKey, slotTime) => set({ dayKey, slotTime }),
  viewDay: (dayKey) =>
    set((s) => (s.dayKey === dayKey ? s : { dayKey, slotTime: undefined })),
  selectSavedVehicle: (id) => set({ savedVehicleId: id }),
  setManualVehicle: (patch) => set((s) => ({ manualVehicle: { ...s.manualVehicle, ...patch } })),
>>>>>>> Stashed changes
  reset: () => set({ ...initial }),
}));
