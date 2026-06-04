import { getAgeInMonths } from '../../../lib/formatters';
import { EMERGENCIES } from './emergencies';

// "What's happening?" triage — symptom-first, ordered by how fast it kills.
// Where two age variants exist (CPR, choking), `resolve(infant)` picks the right
// protocol id from the selected child's age. The allergy tile floats to the very
// top when the child has known allergies on file (ChildBloom's edge over generic
// first-aid apps — it knows THIS child).

export const INFANT_MAX_MONTHS = 12;

const TRIAGE = [
  { key: 'not-breathing', label: "Not breathing or unresponsive", icon: 'heart-pulse', severity: 'critical',
    resolve: (infant) => (infant ? 'infant-cpr' : 'child-cpr') },
  { key: 'choking', label: "Choking — can't breathe", icon: 'lungs', severity: 'critical',
    resolve: (infant) => (infant ? 'choking-infant' : 'choking-child') },
  { key: 'allergy', label: 'Severe allergy / use EpiPen', icon: 'shield', severity: 'critical',
    topicId: 'allergic-reaction', allergyTile: true },
  { key: 'bleeding', label: 'Severe bleeding', icon: 'droplet', severity: 'critical', topicId: 'severe-bleeding' },
  { key: 'drowning', label: 'Drowning', icon: 'wave-water', severity: 'critical', topicId: 'drowning' },
  { key: 'electric', label: 'Electric shock', icon: 'bolt', severity: 'critical', topicId: 'electric-shock' },
  { key: 'seizure', label: 'Seizure or fit', icon: 'brain', severity: 'urgent', topicId: 'seizure' },
  { key: 'burn', label: 'Burn or scald', icon: 'flame', severity: 'urgent', topicId: 'burns' },
  { key: 'head', label: 'Head injury', icon: 'brain', severity: 'urgent', topicId: 'head-injury' },
  { key: 'poison', label: 'Poisoning', icon: 'pill', severity: 'urgent', topicId: 'poisoning' },
  { key: 'heat', label: 'Heatstroke or cold', icon: 'sun', severity: 'urgent', topicId: 'heatstroke' },
];

// Builds the ordered list of big triage tiles for a child.
// `ageInMonths` can be injected for deterministic tests; otherwise it is derived
// from `child.date_of_birth`. A missing/unknown age defaults to the child (1y+)
// protocols, which the parent can still override from "More guides".
export function buildTriage(child, { ageInMonths } = {}) {
  const months = ageInMonths ?? (child?.date_of_birth ? getAgeInMonths(child.date_of_birth) : null);
  const infant = months != null && months < INFANT_MAX_MONTHS;
  const hasAllergy = Array.isArray(child?.known_allergies) && child.known_allergies.length > 0;

  const tiles = TRIAGE.map((t) => {
    const topicId = t.topicId || t.resolve(infant);
    const e = EMERGENCIES.find((x) => x.id === topicId);
    return {
      key: t.key,
      topicId,
      label: t.label,
      sublabel: e?.subtitle || '',
      severity: t.severity,
      icon: t.icon,
      pinned: !!(t.allergyTile && hasAllergy),
    };
  });

  // Pinned allergy tile to the very top; everything else keeps declared order
  // (Array.prototype.sort is stable, so non-pinned tiles do not reshuffle).
  return tiles.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}

// The non-life-threatening guides shown as a secondary "More first-aid guides"
// list (read view), not as big triage buttons.
export function moreGuides() {
  return EMERGENCIES.filter((e) => e.severity === 'manageable');
}
