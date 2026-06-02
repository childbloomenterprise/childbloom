// Developmental milestone database.
// Sources: WHO Multicentre Growth Reference Study, AAP 2022 guidelines,
// CDC Learn the Signs Act Early (2023 revision), Hanen Centre.
//
// Each milestone has:
//   name         — display label
//   category     — one of: Physical | Communication | Social | Cognitive |
//                          Sleep | Feeding | Behavior | Emotional | Independence
//   medianDays   — median age of attainment
//   windowEndDays — upper end of "normal" range (beyond = mention to doctor)
//   tags         — optional search / filter tags

export const MILESTONE_CATEGORIES = [
  'Physical',
  'Communication',
  'Social',
  'Cognitive',
  'Sleep',
  'Feeding',
  'Behavior',
  'Emotional',
  'Independence',
];

export const MILESTONES = [
  // ── 0–2 months ──────────────────────────────────────────────────────────
  { name: 'First smile',           category: 'Social',       medianDays:  42,  windowEndDays:  70  },
  { name: 'Holds head steady',     category: 'Physical',     medianDays:  56,  windowEndDays: 120  },
  { name: 'Tracks moving objects', category: 'Cognitive',    medianDays:  42,  windowEndDays:  90  },
  { name: 'Responds to sounds',    category: 'Communication',medianDays:  21,  windowEndDays:  60  },

  // ── 2–4 months ──────────────────────────────────────────────────────────
  { name: 'First laugh',           category: 'Social',       medianDays:  98,  windowEndDays: 140  },
  { name: 'Coos & vocalises',      category: 'Communication',medianDays:  56,  windowEndDays: 120  },
  { name: 'Recognises parents',    category: 'Social',       medianDays:  56,  windowEndDays: 120  },
  { name: 'Hands to mouth',        category: 'Physical',     medianDays:  56,  windowEndDays: 112  },

  // ── 4–6 months ──────────────────────────────────────────────────────────
  { name: 'Rolls over',            category: 'Physical',     medianDays: 120,  windowEndDays: 196  },
  { name: 'Reaches for objects',   category: 'Physical',     medianDays: 126,  windowEndDays: 168  },
  { name: 'Longer sleep stretches',category: 'Sleep',        medianDays: 112,  windowEndDays: 196  },
  { name: 'Laughs at peekaboo',    category: 'Social',       medianDays: 168,  windowEndDays: 252  },

  // ── 6–9 months ──────────────────────────────────────────────────────────
  { name: 'Sits unsupported',      category: 'Physical',     medianDays: 182,  windowEndDays: 280  },
  { name: 'Babbles consonants',    category: 'Communication',medianDays: 196,  windowEndDays: 294  },
  { name: 'Stranger anxiety',      category: 'Emotional',    medianDays: 210,  windowEndDays: 300  },
  { name: 'Starts solid foods',    category: 'Feeding',      medianDays: 182,  windowEndDays: 252  },
  { name: 'Responds to own name',  category: 'Communication',medianDays: 168,  windowEndDays: 252  },
  { name: 'Points to objects',     category: 'Cognitive',    medianDays: 252,  windowEndDays: 365  },

  // ── 9–12 months ─────────────────────────────────────────────────────────
  { name: 'Crawls',                category: 'Physical',     medianDays: 252,  windowEndDays: 350  },
  { name: 'Pulls to stand',        category: 'Physical',     medianDays: 294,  windowEndDays: 390  },
  { name: 'Claps hands',           category: 'Physical',     medianDays: 280,  windowEndDays: 365  },
  { name: 'Waves bye-bye',         category: 'Social',       medianDays: 294,  windowEndDays: 378  },
  { name: 'First tooth',           category: 'Physical',     medianDays: 196,  windowEndDays: 365  },
  { name: 'Drinks from cup',       category: 'Feeding',      medianDays: 308,  windowEndDays: 420  },
  { name: 'Sleeps through night',  category: 'Sleep',        medianDays: 252,  windowEndDays: 420  },

  // ── 12–18 months ────────────────────────────────────────────────────────
  { name: 'First words',           category: 'Communication',medianDays: 365,  windowEndDays: 540  },
  { name: 'First steps',           category: 'Physical',     medianDays: 365,  windowEndDays: 548  },
  { name: 'Self-feeding with hands',category: 'Feeding',     medianDays: 365,  windowEndDays: 480  },
  { name: 'Imitates actions',      category: 'Cognitive',    medianDays: 350,  windowEndDays: 480  },
  { name: 'Shows affection',       category: 'Emotional',    medianDays: 365,  windowEndDays: 480  },

  // ── 18–24 months ────────────────────────────────────────────────────────
  { name: 'Runs steadily',         category: 'Physical',     medianDays: 548,  windowEndDays: 700  },
  { name: 'Two-word phrases',      category: 'Communication',medianDays: 548,  windowEndDays: 730  },
  { name: 'Plays alongside others',category: 'Social',       medianDays: 548,  windowEndDays: 730  },
  { name: 'Points to body parts',  category: 'Cognitive',    medianDays: 480,  windowEndDays: 660  },
  { name: 'Uses spoon / fork',     category: 'Feeding',      medianDays: 548,  windowEndDays: 730  },
  { name: 'Follows 2-step instructions', category: 'Cognitive', medianDays: 548, windowEndDays: 730 },

  // ── 24–36 months ────────────────────────────────────────────────────────
  { name: 'Climbs stairs alone',   category: 'Physical',     medianDays: 730,  windowEndDays: 900  },
  { name: 'Three-word sentences',  category: 'Communication',medianDays: 730,  windowEndDays: 900  },
  { name: 'Parallel play',         category: 'Social',       medianDays: 700,  windowEndDays: 900  },
  { name: 'Daytime toilet trained',category: 'Independence', medianDays: 900,  windowEndDays: 1095 },
  { name: 'Draws circles',         category: 'Cognitive',    medianDays: 1095, windowEndDays: 1460 },
  { name: 'Dresses with help',     category: 'Independence', medianDays: 1095, windowEndDays: 1460 },
];

