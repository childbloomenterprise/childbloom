// Bloom Path — 8 areas of child development reframed in warm language.
// Each area has its own gentle accent (never primary brand green to avoid
// implying "achievement"). Activity library is age-windowed in days.

export const BLOOM_AREAS = [
  { key: 'body',        label: 'Body & Movement',       short: 'Body',       accent: '#D9A66B', wash: '#FAF1E2', icon: 'sparkle',   plain: 'Motor skills, posture, reach' },
  { key: 'voice',       label: 'Sounds & Voice',        short: 'Voice',      accent: '#7DA6C9', wash: '#E8F0F7', icon: 'mic',       plain: 'Babbling, words, language' },
  { key: 'feelings',    label: 'Feelings & Bonds',      short: 'Feelings',   accent: '#C99090', wash: '#F7EAEA', icon: 'heart',     plain: 'Emotional regulation, attachment' },
  { key: 'rest',        label: 'Rest & Rhythm',         short: 'Rest',       accent: '#6878A8', wash: '#E8ECF5', icon: 'moon',      plain: 'Sleep, self-soothing' },
  { key: 'nourishment', label: 'Nourishment',           short: 'Food',       accent: '#B87560', wash: '#F5E5DE', icon: 'bottle',    plain: 'Feeding skills, food curiosity' },
  { key: 'wonder',      label: 'Wonder & Play',         short: 'Wonder',     accent: '#C9B25A', wash: '#F7F2DC', icon: 'sun',       plain: 'Curiosity, exploration' },
  { key: 'together',    label: 'Together Time',         short: 'Together',   accent: '#C97D7D', wash: '#F7E6E6', icon: 'family',    plain: 'Social engagement, recognition' },
  { key: 'thinking',    label: 'Thinking & Discovery',  short: 'Thinking',   accent: '#7DA68C', wash: '#E8F2EC', icon: 'leaf',      plain: 'Problem-solving, cause + effect' },
];

export function getArea(key) {
  return BLOOM_AREAS.find(a => a.key === key) || null;
}

