import { differenceInDays } from 'date-fns';

const IAP_VISITS = [
  { ageInDays: 0,    label: 'Birth visit',     contents: 'BCG, OPV-0, Hep B-1' },
  { ageInDays: 42,   label: '6-week checkup',  contents: 'DTwP-1, IPV-1, Hib-1, Hep B-2, Rotavirus-1, PCV-1' },
  { ageInDays: 70,   label: '10-week checkup', contents: 'DTwP-2, IPV-2, Hib-2, Rotavirus-2, PCV-2' },
  { ageInDays: 98,   label: '14-week checkup', contents: 'DTwP-3, IPV-3, Hib-3, Rotavirus-3, PCV-3' },
  { ageInDays: 183,  label: '6-month visit',   contents: 'Influenza-1, Typhoid (from 9m)' },
  { ageInDays: 213,  label: '7-month visit',   contents: 'Influenza-2' },
  { ageInDays: 274,  label: '9-month visit',   contents: 'MMR-1' },
  { ageInDays: 365,  label: '12-month visit',  contents: 'Hep A-1, PCV booster' },
  { ageInDays: 457,  label: '15-month visit',  contents: 'MMR-2, Varicella-1' },
  { ageInDays: 548,  label: '18-month visit',  contents: 'DTwP B-1, IPV B-1, Hib B-1, Hep A-2' },
  { ageInDays: 730,  label: '2-year visit',    contents: 'Typhoid booster' },
  { ageInDays: 1643, label: '4.5-year visit',  contents: 'DTwP B-2, OPV, MMR-3, Varicella-2' },
];

export function getNextIapVaccine(dateOfBirth) {
  if (!dateOfBirth) return null;

  const ageInDays = differenceInDays(new Date(), new Date(dateOfBirth));
  const next = IAP_VISITS.find((v) => v.ageInDays > ageInDays);
  if (!next) return null;

  const dueDate = new Date(dateOfBirth);
  dueDate.setDate(dueDate.getDate() + next.ageInDays);

  return {
    label: next.label,
    contents: next.contents,
    dueDate,
    daysAway: next.ageInDays - ageInDays,
  };
}

export function pickNextVaccine({ dateOfBirth, healthRecords }) {
  const today = new Date();

  const userEntered = (healthRecords || [])
    .filter((r) => r.next_due_date && r.record_type === 'vaccination')
    .map((r) => ({
      label: r.title || 'Vaccination',
      contents: null,
      dueDate: new Date(r.next_due_date),
      daysAway: differenceInDays(new Date(r.next_due_date), today),
      source: 'user',
    }))
    .filter((r) => r.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)[0];

  if (userEntered) return userEntered;

  const iap = getNextIapVaccine(dateOfBirth);
  return iap ? { ...iap, source: 'iap' } : null;
}
