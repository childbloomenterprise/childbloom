import { describe, it, expect } from 'vitest';
import {
  humanize,
  visitTypeMeta,
  doctorLabel,
  buildDoctorNameMap,
  formatRxLine,
  groupPrescriptions,
  hasAnyDoctorData,
  doctorNotificationPath,
} from './doctorCare';

describe('humanize', () => {
  it('title-cases snake_case', () => {
    expect(humanize('follow_up')).toBe('Follow Up');
  });
  it('returns empty string for nullish', () => {
    expect(humanize(undefined)).toBe('');
    expect(humanize('')).toBe('');
  });
});

describe('visitTypeMeta', () => {
  it('returns known metadata', () => {
    expect(visitTypeMeta('sick').tone).toBe('danger');
    expect(visitTypeMeta('routine').fallback).toBe('Routine check-up');
  });
  it('falls back gracefully for unknown types', () => {
    const m = visitTypeMeta('telehealth_call');
    expect(m.labelKey).toBeNull();
    expect(m.fallback).toBe('Telehealth Call');
  });
  it('handles missing type', () => {
    expect(visitTypeMeta(undefined).fallback).toBe('Visit');
  });
});

describe('doctorLabel', () => {
  it('adds the honorific once', () => {
    expect(doctorLabel('Asha Rao')).toBe('Dr. Asha Rao');
  });
  it('does not double the honorific', () => {
    expect(doctorLabel('Dr. Asha Rao')).toBe('Dr. Asha Rao');
    expect(doctorLabel('dr Asha')).toBe('dr Asha');
  });
  it('falls back when empty', () => {
    expect(doctorLabel('')).toBe('Your doctor');
    expect(doctorLabel(null)).toBe('Your doctor');
  });
});

describe('buildDoctorNameMap', () => {
  it('maps doctor_id to display name', () => {
    const map = buildDoctorNameMap([
      { doctor_id: 'a', doctor_display_name: 'Asha Rao' },
      { doctor_id: 'b', doctor_display_name: '' },
    ]);
    expect(map.a).toBe('Asha Rao');
    expect(map.b).toBe('Your doctor');
  });
  it('ignores rows without a doctor_id', () => {
    expect(buildDoctorNameMap([{ doctor_display_name: 'x' }])).toEqual({});
    expect(buildDoctorNameMap()).toEqual({});
  });
});

describe('formatRxLine', () => {
  it('formats a full prescription', () => {
    expect(formatRxLine({ medication_name: 'Paracetamol', dosage: '250', unit: 'mg', frequency: 'Twice daily', duration_days: 5 }))
      .toBe('Paracetamol 250 mg · Twice daily · 5 days');
  });
  it('singularises one day', () => {
    expect(formatRxLine({ medication_name: 'Amoxicillin', dosage: '5', unit: 'ml', frequency: 'Once', duration_days: 1 }))
      .toBe('Amoxicillin 5 ml · Once · 1 day');
  });
  it('tolerates missing fields', () => {
    expect(formatRxLine({ medication_name: 'Vitamin D' })).toBe('Vitamin D');
    expect(formatRxLine({})).toBe('');
  });
});

describe('groupPrescriptions', () => {
  const list = [
    { id: '1', is_active: true,  prescribed_at: '2026-06-01T00:00:00Z' },
    { id: '2', is_active: false, prescribed_at: '2026-05-01T00:00:00Z' },
    { id: '3', is_active: true,  prescribed_at: '2026-06-10T00:00:00Z' },
  ];
  it('splits active vs past', () => {
    const { active, past } = groupPrescriptions(list);
    expect(active.map((p) => p.id)).toEqual(['3', '1']); // newest first
    expect(past.map((p) => p.id)).toEqual(['2']);
  });
  it('does not mutate the input', () => {
    const copy = [...list];
    groupPrescriptions(list);
    expect(list).toEqual(copy);
  });
  it('handles empty input', () => {
    expect(groupPrescriptions()).toEqual({ active: [], past: [] });
  });
});

describe('hasAnyDoctorData', () => {
  it('is false when everything is empty', () => {
    expect(hasAnyDoctorData()).toBe(false);
    expect(hasAnyDoctorData({ doctors: [], visits: [], prescriptions: [], vaccines: [] })).toBe(false);
  });
  it('is true when any list has data', () => {
    expect(hasAnyDoctorData({ prescriptions: [{ id: 'x' }] })).toBe(true);
    expect(hasAnyDoctorData({ doctors: [{ id: 'd' }] })).toBe(true);
  });
});

describe('doctorNotificationPath', () => {
  it('deep-links doctor notification types to the doctor page', () => {
    expect(doctorNotificationPath('prescription_added', 'c1')).toBe('/child/c1/doctor');
    expect(doctorNotificationPath('visit_summary', 'c1')).toBe('/child/c1/doctor');
    expect(doctorNotificationPath('vaccination_recorded', 'c1')).toBe('/child/c1/doctor');
    expect(doctorNotificationPath('connection_approved', 'c1')).toBe('/child/c1/doctor');
  });
  it('falls back to inbox without a childId', () => {
    expect(doctorNotificationPath('prescription_added', null)).toBe('/inbox');
  });
  it('returns null for unrelated types', () => {
    expect(doctorNotificationPath('connection_request', 'c1')).toBeNull();
    expect(doctorNotificationPath('streak_risk', 'c1')).toBeNull();
  });
});
