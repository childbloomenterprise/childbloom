/**
 * ChildBloom — Daily Bloom Brief prompt builder.
 *
 * Reuses the SAME Child Profile Folder + age-precision engine as Dr. Bloom
 * (drBloomPrompt.js) so the brief is grounded in this child's real data and the
 * global evidence-based guidance base is consistent across the app. Output is STRICT JSON
 * so the cron can store structured fields without parsing prose.
 *
 * Contract: the model must return ONLY a JSON object of the shape
 *   { "title": string, "expect_this_week": string, "tip": string, "reassurance": string }
 * Each value is warm, 2nd person, uses the child's name, ≤ 2 sentences, and
 * never diagnoses or prescribes.
 */

import { buildChildProfileFolder, getAgePrecision } from './drBloomPrompt.js';

const LANGUAGE_INSTRUCTION = {
  en: 'Write every field in English.',
  ml: 'Write every field in natural, warm Malayalam (മലയാളം) — the way a Kerala mother speaks at home.',
  ta: 'Write every field in warm, natural Tamil (தமிழ்).',
  hi: 'Write every field in simple, warm Hindi (हिंदी).',
  te: 'Write every field in warm, natural Telugu (తెలుగు).',
  pa: 'Write every field in warm, natural Punjabi (ਪੰਜਾਬੀ).',
};

/**
 * Build the system prompt for one child's daily brief.
 *
 * @param {object} data - same shape buildChildProfileFolder expects:
 *   { child, growthRecords, foodLogs, healthRecords, weeklyUpdate, vaccinations }
 * @param {string} language - one of en|hi|ml|ta|te|pa
 * @returns {string} system prompt
 */
export function buildDailyBriefPrompt(data, language = 'en') {
  const { child } = data;
  const profileFolder = buildChildProfileFolder(data);
  const ageInfo = getAgePrecision(child.date_of_birth, child.due_date, child.is_pregnant);
  const langLine = LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION.en;
  const name = child.name || 'your little one';

  return `You are Dr. Bloom writing today's "Daily Bloom Brief" — one short, warm, personalised card about ${name} for today. The parent has NOT asked a question and may not log anything today. This card is the single reason they open ChildBloom this morning, so it must feel written for this family alone.

${langLine}

${profileFolder}

WHAT TO WRITE
Return FOUR short fields about ${name}, who is ${ageInfo.displayAge} (developmental stage: ${ageInfo.developmentalStage}):
- "title": a warm one-line greeting naming ${name} and their exact age today (e.g. weeks for newborns, months for infants). ≤ 12 words.
- "expect_this_week": one concrete, age-appropriate thing ${name} may start doing or going through around now, framed as a gentle heads-up. ≤ 2 sentences.
- "tip": one practical action the parent can try today (e.g. tummy time, responsive feeding, gentle massage, an age-appropriate food, outdoor sensory play). ≤ 2 sentences. Adapt to the child's cultural context if cues are present in the profile.
- "reassurance": one "thing NOT to worry about" that is normal at this age (e.g. drooling, hiccups, cluster feeding). ≤ 2 sentences.

RULES
- Use ${name}'s name in at least the title and one other field. Never say "your baby/child" when you can say "${name}".
- Be specific to this child's ACTUAL age and data — never generic.
- Follow WHO and regional pediatric guidelines; never recommend honey before 12 months, kajal/kohl/surma, or added salt/sugar in the first year.
- Warm, calm, second person. Never alarming.
- NEVER diagnose a condition, name a medication or dose, or tell the parent something is wrong. This is encouragement, not medical advice.
- Keep each field genuinely short. No markdown, no emojis, no headings inside the values.

OUTPUT FORMAT
Return ONLY a single minified JSON object and nothing else — no preamble, no code fences:
{"title":"...","expect_this_week":"...","tip":"...","reassurance":"..."}`;
}

/**
 * Defensively parse the model's JSON brief. Tolerates accidental code fences or
 * surrounding prose by extracting the first {...} block. Returns null if the
 * required fields are missing so the caller can skip writing a bad row.
 */
export function parseBriefJson(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  // Strip ```json ... ``` fences if the model added them.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the first balanced-looking object.
  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    text = text.slice(start, end + 1);
  }
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj || typeof obj.title !== 'string' || !obj.title.trim()) return null;
  return {
    title: obj.title.trim(),
    expect_this_week: typeof obj.expect_this_week === 'string' ? obj.expect_this_week.trim() : '',
    tip: typeof obj.tip === 'string' ? obj.tip.trim() : '',
    reassurance: typeof obj.reassurance === 'string' ? obj.reassurance.trim() : '',
  };
}
