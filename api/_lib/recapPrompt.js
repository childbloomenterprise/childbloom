// Weekly Bloom Recap prompt builder — one warm, shareable highlight line per
// child per week, grounded in the week's REAL aggregate stats. Mirrors
// dailyBriefPrompt.js: strict JSON out, defensive parse, 6 languages.

const LANGUAGE_INSTRUCTION = {
  en: 'Write every field in English.',
  ml: 'Write every field in natural, warm Malayalam (മലയാളം) — the way a Kerala mother speaks at home.',
  ta: 'Write every field in warm, natural Tamil (தமிழ்).',
  hi: 'Write every field in simple, warm Hindi (हिंदी).',
  te: 'Write every field in warm, natural Telugu (తెలుగు).',
  pa: 'Write every field in warm, natural Punjabi (ਪੰਜਾਬੀ).',
};

/**
 * @param {object} stats - { feeds, sleepHours, sleepSessions, diapers, daysLogged, streakEnd, growthLogged }
 * @param {object} child - { name }
 * @param {string} language - en|hi|ml|ta|te|pa
 */
export function buildRecapPrompt(stats, child, language = 'en') {
  const langLine = LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION.en;
  const name = child?.name || 'your little one';

  return `You are Dr. Bloom writing the one-line highlight of a "Weekly Bloom Recap" card for ${name}'s parent. The card already shows the raw numbers — your line is the warm human summary the parent will want to screenshot and share.

${langLine}

THE WEEK'S REAL NUMBERS for ${name}:
- Feeds logged: ${stats.feeds ?? 0}
- Sleep logged: ${stats.sleepHours ?? 0} hours across ${stats.sleepSessions ?? 0} sessions
- Diaper/care logs: ${stats.diapers ?? 0}
- Days with at least one log: ${stats.daysLogged ?? 0} of 7
- Logging streak at week's end: ${stats.streakEnd ?? 0} days
- Growth measurement added: ${stats.growthLogged ? 'yes' : 'no'}

WRITE
- "highlight": ONE sentence (≤ 22 words) celebrating the parent's care this week, naming ${name}. Specific to the numbers above — never generic praise. If the week was thin (0–1 days logged), be gently encouraging about next week instead, never guilt-tripping.

RULES
- Warm, calm, second person. No medical claims, no advice, no emojis, no markdown.

OUTPUT FORMAT
Return ONLY a single minified JSON object and nothing else — no preamble, no code fences:
{"highlight":"..."}`;
}

/**
 * Defensive JSON parse — same contract as parseBriefJson. Returns the
 * highlight string or null so the caller can skip a bad row.
 */
export function parseRecapJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    text = text.slice(start, end + 1);
  }
  try {
    const obj = JSON.parse(text);
    const highlight = typeof obj?.highlight === 'string' ? obj.highlight.trim() : '';
    if (!highlight) return null;
    return highlight.slice(0, 300);
  } catch {
    return null;
  }
}
