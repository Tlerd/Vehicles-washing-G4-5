import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

/** The business operates in GMT+7 (BR-027). "Today" must always be computed
 *  in Vietnam's timezone, not the browser's OS-configured local timezone, so
 *  results are consistent regardless of where the app is used. */
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function todayStart(): Date {
  return startOfDay(toZonedTime(new Date(), VIETNAM_TIME_ZONE));
}

/** Next `count` days starting today, for the week-grid header. */
export function upcomingDays(count: number): Date[] {
  const base = todayStart();
  return Array.from({ length: count }, (_, i) => addDays(base, i));
}

export function formatDayShort(d: Date): string {
  return format(d, 'EEE dd/MM');
}

export function formatDayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function formatDateTime(dayKey: string, hm: string): string {
  return `${dayKey}T${hm}:00`;
}

/** Locale-aware "yyyy-MM-dd" -> "Thu 22/07/2026" (or Vietnamese weekday when
 *  lang is 'vi'). Pass i18n.language from useTranslation() at the call site —
 *  this module has no React/i18next dependency of its own. */
export function formatBookingDayKey(dayKey: string, lang: string): string {
  try {
    return format(parseISO(dayKey), 'EEE dd/MM/yyyy', { locale: lang === 'vi' ? vi : enUS });
  } catch {
    return dayKey;
  }
}
