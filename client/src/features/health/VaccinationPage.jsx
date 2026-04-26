import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import { T } from '../../components/cb/tokens';
import { differenceInDays, format } from 'date-fns';

const IAP_SCHEDULE = [
  { name: 'BCG', weeks: 0 },
  { name: 'Hepatitis B (birth dose)', weeks: 0 },
  { name: 'OPV 0 (birth dose)', weeks: 0 },
  { name: 'DTwP/DTaP 1', weeks: 6 },
  { name: 'IPV 1', weeks: 6 },
  { name: 'Hib 1', weeks: 6 },
  { name: 'Hepatitis B 2', weeks: 6 },
  { name: 'Rotavirus 1', weeks: 6 },
  { name: 'PCV 1', weeks: 6 },
  { name: 'DTwP/DTaP 2', weeks: 10 },
  { name: 'IPV 2', weeks: 10 },
  { name: 'Hib 2', weeks: 10 },
  { name: 'Rotavirus 2', weeks: 10 },
  { name: 'PCV 2', weeks: 10 },
  { name: 'DTwP/DTaP 3', weeks: 14 },
  { name: 'IPV 3', weeks: 14 },
  { name: 'Hib 3', weeks: 14 },
  { name: 'Rotavirus 3', weeks: 14 },
  { name: 'PCV 3', weeks: 14 },
  { name: 'Hepatitis B 3', weeks: 26 },
  { name: 'Influenza 1', weeks: 26 },
  { name: 'Measles / MMR 1', weeks: 39 },
  { name: 'OPV 1', weeks: 39 },
  { name: 'Hepatitis A 1', weeks: 52 },
  { name: 'Varicella 1', weeks: 52 },
  { name: 'MMR 2', weeks: 65 },
  { name: 'Varicella 2', weeks: 65 },
  { name: 'PCV booster', weeks: 65 },
  { name: 'DTwP/DTaP booster 1', weeks: 78 },
  { name: 'Hib booster', weeks: 78 },
  { name: 'IPV booster', weeks: 78 },
  { name: 'Hepatitis A 2', weeks: 78 },
  { name: 'Typhoid conjugate vaccine', weeks: 104 },
  { name: 'DTwP/DTaP booster 2', weeks: 260 },
  { name: 'OPV booster 2', weeks: 260 },
  { name: 'Tdap', weeks: 520 },
  { name: 'HPV 1 (girls)', weeks: 520 },
  { name: 'HPV 2 (girls)', weeks: 534 },
];

function groupByAge(vaccines) {
  const groups = {};
  vaccines.forEach(v => {
    const key = v.weeks === 0 ? 'Birth'
      : v.weeks < 52 ? `${v.weeks} weeks`
      : v.weeks < 260 ? `${Math.round(v.weeks / 4.33)} months`
      : `${Math.round(v.weeks / 52)} years`;
    if (!groups[key]) groups[key] = { label: key, weeks: v.weeks, items: [] };
    groups[key].items.push(v);
  });
  return Object.values(groups).sort((a, b) => a.weeks - b.weeks);
}

