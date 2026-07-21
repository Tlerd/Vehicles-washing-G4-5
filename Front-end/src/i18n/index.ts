import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonVi from './locales/vi/common.json';
import commonEn from './locales/en/common.json';
import landingVi from './locales/vi/landing.json';
import landingEn from './locales/en/landing.json';
import bookingVi from './locales/vi/booking.json';
import bookingEn from './locales/en/booking.json';
import authVi from './locales/vi/auth.json';
import authEn from './locales/en/auth.json';
import dashboardVi from './locales/vi/dashboard.json';
import dashboardEn from './locales/en/dashboard.json';
import garageVi from './locales/vi/garage.json';
import garageEn from './locales/en/garage.json';
import pointsVi from './locales/vi/points.json';
import pointsEn from './locales/en/points.json';
import vouchersVi from './locales/vi/vouchers.json';
import vouchersEn from './locales/en/vouchers.json';
import historyVi from './locales/vi/history.json';
import historyEn from './locales/en/history.json';
import feedbackVi from './locales/vi/feedback.json';
import feedbackEn from './locales/en/feedback.json';

export const SUPPORTED_LANGS = ['vi', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'aw-lang';

function readInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'vi' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'vi';
}

void i18n.use(initReactI18next).init({
  lng: readInitialLang(),
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: [
    'common',
    'landing',
    'booking',
    'auth',
    'dashboard',
    'garage',
    'points',
    'vouchers',
    'history',
    'feedback',
  ],
  resources: {
    vi: {
      common: commonVi,
      landing: landingVi,
      booking: bookingVi,
      auth: authVi,
      dashboard: dashboardVi,
      garage: garageVi,
      points: pointsVi,
      vouchers: vouchersVi,
      history: historyVi,
      feedback: feedbackVi,
    },
    en: {
      common: commonEn,
      landing: landingEn,
      booking: bookingEn,
      auth: authEn,
      dashboard: dashboardEn,
      garage: garageEn,
      points: pointsEn,
      vouchers: vouchersEn,
      history: historyEn,
      feedback: feedbackEn,
    },
  },
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
});
document.documentElement.lang = i18n.language;

export default i18n;
