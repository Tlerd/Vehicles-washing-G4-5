// Display copy for these items lives in i18n under the 'landing' namespace,
// keyed by each item's `id` (see src/i18n/locales/{vi,en}/landing.json).
// This file only holds stable ids and non-translatable data (numbers, icon
// names, hrefs, image-free layout hints).

export const NAV_LINKS = [
  { id: 'benefits', href: '#benefits' },
  { id: 'packages', href: '#packages' },
  { id: 'process', href: '#process' },
  { id: 'locations', href: '#locations' },
  { id: 'reviews', href: '#reviews' },
];

export const BENEFITS = [
  { id: 'realtime', icon: 'calendar' },
  { id: 'pricing', icon: 'dollar' },
  { id: 'turnaround', icon: 'clock' },
  { id: 'loyalty', icon: 'award' },
];

export const PACKAGES = [
  { id: 'essential', price: 120000, popular: false },
  { id: 'premium', price: 280000, popular: true },
  { id: 'signature', price: 520000, popular: false },
];

export const PROCESS_STEPS = [
  { id: 'branch', step: '01' },
  { id: 'package', step: '02' },
  { id: 'time', step: '03' },
  { id: 'confirm', step: '04' },
];

export const LOCATIONS = [
  { id: 'thu-duc', hours: '07:00–21:00', services: 3 },
  { id: 'district-7', hours: '07:00–21:00', services: 3 },
];

export const REVIEWS = [
  { id: 'minh-tran', initials: 'MT' },
  { id: 'linh-nguyen', initials: 'LN' },
  { id: 'hoang-pham', initials: 'HP' },
];

export const FAQS = [
  { id: 'duration' },
  { id: 'reschedule' },
  { id: 'suv' },
  { id: 'lateArrival' },
  { id: 'payment' },
];
