// Pure, framework-free helpers for the parent-facing "From your doctor" surface
// (DoctorCarePage). Kept separate from the React hook/page so the formatting and
// grouping logic is unit-testable in isolation. No imports, no side effects.

// consultations.visit_type values written by Dr. Bloom → display metadata.
// `tone` maps to a CB design token family used for the chip colour.
export const VISIT_TYPES = {
  routine:     { labelKey: 'doctorcare.visitType.routine',     fallback: 'Routine check-up', tone: 'brand'  },
  follow_up:   { labelKey: 'doctorcare.visitType.followUp',    fallback: 'Follow-up',        tone: 'brand'  },
  sick:        { labelKey: 'doctorcare.visitType.sick',        fallback: 'Sick visit',       tone: 'danger' },
  emergency:   { labelKey: 'doctorcare.visitType.emergency',   fallback: 'Emergency',        tone: 'danger' },
  vaccination: { labelKey: 'doctorcare.visitType.vaccination', fallback: 'Vaccination',      tone: 'blue'   },
};

// Turn a snake_case / unknown value into a friendly Title Case label.
export function humanize(s) {
  if (!s) return '';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Metadata for a visit type, with a safe fallback for unknown types.
export function visitTypeMeta(type) {
  return VISIT_TYPES[type] || { labelKey: null, fallback: type ? humanize(type) : 'Visit', tone: 'brand' };
}

// "Dr. Asha Rao" — adds the honorific exactly once, never doubles it.
export function doctorLabel(name) {
  const n = (name || '').trim();
  if (!n) return 'Your doctor';
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

// doctor_id -> display name, from the parent-readable connection rows.
export function buildDoctorNameMap(connections = []) {
  const map = {};
  for (const c of connections) {
    if (c && c.doctor_id) map[c.doctor_id] = (c.doctor_display_name || '').trim() || 'Your doctor';
  }
  return map;
}

// One-line prescription summary, e.g. "Paracetamol 250 mg · Twice daily · 5 days".
// Tolerant of missing fields so a half-filled Rx still reads cleanly.
export function formatRxLine(p = {}) {
  const dose = [p.dosage, p.unit].filter(Boolean).join(' ').trim();
  const head = [p.medication_name, dose].filter(Boolean).join(' ').trim();
  const parts = [
    head,
    p.frequency,
    p.duration_days ? `${p.duration_days} day${Number(p.duration_days) === 1 ? '' : 's'}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

// Split prescriptions into active vs past, each newest-first by prescribed_at
// (falling back to created_at). Pure — returns new arrays, never mutates input.
export function groupPrescriptions(list = []) {
  const ts = (p) => new Date(p.prescribed_at || p.created_at || 0).getTime() || 0;
  const byDateDesc = (a, b) => ts(b) - ts(a);
  return {
    active: list.filter((p) => p && p.is_active).slice().sort(byDateDesc),
    past:   list.filter((p) => p && !p.is_active).slice().sort(byDateDesc),
  };
}

// Does this child have anything doctor-authored at all? Drives the empty state.
export function hasAnyDoctorData({ doctors = [], visits = [], prescriptions = [], vaccines = [] } = {}) {
  return (
    (doctors && doctors.length > 0) ||
    (visits && visits.length > 0) ||
    (prescriptions && prescriptions.length > 0) ||
    (vaccines && vaccines.length > 0)
  );
}

// Notification.type -> the parent surface it should deep-link to. Used by both
// useNotifications (toast deep-link) and tests. Returns a path builder result.
export const DOCTOR_NOTIFICATION_TYPES = new Set([
  'prescription_added',
  'visit_summary',
  'vaccination_recorded',
  'connection_approved',
]);

export function doctorNotificationPath(type, childId) {
  if (!DOCTOR_NOTIFICATION_TYPES.has(type)) return null;
  return childId ? `/child/${childId}/doctor` : '/inbox';
}
