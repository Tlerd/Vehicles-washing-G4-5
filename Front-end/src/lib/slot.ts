/** Slot math (D-14). Occupied = work time + bay cleanup buffer, rounded up to
 *  the branch slot granularity (15 min). */
export function occupiedSlots(
  durationMin: number,
  bufferMin: number,
  slotDurationMin: number,
): number {
  return Math.ceil((durationMin + bufferMin) / slotDurationMin);
}

/** "HH:mm" -> minutes since midnight. */
export function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** All slot start times (HH:mm) for one day/bay between open and close. */
export function daySlotTimes(
  openTime: string,
  closeTime: string,
  slotDurationMin: number,
): string[] {
  const start = parseHm(openTime);
  const end = parseHm(closeTime);
  const out: string[] = [];
  for (let t = start; t < end; t += slotDurationMin) {
    out.push(minutesToHm(t));
  }
  return out;
}