// Activity library — age in days. Each activity has a soft label,
// 1-line "why it matters" body, time estimate. Age windows are wide on
// purpose: we never want a parent to feel "out of time" for an activity.
//
// Each line follows the 3-part voice:
//   [Acknowledgement of what is] → [Soft invitation] → permission to skip implicit
export const BLOOM_ACTIVITIES = {
  body: [
    { ageStart:   0, ageEnd:  90, label: 'Tummy time',                body: 'Even 5 minutes builds neck control. Start with a minute, end when they fuss.',         minutes: 5 },
    { ageStart:  30, ageEnd: 180, label: 'Sit up against pillows',    body: 'Cushion support frees their hands. Offer a soft toy at arm\'s length.',                minutes: 5 },
    { ageStart:  60, ageEnd: 240, label: 'Reach for a textured toy',  body: 'Different textures invite the hand to open. No grip needed — just contact.',          minutes: 3 },
    { ageStart: 180, ageEnd: 365, label: 'Roll a ball back & forth',  body: 'Pre-walking babies love this. Two hands, big eyes, your reaction is the reward.',     minutes: 8 },
    { ageStart: 300, ageEnd: 540, label: 'Pull up on furniture',      body: 'Set a low coffee table within reach. They\'ll find the railing themselves.',          minutes: 10 },
    { ageStart: 540, ageEnd: 999, label: 'Walk slowly side by side',  body: 'Hold one hand — let their pace lead. The path matters less than the partnership.',     minutes: 10 },
  ],
  voice: [
    { ageStart:   0, ageEnd:  60, label: 'Talk softly during feeds',  body: 'Your voice is the first instrument they tune to. Even nonsense words count.',         minutes: 1 },
    { ageStart:  30, ageEnd: 180, label: 'Imitate their coos',        body: 'When they make a sound, repeat it back. You\'re teaching them they\'re heard.',        minutes: 2 },
    { ageStart:  90, ageEnd: 300, label: 'Read with voices',          body: 'Any picture book. Funny voices welcome. The cadence matters more than the words.',     minutes: 5 },
    { ageStart: 180, ageEnd: 540, label: 'Name what you\'re doing',   body: '"Now we\'re washing your toes." Narration grows vocabulary without lessons.',         minutes: 3 },
    { ageStart: 365, ageEnd: 999, label: 'Sing songs in your language', body: 'A lullaby in Malayalam, Hindi, Tamil — language imprinting is strongest at home.',  minutes: 5 },
  ],
  feelings: [
    { ageStart:   0, ageEnd:  90, label: 'Skin-to-skin time',         body: 'Your heartbeat steadies theirs. No agenda — just presence.',                          minutes: 10 },
    { ageStart:  60, ageEnd: 365, label: 'Slow eye contact',          body: 'Match their gaze for a few seconds at a time. Look away first — let them invite you back.', minutes: 2 },
    { ageStart: 180, ageEnd: 540, label: 'Name their feeling',        body: '"You\'re frustrated. That makes sense." Naming calms the storm — for them and you.',  minutes: 1 },
    { ageStart: 365, ageEnd: 999, label: 'Sit through a tantrum',     body: 'Stay near, don\'t fix. Big feelings need a safe witness, not a solution.',            minutes: 0 },
  ],
  rest: [
    { ageStart:   0, ageEnd: 180, label: 'Wind-down dim light',       body: 'Lower the lights an hour before bedtime. Their tiny pineal gland is watching.',       minutes: 0 },
    { ageStart:  60, ageEnd: 365, label: 'Same lullaby, same time',   body: 'Repetition is what makes a bedtime cue. Boring is good.',                             minutes: 5 },
    { ageStart: 180, ageEnd: 999, label: 'Drowsy-but-awake transfer', body: 'Place them down before they fully sleep. Self-soothing is a skill, not a personality.', minutes: 0 },
  ],
  nourishment: [
    { ageStart:   0, ageEnd: 180, label: 'Watch hunger cues, not clock', body: 'Rooting, hands to mouth, fussing-before-crying. Clock-feeding can come later.',    minutes: 0 },
    { ageStart: 150, ageEnd: 300, label: 'First taste sessions',       body: 'A finger-dipped spoon of dal water. Curiosity matters more than quantity.',           minutes: 5 },
    { ageStart: 240, ageEnd: 540, label: 'Let them hold the spoon',    body: 'Messy at first — then suddenly not. Hand the spoon over before they ask.',           minutes: 10 },
    { ageStart: 365, ageEnd: 999, label: 'Family meal together',       body: 'Same table, even if different foods. Eating-together is a learned skill.',           minutes: 20 },
  ],
  wonder: [
    { ageStart:  30, ageEnd: 180, label: 'High-contrast mobile',       body: 'Black and white shapes hold a young baby\'s gaze longest.',                          minutes: 5 },
    { ageStart:  90, ageEnd: 365, label: 'Mirror play',                body: 'They\'ll smile at "the other baby" long before they know it\'s them.',                minutes: 5 },
    { ageStart: 180, ageEnd: 540, label: 'Container + objects',        body: 'A bowl and three blocks. In, out, in, out. Object permanence is unfolding.',         minutes: 8 },
    { ageStart: 365, ageEnd: 999, label: 'Outside walk, no agenda',    body: 'Let them stop at every leaf. The pace is the point.',                                minutes: 15 },
  ],
  together: [
    { ageStart:   0, ageEnd: 180, label: 'Face-to-face quiet time',    body: 'No phone, no toy. Just looking at each other. This is the first conversation.',     minutes: 3 },
    { ageStart:  90, ageEnd: 365, label: 'Peek-a-boo',                 body: 'They\'re learning that things still exist when hidden. Big concept, small game.',    minutes: 5 },
    { ageStart: 240, ageEnd: 540, label: 'Wave bye to family',         body: 'Greetings + goodbyes are the seeds of social ritual.',                                minutes: 1 },
    { ageStart: 540, ageEnd: 999, label: 'Pretend tea party',          body: 'They pour, you sip. The first imaginary world is shared with you.',                  minutes: 10 },
  ],
  thinking: [
    { ageStart:  60, ageEnd: 240, label: 'Cause + effect rattle',      body: 'They shake, sound happens. The first "I made that" moment.',                         minutes: 5 },
    { ageStart: 180, ageEnd: 365, label: 'Hide a toy under cloth',     body: 'Watch their face. Confused → curious → reaches. That\'s a brain growing.',           minutes: 3 },
    { ageStart: 365, ageEnd: 720, label: 'Stacking blocks',            body: 'Tower of two, then three. Failure is part of the lesson.',                            minutes: 8 },
    { ageStart: 720, ageEnd: 999, label: 'Simple puzzle (3 pieces)',   body: 'Watch them think. Don\'t solve it for them.',                                         minutes: 10 },
  ],
};

// Pick 1-3 activities matching the child's age, prefer ones starting near current age.
export function getActivitiesForArea(areaKey, ageInDays, limit = 3) {
  const list = BLOOM_ACTIVITIES[areaKey] || [];
  const inWindow = list.filter(a => ageInDays >= a.ageStart && ageInDays <= a.ageEnd);
  if (inWindow.length === 0) {
    // Fallback to closest age — never show "no activities."
    const closest = [...list].sort((a, b) => Math.abs(a.ageStart - ageInDays) - Math.abs(b.ageStart - ageInDays));
    return closest.slice(0, limit);
  }
  // Prefer activities whose age start is just behind current age (most relevant)
  return [...inWindow]
    .sort((a, b) => (ageInDays - a.ageStart) - (ageInDays - b.ageStart))
    .slice(0, limit);
}

// Pick one daily suggestion deterministically based on date + child id,
// so the suggestion is stable through the day but rotates day-to-day.
export function getDailySuggestion(ageInDays, childId, momentsByArea = {}) {
  if (ageInDays == null || ageInDays < 0) return null;

  // Rotate area priority by day-of-year, weighted toward areas with NO recent
  // moments (gentle nudge to broaden, never urgent).
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  // Areas with no logged moments first; others after.
  const empty = BLOOM_AREAS.filter(a => !momentsByArea[a.key] || momentsByArea[a.key] === 0);
  const filled = BLOOM_AREAS.filter(a => momentsByArea[a.key] > 0);
  const ordered = [...empty, ...filled];

  const area = ordered[dayOfYear % ordered.length];
  const activities = getActivitiesForArea(area.key, ageInDays, 1);
  if (!activities.length) return null;

  return {
    area: area.key,
    areaLabel: area.label,
    accent: area.accent,
    activity: activities[0],
  };
}