export default function VaccinationPage() {
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const queryClient = useQueryClient();
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [dateGiven, setDateGiven] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaccinations').select('*').eq('child_id', childId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });

  const markMutation = useMutation({
    mutationFn: async ({ vaccineName, dateGiven, notes }) => {
      const existing = vaccinations.find(v => v.vaccine_name === vaccineName);
      if (existing) {
        const { error } = await supabase.from('vaccinations').update({ date_given: dateGiven, notes: notes || null }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vaccinations').insert({ child_id: childId, vaccine_name: vaccineName, date_given: dateGiven, notes: notes || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', childId] });
      setSelectedVaccine(null);
      setNotes('');
    },
  });

  const getStatus = (schedule) => {
    const record = vaccinations.find(v => v.vaccine_name === schedule.name);
    if (record?.date_given) return 'done';
    const dueDate = child?.date_of_birth
      ? new Date(new Date(child.date_of_birth).getTime() + schedule.weeks * 7 * 24 * 3600 * 1000)
      : null;
    if (!dueDate) return 'upcoming';
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 14) return 'soon';
    return 'upcoming';
  };

  const groups = groupByAge(IAP_SCHEDULE);
  const doneCount = IAP_SCHEDULE.filter(s => getStatus(s) === 'done').length;
  const totalCount = IAP_SCHEDULE.length;

  // Next upcoming vaccine
  const nextVaccine = IAP_SCHEDULE.find(s => {
    const status = getStatus(s);
    return status === 'soon' || status === 'overdue';
  }) || IAP_SCHEDULE.find(s => getStatus(s) === 'upcoming');

  const nextDaysUntil = nextVaccine && child?.date_of_birth
    ? differenceInDays(
        new Date(new Date(child.date_of_birth).getTime() + nextVaccine.weeks * 7 * 24 * 3600 * 1000),
        new Date()
      )
    : null;

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle eyebrow="IAP SCHEDULE" title="Vaccines"
          trailing={
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', color: T.forest700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <CBIcon name="calendar" size={17} />
            </button>
          }
        />
      </div>

      {/* Up next card */}
      {nextVaccine && (
        <div style={{ margin: '0 16px 16px', borderRadius: 18, background: T.forest700, color: '#fff', padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.08, color: '#fff' }}>
            <CBIcon name="syringe" size={120} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.8 }}>Up next</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1 }}>
            {nextDaysUntil === 0 ? 'Today'
              : nextDaysUntil && nextDaysUntil > 0 ? `In ${nextDaysUntil} day${nextDaysUntil !== 1 ? 's' : ''}`
              : nextDaysUntil && nextDaysUntil < 0 ? `${Math.abs(nextDaysUntil)}d overdue`
              : 'Upcoming'
            }
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>{nextVaccine.name}</div>
        </div>
      )}

      {/* Progress */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.ink300, fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>
          <span>{doneCount} of {totalCount} doses</span>
          <span>Series complete by 16 yrs</span>
        </div>
        <div style={{ height: 6, background: T.ink100, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1.5 }}>
          {Array.from({ length: totalCount }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: i < doneCount ? T.forest500 : 'transparent' }} />
          ))}
        </div>
      </div>

      {/* Schedule groups */}
      {groups.map((g) => {
        const groupStatus = g.items.every(it => getStatus(it) === 'done') ? 'done'
          : g.items.some(it => getStatus(it) === 'overdue') ? 'overdue'
          : g.items.some(it => getStatus(it) === 'soon') ? 'soon'
          : 'upcoming';

        const statusColor = { done: T.forest500, overdue: T.red, soon: T.orange, upcoming: T.ink300 }[groupStatus];

        return (
          <div key={g.label} style={{ margin: '12px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 8px' }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.ink900, letterSpacing: '-0.015em', margin: 0 }}>{g.label}</h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
                {groupStatus === 'done' ? 'completed' : groupStatus === 'overdue' ? 'overdue' : groupStatus === 'soon' ? 'coming up' : ''}
              </span>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: groupStatus === 'overdue' ? `1px solid ${T.red}30` : groupStatus === 'soon' ? `1px solid ${T.orange}30` : 'none' }}>
              {g.items.map((it, i) => {
                const status = getStatus(it);
                const isDone = status === 'done';
                const isOverdue = status === 'overdue';
                const isSoon = status === 'soon';
                return (
                  <div key={it.name}
                    onClick={() => !isDone && setSelectedVaccine(it)}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < g.items.length - 1 ? `0.5px solid ${T.ink100}` : 'none', gap: 10, cursor: isDone ? 'default' : 'pointer' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isDone ? T.forest500 : isOverdue ? T.red + '25' : isSoon ? T.orange + '25' : '#fafafa', color: isDone ? '#fff' : isOverdue ? T.red : isSoon ? T.orange : T.ink300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: isDone || isOverdue || isSoon ? 'none' : `1px solid ${T.ink100}` }}>
                      {isDone ? <CBIcon name="check" size={13} stroke={2.5} /> : (isOverdue || isSoon) ? <CBIcon name="syringe" size={11} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isDone ? T.ink300 : T.ink900 }}>{it.name}</div>
                    </div>
                    {!isDone && <CBIcon name="chevron-right" size={14} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Mark as given modal */}
      {selectedVaccine && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: T.ink900, marginBottom: 6 }}>Mark as given</div>
            <div style={{ fontSize: 15, color: T.ink500, marginBottom: 20 }}>{selectedVaccine.name}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink500, marginBottom: 6 }}>Date given</div>
            <input type="date" value={dateGiven} max={format(new Date(), 'yyyy-MM-dd')} onChange={e => setDateGiven(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `0.5px solid ${T.ink100}`, fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink500, marginBottom: 6 }}>Notes (optional)</div>
            <input type="text" placeholder="e.g. Apollo Clinic, Dr. Sharma" value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `0.5px solid ${T.ink100}`, fontSize: 15, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedVaccine(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 99, background: T.ink100, color: T.ink700, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => markMutation.mutate({ vaccineName: selectedVaccine.name, dateGiven, notes })} disabled={markMutation.isPending}
                style={{ flex: 2, padding: '14px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                {markMutation.isPending ? 'Saving…' : 'Mark as given'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