/**
 * Returns the *next* milestone the child should be approaching,
 * plus progress through the typical age window.
 *
 * API is intentionally identical to the old version — callers don't change.
 */
export function getNextMilestone(ageInDays) {
  if (ageInDays == null || ageInDays < 0) return null;

  const upcoming = MILESTONES.find(m => m.medianDays >= ageInDays);
  const m = upcoming || MILESTONES[MILESTONES.length - 1];

  const daysToMedian    = m.medianDays    - ageInDays;
  const daysToWindowEnd = m.windowEndDays - ageInDays;

  // Progress fraction through the typical window.
  // Window lower edge = windowEnd - 90 days (approaching phase).
  const windowStart = Math.max(0, m.windowEndDays - 90);
  const windowSpan  = m.windowEndDays - windowStart;
  const progress    = Math.max(0, Math.min(1, (ageInDays - windowStart) / windowSpan));

  return {
    name:             m.name,
    category:         m.category,
    daysToMedian,
    daysToWindowEnd,
    windowStartWeek:  Math.round(windowStart / 7),
    windowEndWeek:    Math.round(m.windowEndDays / 7),
    currentWeek:      Math.floor(ageInDays / 7),
    progress,
    onTrack: daysToWindowEnd > 0,
  };
}

/**
 * Returns all milestones for a given age range (± buffer) and optional category.
 * Used by the development screen to show the child's upcoming journey.
 */
export function getMilestonesForAge(ageInDays, { rangeBack = 30, rangeForward = 180, category = null } = {}) {
  return MILESTONES.filter(m => {
    const inWindow = m.windowEndDays >= ageInDays - rangeBack &&
                     m.medianDays    <= ageInDays + rangeForward;
    const inCategory = !category || m.category === category;
    return inWindow && inCategory;
  });
}

export function formatMilestoneSubtitle(ms) {
  if (!ms) return '';
  if (ms.daysToMedian > 0) {
    return `typically by week ${Math.round(ms.windowStartWeek + (ms.windowEndWeek - ms.windowStartWeek) / 2)} · you're in week ${ms.currentWeek}`;
  }
  if (ms.onTrack) {
    return `most babies have this by week ${ms.windowEndWeek} · still within window`;
  }
  return `past typical window · mention to your paediatrician`;
}
