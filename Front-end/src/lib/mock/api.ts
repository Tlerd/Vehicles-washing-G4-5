import { useQuery } from '@tanstack/react-query';
import type { Branch, Combo, Service, ServiceCategory, Slot, SlotStatus } from '@/types';
import { daySlotTimes } from '@/lib/slot';
import { formatDateTime, formatDayKey } from '@/lib/datetime';
import { BRANCHES, CATEGORIES, COMBOS, SERVICES } from './catalog';

/** Simulate network latency so loading states are exercised in dev. */
function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useBranches() {
  return useQuery<Branch[]>({ queryKey: ['branches'], queryFn: () => delay(BRANCHES) });
}

export function useCategories() {
  return useQuery<ServiceCategory[]>({ queryKey: ['categories'], queryFn: () => delay(CATEGORIES) });
}

export function useCatalog() {
  return useQuery<{ services: Service[]; combos: Combo[] }>({
    queryKey: ['catalog'],
    queryFn: () => delay({ services: SERVICES, combos: COMBOS }),
  });
}

/** Deterministic pseudo-random status so the grid is stable across renders. */
function hashStatus(seed: string): { status: SlotStatus; remaining: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  const r = h % 10;
  if (r === 0) return { status: 'full', remaining: 0 };
  if (r === 1 || r === 2) return { status: 'held', remaining: 1 };
  return { status: 'free', remaining: 2 + (h % 3) };
}

/** Availability for one branch/day. Slots earlier than the branch min-advance
 *  window (bug #8) are full. */
function generateSlots(branch: Branch, dayKey: string): Slot[] {
  const times = daySlotTimes(branch.openTime, branch.closeTime, branch.slotDurationMin);
  const earliest = Date.now() + branch.minAdvanceMin * 60_000;
  return times.map((hm) => {
    const iso = formatDateTime(dayKey, hm);
    if (new Date(iso).getTime() < earliest) return { time: iso, status: 'full', remaining: 0 };
    const { status, remaining } = hashStatus(`${branch.id}-${iso}`);
    return { time: iso, status, remaining };
  });
}

export function useSlots(branch: Branch | undefined, dayKey: string | undefined) {
  return useQuery<Slot[]>({
    queryKey: ['slots', branch?.id, dayKey],
    enabled: Boolean(branch && dayKey),
    queryFn: () => (branch && dayKey ? delay(generateSlots(branch, dayKey)) : delay<Slot[]>([])),
  });
}

/** Availability for a set of days keyed by yyyy-MM-dd (D-15 week grid). */
export function useWeekSlots(branch: Branch | undefined, days: Date[]) {
  const keys = days.map(formatDayKey);
  return useQuery<Record<string, Slot[]>>({
    queryKey: ['week-slots', branch?.id, keys.join(',')],
    enabled: Boolean(branch && days.length),
    queryFn: () => {
      if (!branch) return delay<Record<string, Slot[]>>({});
      const map: Record<string, Slot[]> = {};
      for (const key of keys) map[key] = generateSlots(branch, key);
      return delay(map);
    },
  });
}
