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

// Public landing / marketing copy (the "Built for the real moments" section).
// Same isolated-bundle pattern. English is the source of truth; the other five
// languages are `_todo` placeholders that inherit the full English `landing`
// object via the merge below until translated (TODO). Placeholders deliberately
// omit the `landing` key so the shallow object-spread can't drop sibling keys.
import ldEn from './locales/landing.en.json';
import ldHi from './locales/landing.hi.json';
import ldTa from './locales/landing.ta.json';
import ldTe from './locales/landing.te.json';
import ldMl from './locales/landing.ml.json';
import ldPa from './locales/landing.pa.json';

// Doctor-care strings (parent-facing "From your doctor" surface — Stage 1 of the
// Dr. Bloom <-> ChildBloom unification). Same isolated-bundle pattern: English is
// the source of truth; the other five files are `_todo` placeholders that omit the
// `doctorcare` key so the shallow spread keeps the full English object until
// translated (TODO).
import dcEn from './locales/doctorcare.en.json';
import dcHi from './locales/doctorcare.hi.json';
import dcTa from './locales/doctorcare.ta.json';
import dcTe from './locales/doctorcare.te.json';
import dcMl from './locales/doctorcare.ml.json';
import dcPa from './locales/doctorcare.pa.json';

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
      en: { translation: { ...en, ...retEn, ...emEn, ...gdEn, ...ldEn, ...dcEn } },
      hi: { translation: { ...hi, ...retEn, ...retHi, ...emEn, ...emHi, ...gdEn, ...gdHi, ...ldEn, ...ldHi, ...dcEn, ...dcHi } },
      ta: { translation: { ...ta, ...retEn, ...retTa, ...emEn, ...emTa, ...gdEn, ...gdTa, ...ldEn, ...ldTa, ...dcEn, ...dcTa } },
      te: { translation: { ...te, ...retEn, ...retTe, ...emEn, ...emTe, ...gdEn, ...gdTe, ...ldEn, ...ldTe, ...dcEn, ...dcTe } },
      ml: { translation: { ...ml, ...retEn, ...retMl, ...emEn, ...emMl, ...gdEn, ...gdMl, ...ldEn, ...ldMl, ...dcEn, ...dcMl } },
      pa: { translation: { ...pa, ...retEn, ...retPa, ...emEn, ...emPa, ...gdEn, ...gdPa, ...ldEn, ...ldPa, ...dcEn, ...dcPa } },
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
