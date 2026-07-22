import { create } from 'zustand';
import type { VehicleSizeCode } from '@/lib/api/vehicles';

export const WIZARD_STEPS = [
  'Chi nhánh',
  'Dịch vụ',
  'Ngày giờ',
  'Chọn xe',
  'Xem lại',
  'Xác nhận',
] as const;

export const LAST_STEP = WIZARD_STEPS.length - 1;

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

  goTo: (step: number) => void;
  next: () => void;
  prev: () => void;
  setBranch: (id: string) => void;
  toggleService: (code: string) => void;
  setSlot: (dayKey: string, slotTime: string) => void;
  /** Switch which day's slots are being viewed, clearing any slot picked for
   *  a different day so a stale pair can't silently carry through to Review. */
  viewDay: (dayKey: string) => void;
  selectSavedVehicle: (id: string | undefined) => void;
  setManualVehicle: (patch: Partial<ManualVehicle>) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  branchId: undefined,
  serviceCodes: [] as string[],
  dayKey: undefined,
  slotTime: undefined,
  savedVehicleId: undefined,
  manualVehicle: { size: 'SEDAN' as VehicleSizeCode, plate: '', brand: '' },
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initial,

  goTo: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, LAST_STEP) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setBranch: (branchId) => set({ branchId }),
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
  reset: () => set({ ...initial }),
}));
