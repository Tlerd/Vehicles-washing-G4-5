import type {
  BookingRecord,
  CustomerProfile,
  PointEntry,
  Tier,
  VehicleRecord,
  VoucherOffer,
} from '@/types';

/** Tier ladder (lỗi #15: configurable tiers; D-26: deposit waiver for
 *  Gold/Platinum). Points thresholds are illustrative Phase-2 mock data. */
export const TIERS: Tier[] = [
  { id: 'member', name: 'Member', minPoints: 0, depositWaived: false },
  { id: 'silver', name: 'Silver', minPoints: 200, depositWaived: false },
  { id: 'gold', name: 'Gold', minPoints: 600, depositWaived: true },
  { id: 'platinum', name: 'Platinum', minPoints: 1500, depositWaived: true },
];

export function tierForPoints(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.minPoints) ?? TIERS[0];
}

export function nextTier(points: number): Tier | null {
  const current = tierForPoints(points);
  const idx = TIERS.findIndex((t) => t.id === current.id);
  return TIERS[idx + 1] ?? null;
}

/** In-memory store, mutated by the mock mutation hooks below. Module-level
 *  so it persists across component remounts within one browser session. */
export const store = {
  profile: {
    id: 'cus-1',
    name: 'Nguyễn Văn A',
    phone: '+84912345678',
    tierId: 'silver',
    points: 350,
  } as CustomerProfile,

  vehicles: [
    { id: 'veh-1', plate: '51K-123.45', model: 'Toyota Vios', size: 'S' },
    { id: 'veh-2', plate: '59A-678.90', model: 'Honda CR-V', size: 'M' },
  ] as VehicleRecord[],

  bookings: [
    {
      id: 'bk-1001',
      branchName: 'Chi nhánh Thủ Đức',
      serviceNames: ['Detail Wash'],
      dayKey: '2026-07-22',
      time: '09:30',
      total: 280_000,
      status: 'CONFIRMED',
    },
    {
      id: 'bk-1000',
      branchName: 'Chi nhánh Quận 7',
      serviceNames: ['Ultimate Wash', 'Vệ sinh nội thất chuyên sâu'],
      dayKey: '2026-07-10',
      time: '14:00',
      total: 1_090_000,
      status: 'COMPLETED',
      feedbackRating: 5,
      feedbackComment: 'Rất hài lòng, xe sạch bóng.',
    },
    {
      id: 'bk-0999',
      branchName: 'Chi nhánh Thủ Đức',
      serviceNames: ['Rửa xe ngoài'],
      dayKey: '2026-06-28',
      time: '08:00',
      total: 90_000,
      status: 'COMPLETED',
    },
  ] as BookingRecord[],

  pointHistory: [
    { id: 'pt-3', dayKey: '2026-07-10', points: 109, reason: 'Hoàn thành đơn bk-1000' },
    { id: 'pt-2', dayKey: '2026-06-28', points: 9, reason: 'Hoàn thành đơn bk-0999' },
    { id: 'pt-1', dayKey: '2026-06-01', points: 232, reason: 'Điểm khởi tạo thành viên' },
  ] as PointEntry[],

  vouchers: [
    {
      id: 'vc-50k',
      name: 'Giảm 50.000đ',
      description: 'Áp dụng cho mọi hóa đơn từ 200.000đ.',
      costPoints: 100,
      minTierId: 'member',
    },
    {
      id: 'vc-free-wash',
      name: 'Miễn phí Rửa xe ngoài',
      description: 'Quy đổi 1 lượt Rửa xe ngoài miễn phí.',
      costPoints: 250,
      minTierId: 'silver',
    },
    {
      id: 'vc-150k',
      name: 'Giảm 150.000đ',
      description: 'Áp dụng cho gói combo từ 500.000đ.',
      costPoints: 400,
      minTierId: 'gold',
    },
  ] as VoucherOffer[],
};
