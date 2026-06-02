// Feed learning — derives smart suggestions from recent food_logs.
// All pure functions, no network calls, no side effects.
// Called client-side so parents get instant personalised suggestions
// without an extra API round-trip.
//
// Data contract: food_logs.notes stores metadata like "90ml · side:L · …"
// The ml value is always the first token when present.

/**
 * Extract ml amount from a notes string.
 * Returns null if not found.
 *
 * Examples:
 *   "90ml"           → 90
 *   "90ml · side:L"  → 90
 *   "side:L"         → null
 *   null / undefined → null
 */
export function parseMlFromNotes(notes) {
  if (!notes) return null;
  const m = notes.match(/\b(\d+)ml\b/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Compute smart suggestions for a given feed type from recent logs.
 *
 * Returns:
 *   {
 *     lastAmount:    number | null,  // ml of the single most-recent log
 *     avgAmount:     number | null,  // rounded mean of up to last 10
 *     suggestedAmount: number | null, // what to pre-select in the picker
 *     recentUnique:  number[],        // up to 4 unique recent amounts (for quick-tap chips)
 *   }
 *
 * suggestedAmount = avg of last 5 if available, otherwise last, otherwise null.
 * Clamped to 0–500 ml.
 */
export function computeBottleSuggestions(recentLogs, feedType = 'bottle') {
  const amounts = recentLogs
    .filter(l => l.food_type === feedType && l.notes)
    .map(l => parseMlFromNotes(l.notes))
    .filter(v => v !== null && v > 0 && v <= 500)
    .slice(0, 20); // cap at 20 most-recent

  if (amounts.length === 0) {
    return { lastAmount: null, avgAmount: null, suggestedAmount: null, recentUnique: [] };
  }

  const lastAmount = amounts[0];
  const window5    = amounts.slice(0, 5);
  const avgAmount  = Math.round(window5.reduce((s, v) => s + v, 0) / window5.length);

  // Unique values in recency order (deduped), max 4
  const seen = new Set();
  const recentUnique = [];
  for (const v of amounts) {
    if (!seen.has(v)) { seen.add(v); recentUnique.push(v); }
    if (recentUnique.length >= 4) break;
  }

  // Suggested = avg of last 5 (rounds to nearest 5ml for visual clarity)
  const suggestedAmount = Math.round(avgAmount / 5) * 5 || avgAmount;

  return { lastAmount, avgAmount, suggestedAmount, recentUnique };
}

/**
 * Compute breastfeeding statistics from recent logs.
 *
 * Returns:
 *   {
 *     dominantSide:  'L' | 'R' | null,  // side used most often
 *     startWith:     'L' | 'R',          // which side to offer first (opposite of dominant)
 *     avgDurationMin: number | null,
 *   }
 */
export function computeBreastSuggestions(recentLogs) {
  const breastFeeds = recentLogs.filter(l => l.food_type === 'breast');

  // Parse side from notes (e.g. "side:L", "side:R")
  const sides = breastFeeds
    .map(l => {
      if (!l.notes) return null;
      const m = l.notes.match(/side:([LRlr])\b/);
      return m ? m[1].toUpperCase() : null;
    })
    .filter(Boolean)
    .slice(0, 20);

  let dominantSide = null;
  if (sides.length >= 4) {
    const lCount = sides.filter(s => s === 'L').length;
    const rCount = sides.filter(s => s === 'R').length;
    if (lCount / sides.length > 0.65) dominantSide = 'L';
    if (rCount / sides.length > 0.65) dominantSide = 'R';
  }

  // Avg duration
  const durations = breastFeeds
    .map(l => l.duration_minutes)
    .filter(v => v != null && v > 0 && v <= 120)
    .slice(0, 10);
  const avgDurationMin = durations.length
    ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
    : null;

  // startWith = opposite of dominant (to balance supply), or L if no preference
  const startWith = dominantSide === 'L' ? 'R' : dominantSide === 'R' ? 'L' : 'L';

  return { dominantSide, startWith, avgDurationMin };
}

/**
 * Compute sleep statistics.
 *
 * Returns:
 *   {
 *     avgHours:   number | null,
 *     lastHours:  number | null,
 *     suggested:  number | null,  // rounded average for the quick picker
 *   }
 */
export function computeSleepSuggestions(recentSleepLogs) {
  const hours = recentSleepLogs
    .map(l => l.hours_slept)
    .filter(v => v != null && v > 0 && v <= 24)
    .slice(0, 7);

  if (hours.length === 0) {
    return { avgHours: null, lastHours: null, suggested: null };
  }

  const lastHours = hours[0];
  const avgHours  = Math.round((hours.reduce((s, v) => s + v, 0) / hours.length) * 2) / 2; // nearest 0.5h
  const suggested = avgHours;

  return { avgHours, lastHours, suggested };
}

/**
 * Wake-window suggestion: typical wake-window length based on age in days.
 * Source: Huckleberry / Taking Cara Babies averages.
 */
export function wakeWindowMinutes(ageInDays) {
  if (ageInDays == null) return null;
  if (ageInDays < 56)   return 45;   // 0–8 weeks
  if (ageInDays < 112)  return 75;   // 8–16 weeks
  if (ageInDays < 168)  return 100;  // 4–6 months
  if (ageInDays < 270)  return 150;  // 6–9 months
  if (ageInDays < 365)  return 180;  // 9–12 months
  if (ageInDays < 548)  return 240;  // 12–18 months
  return 360;                         // 18m+
}
