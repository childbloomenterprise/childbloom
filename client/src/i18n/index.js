import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';

// Phase-1 retention features keep their strings in isolated files so the large
// base locale files stay untouched. English is the source of truth; every other
// language inherits the English keys (placeholder) and is overridden as the
// per-language retention.<lang>.json files get translated (currently TODO).
import retEn from './locales/retention.en.json';
import retHi from './locales/retention.hi.json';
import retTa from './locales/retention.ta.json';
import retTe from './locales/retention.te.json';
import retMl from './locales/retention.ml.json';
import retPa from './locales/retention.pa.json';

// Emergency/SOS strings live in their own namespace too (same inherit-English
// pattern). English is the source of truth; other languages inherit it until
// the per-language emergency.<lang>.json files are translated (TODO).
import emEn from './locales/emergency.en.json';
import emHi from './locales/emergency.hi.json';
import emTa from './locales/emergency.ta.json';
import emTe from './locales/emergency.te.json';
import emMl from './locales/emergency.ml.json';
import emPa from './locales/emergency.pa.json';

// Bloom Garden / logging-rewards strings (gamified logging loop) — same
// isolated-bundle pattern. All 6 languages shipped translated.
import gdEn from './locales/garden.en.json';
import gdHi from './locales/garden.hi.json';
import gdTa from './locales/garden.ta.json';
import gdTe from './locales/garden.te.json';
import gdMl from './locales/garden.ml.json';
import gdPa from './locales/garden.pa.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en, ...retEn, ...emEn, ...gdEn } },
      hi: { translation: { ...hi, ...retEn, ...retHi, ...emEn, ...emHi, ...gdEn, ...gdHi } },
      ta: { translation: { ...ta, ...retEn, ...retTa, ...emEn, ...emTa, ...gdEn, ...gdTa } },
      te: { translation: { ...te, ...retEn, ...retTe, ...emEn, ...emTe, ...gdEn, ...gdTe } },
      ml: { translation: { ...ml, ...retEn, ...retMl, ...emEn, ...emMl, ...gdEn, ...gdMl } },
      pa: { translation: { ...pa, ...retEn, ...retPa, ...emEn, ...emPa, ...gdEn, ...gdPa } },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'childbloom-lang',
    },
  });

export default i18n;
