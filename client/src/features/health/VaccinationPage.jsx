import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ProgressBar, BloomFlower,
} from '../../components/cb/primitives';
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

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: RADIUS.md,
    border: `0.5px solid ${T.line}`, fontSize: 15, outline: 'none',
    marginBottom: 12, boxSizing: 'border-box', fontFamily: FONTS.sans,
    background: T.surface, color: T.ink900,
  };

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <div style={{ paddingTop: 52 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <Eyebrow color={T.ink300}>IAP SCHEDULE</Eyebrow>
          <Spacer h={4} />
          <Display size={34} italic weight={600} lh={1.05}>Vaccines</Display>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Up next card */}
        {nextVaccine && (
          <Card p={18} tone="brand" style={{ position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, pointerEvents: 'none', color: '#fff' }}>
              <CBIcon name="syringe" size={120} />
            </div>
            <Eyebrow color="rgba(255,255,255,0.75)">Up next</Eyebrow>
            <Spacer h={6} />
            <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, color: '#fff' }}>
              {nextDaysUntil === 0 ? 'Today'
                : nextDaysUntil && nextDaysUntil > 0 ? `In ${nextDaysUntil} day${nextDaysUntil !== 1 ? 's' : ''}`
                : nextDaysUntil && nextDaysUntil < 0 ? `${Math.abs(nextDaysUntil)}d overdue`
                : 'Upcoming'}
            </div>
            <Spacer h={4} />
            <Body size={13} color="rgba(255,255,255,0.85)">{nextVaccine.name}</Body>
          </Card>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <HRow justify="space-between" style={{ marginBottom: 6 }}>
            <Mono size={11} color={T.ink300}>{doneCount} of {totalCount} doses</Mono>
            <Mono size={11} color={T.ink300}>Series complete by 16 yrs</Mono>
          </HRow>
          <ProgressBar value={doneCount / totalCount} animated />
        </div>

        {/* Schedule groups */}
        {groups.map((g) => {
          const groupStatus = g.items.every(it => getStatus(it) === 'done') ? 'done'
            : g.items.some(it => getStatus(it) === 'overdue') ? 'overdue'
            : g.items.some(it => getStatus(it) === 'soon') ? 'soon'
            : 'upcoming';

          const statusColors = {
            done:     { color: T.brand,  label: 'completed' },
            overdue:  { color: '#FF3B30', label: 'overdue' },
            soon:     { color: '#FF9500', label: 'coming up' },
            upcoming: { color: T.ink300,  label: '' },
          }[groupStatus];

          return (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <HRow justify="space-between" align="baseline" style={{ marginBottom: 8, padding: '0 4px' }}>
                <Display size={18} italic weight={600}>{g.label}</Display>
                {statusColors.label && <Mono size={11} color={statusColors.color}>{statusColors.label}</Mono>}
              </HRow>
              <Card p={0} style={{ border: groupStatus === 'overdue' ? `1px solid #FF3B3030` : groupStatus === 'soon' ? `1px solid #FF950030` : 'none' }}>
                {g.items.map((it, i) => {
                  const status = getStatus(it);
                  const isDone = status === 'done';
                  const isOverdue = status === 'overdue';
                  const isSoon = status === 'soon';
                  const dotColor = isDone ? T.brand : isOverdue ? '#FF3B30' : isSoon ? '#FF9500' : T.ink300;
                  return (
                    <div key={it.name}>
                      <HRow gap={10} style={{ padding: '12px 14px', cursor: isDone ? 'default' : 'pointer' }} align="center"
                        onClick={() => !isDone && setSelectedVaccine(it)}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: isDone ? T.brand : isOverdue ? '#FF3B3025' : isSoon ? '#FF950025' : T.surfaceDim,
                          color: isDone ? '#fff' : dotColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: isDone || isOverdue || isSoon ? 'none' : `1px solid ${T.line}`,
                          animation: isOverdue ? 'glow-ring 1.8s ease-in-out infinite' : isSoon ? 'badge-pulse 2s ease-in-out infinite' : 'none',
                        }}>
                          {isDone ? <CBIcon name="check" size={13} stroke={2.5} /> : (isOverdue || isSoon) ? <CBIcon name="syringe" size={11} /> : null}
                        </div>
                        <Body size={14} color={isDone ? T.ink300 : T.ink900} weight={isDone ? 400 : 600} style={{ flex: 1, textDecoration: isDone ? 'line-through' : 'none' }}>{it.name}</Body>
                        {!isDone && <CBIcon name="chevron-right" size={14} style={{ color: T.ink300 }} />}
                      </HRow>
                      {i < g.items.length - 1 && <Divider />}
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })}

        <Spacer h={24} />
      </div>

      {/* Mark as given modal */}
      {selectedVaccine && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setSelectedVaccine(null)} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', zIndex: 201, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.line, margin: '0 auto 20px' }} />
            <Display size={22} italic weight={600} style={{ marginBottom: 6 }}>Mark as given</Display>
            <Body size={15} color={T.ink500} style={{ marginBottom: 20 }}>{selectedVaccine.name}</Body>

            <Mono size={13} color={T.ink400} weight={600} style={{ display: 'block', marginBottom: 6 }}>Date given</Mono>
            <input type="date" value={dateGiven} max={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDateGiven(e.target.value)} style={inputStyle} />

            <Mono size={13} color={T.ink400} weight={600} style={{ display: 'block', marginBottom: 6 }}>Notes (optional)</Mono>
            <input type="text" placeholder="e.g. Apollo Clinic, Dr. Sharma" value={notes}
              onChange={e => setNotes(e.target.value)} style={inputStyle} />

            <Spacer h={8} />
            <HRow gap={10}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setSelectedVaccine(null)}>Cancel</Button>
              <Button variant="primary" style={{ flex: 2 }}
                onClick={() => markMutation.mutate({ vaccineName: selectedVaccine.name, dateGiven, notes })}
                disabled={markMutation.isPending}>
                {markMutation.isPending ? 'Saving…' : 'Mark as given'}
              </Button>
            </HRow>
          </div>
        </>
      )}
    </div>
  );
}
