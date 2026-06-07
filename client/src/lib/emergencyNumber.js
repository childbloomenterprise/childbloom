// Region-aware emergency phone number — fully offline (no IP geolocation).
// 112 is the GSM/EU universal emergency number and a safe global fallback.
//
// Detection order: region subtag of the browser locale (navigator.language)
// → IANA timezone heuristic → fallback 112. Every input is injectable so the
// logic is deterministically unit-tested.

const REGION_NUMBERS = {
  US: '911', CA: '911', MX: '911',
  GB: '999', IE: '112',
  AU: '000', NZ: '111',
  JP: '119',
  // EU + most of the world resolve to 112 via numberForRegion's default.
};

// Minimal IANA timezone → ISO region map. Prefix entries (ending in '/') match
// any zone in that area; the resulting region still flows through
// numberForRegion so e.g. Canada (America/Toronto → US → 911) gets it right.
const TZ_REGION = {
  'Asia/Kolkata': 'IN',
  'Asia/Tokyo': 'JP',
  'Europe/London': 'GB',
  'Pacific/Auckland': 'NZ',
  'America/': 'US',
  'Australia/': 'AU',
};

export function regionFromLocale(locale) {
  if (!locale || typeof locale !== 'string') return null;
  const m = locale.match(/[-_]([A-Za-z]{2})\b/);
  return m ? m[1].toUpperCase() : null;
}

export function regionFromTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return null;
  if (TZ_REGION[tz]) return TZ_REGION[tz];
  const prefix = Object.keys(TZ_REGION).find((k) => k.endsWith('/') && tz.startsWith(k));
  return prefix ? TZ_REGION[prefix] : null;
}

export function numberForRegion(region) {
  return (region && REGION_NUMBERS[region]) || '112';
}

// Resolves the local emergency number. Returns { number, region }.
// `language` and `timeZone` can be passed in for tests; otherwise read from the
// environment.
export function getEmergencyNumber({ language, timeZone } = {}) {
  const lang = language
    ?? (typeof navigator !== 'undefined' ? navigator.language : null);
  let region = regionFromLocale(lang);

  if (!region) {
    const tz = timeZone
      ?? (typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : null);
    region = regionFromTimeZone(tz);
  }

  return { number: numberForRegion(region), region: region || null };
}
