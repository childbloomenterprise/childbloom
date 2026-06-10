import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { celebrate } from '../../lib/bloomBurst';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import { useAchievements } from '../../hooks/useAchievements';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, ChromeBtn,
  AIBubble,
} from '../../components/cb/primitives';
import CBSegmented from '../../components/cb/CBSegmented';
import { format, differenceInWeeks } from 'date-fns';

function percentileLabel(val, metric, ageWeeks) {
  const norms = {
    weight: { p50: 3.3 + ageWeeks * 0.2, spread: 0.8 },
    height: { p50: 50 + ageWeeks * 0.7, spread: 2.5 },
    head:   { p50: 34 + ageWeeks * 0.3, spread: 1.2 },
  };
  const n = norms[metric];
  if (!n || !val) return null;
  const z = (val - n.p50) / n.spread;
  if (z > 1.6) return '97th+';
  if (z > 0.5) return `~${Math.round(70 + z * 15)}th`;
  if (z > -0.5) return `~${Math.round(50 + z * 15)}th`;
  if (z > -1.6) return `~${Math.round(30 + z * 15)}th`;
  return '3rd–';
}

export default function GrowthPage() {
  const { id: childId } = useParams();
  const navigate = useNavigate();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { tryUnlock } = useAchievements();
  const [metric, setMetric] = useState('weight');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    record_date: format(new Date(), 'yyyy-MM-dd'),
    weight_kg: '', height_cm: '', head_circumference_cm: '',
  });

  const { data: records = [] } = useQuery({
    queryKey: ['growth-records', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_records').select('*')
        .eq('child_id', childId)
        .order('record_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('growth_records').insert({
        child_id: childId,
        user_id: user.id,
        record_date: formData.record_date,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        head_circumference_cm: formData.head_circumference_cm ? parseFloat(formData.head_circumference_cm) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-records', childId] });
      celebrate();
      setShowForm(false);
      setFormData({ record_date: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', height_cm: '', head_circumference_cm: '' });
      const newTotal = records.length + 1;
      if (newTotal === 1) tryUnlock('first_measurement');
      if (newTotal >= 5)  tryUnlock('growth_5');
    },
  });

  const latest = records[records.length - 1];
  const ageWeeks = child?.date_of_birth
    ? differenceInWeeks(new Date(), new Date(child.date_of_birth))
    : 0;

  const metricKey = { weight: 'weight_kg', height: 'height_cm', head: 'head_circumference_cm' }[metric];
  const points = records
    .filter(r => r[metricKey] != null)
    .map((r, i) => ({ i, v: r[metricKey], d: r.record_date }));

  const W = 340, H = 160, padX = 28, padY = 16;
  const vals = points.map(p => p.v);
  const vMin = vals.length ? Math.min(...vals) * 0.95 : 0;
  const vMax = vals.length ? Math.max(...vals) * 1.05 : 1;
  const xs = (i) => padX + (points.length > 1 ? (i / (points.length - 1)) : 0.5) * (W - padX * 2);
  const ys = (v) => H - padY - ((v - vMin) / (vMax - vMin || 1)) * (H - padY * 2);
  const linePath = points.length > 1 ? `M${points.map((p, i) => `${xs(i)},${ys(p.v)}`).join(' L')}` : null;

  const inputStyle = {
    padding: '10px', borderRadius: RADIUS.sm,
    border: `0.5px solid ${T.line}`, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    background: T.surface, color: T.ink900, fontFamily: FONTS.sans,
  };

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <div style={{ paddingTop: 52 }}>

        {/* Header */}
        <div style={{ padding: '4px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {child && <Eyebrow color={T.ink300}>{child.name.toUpperCase()} · {ageWeeks} WEEKS</Eyebrow>}
            <Spacer h={4} />
            <Display size={34} italic weight={600} lh={1.05}>Growth</Display>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            aria-label={showForm ? 'Close add measurement form' : 'Add a measurement'}
            aria-expanded={showForm}
            style={{ width: 36, height: 36, borderRadius: '50%', background: T.surface, border: 'none', cursor: 'pointer', color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <CBIcon name="plus" size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Add form */}
        {showForm && (
          <Card p={16} style={{ marginBottom: 16 }}>
            <Mono size={13} color={T.ink500} style={{ marginBottom: 12, display: 'block' }}>Log measurement</Mono>
            <input type="date" value={formData.record_date}
              aria-label="Measurement date"
              onChange={e => setFormData(f => ({ ...f, record_date: e.target.value }))}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[{ k: 'weight_kg', l: 'Weight (kg)' }, { k: 'height_cm', l: 'Height (cm)' }, { k: 'head_circumference_cm', l: 'Head (cm)' }].map(f => (
                <input key={f.k} type="number" step="0.1" placeholder={f.l}
                  aria-label={f.l}
                  value={formData[f.k]}
                  onChange={e => setFormData(prev => ({ ...prev, [f.k]: e.target.value }))}
                  style={inputStyle} />
              ))}
            </div>
            <Spacer h={12} />
            <Button variant="primary" full onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving…' : 'Save measurement'}
            </Button>
          </Card>
        )}

        {/* KPI cards */}
        {latest && (
          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { l: 'Weight', v: latest.weight_kg,             u: 'kg', metric: 'weight' },
              { l: 'Height', v: latest.height_cm,             u: 'cm', metric: 'height' },
              { l: 'Head',   v: latest.head_circumference_cm, u: 'cm', metric: 'head' },
            ].map(k => (
              <Card key={k.l} p={12}>
                <Mono size={10} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{k.l}</Mono>
                <Spacer h={4} />
                <HRow gap={3} align="baseline">
                  <div className="animate-count-in" style={{ fontFamily: FONTS.serif, fontSize: 24, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {k.v ?? '—'}
                  </div>
                  {k.v && <Mono size={11} color={T.ink300}>{k.u}</Mono>}
                </HRow>
                {k.v && <Mono size={11} color={T.brand} style={{ marginTop: 6, display: 'block' }}>{percentileLabel(k.v, k.metric, ageWeeks)} %ile</Mono>}
              </Card>
            ))}
          </div>
        )}

        {/* Metric toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <CBSegmented value={metric} onChange={setMetric}
            options={[{ id: 'weight', label: 'Weight' }, { id: 'height', label: 'Height' }, { id: 'head', label: 'Head' }]} />
        </div>

        {/* Chart */}
        <Card p={0} style={{ paddingTop: 16, paddingBottom: 12 }}>
          <HRow justify="space-between" align="baseline" style={{ padding: '0 16px 4px' }}>
            <div>
              <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>WHO Standards</Mono>
              <Spacer h={2} />
              <Display size={18} italic weight={600}>
                {points.length > 0 ? 'Tracking healthy' : 'No data yet'}
              </Display>
            </div>
          </HRow>
          {points.length > 1 ? (
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
              {[0, 1, 2, 3].map(i => {
                const y = padY + i * ((H - padY * 2) / 3);
                return <line key={i} x1={padX} y1={y} x2={W - padX} y2={y} stroke={T.line} strokeWidth="0.5" />;
              })}
              <path d={linePath} fill="none" stroke={T.brand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <circle key={i} cx={xs(i)} cy={ys(p.v)} r="4" fill={T.surface} stroke={T.brand} strokeWidth="2" />
              ))}
              {points.map((p, i) => (
                <text key={`l-${i}`} x={xs(i)} y={H - 2} textAnchor="middle" fontSize="9" fill={T.ink300}>
                  w{differenceInWeeks(new Date(p.d), new Date(child?.date_of_birth || p.d))}
                </text>
              ))}
            </svg>
          ) : (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Body size={13} color={T.ink300}>Add 2+ measurements to see chart</Body>
            </div>
          )}
          <div style={{ padding: '8px 16px 4px', display: 'flex', gap: 14 }}>
            <HRow gap={4}>
              <span style={{ width: 14, height: 2, background: T.brand, borderRadius: 2, display: 'inline-block' }} />
              <Mono size={10} color={T.ink500}>{child?.name}</Mono>
            </HRow>
          </div>
        </Card>

        <Spacer h={14} />

        {/* Dr. Bloom interpretation */}
        {latest && (
          <AIBubble lead="Dr. Bloom" sparkle>
            {latest.weight_kg
              ? `${child?.name} weighs ${latest.weight_kg} kg at ${ageWeeks} weeks — in the WHO healthy range. Keep doing what you're doing.`
              : `Log ${child?.name}'s measurements to see Dr. Bloom's growth interpretation.`
            }
          </AIBubble>
        )}

        <Spacer h={18} />

        {/* Recent measurements */}
        <SectionLabel title="Recent measurements" />
        {records.length === 0 ? (
          <Card p={20} style={{ textAlign: 'center' }}>
            <Body size={14} color={T.ink300}>No measurements yet.</Body>
            <Spacer h={10} />
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>Add first measurement</Button>
          </Card>
        ) : (
          <Card p={0}>
            {[...records].reverse().slice(0, 10).map((r, i, arr) => (
              <div key={r.id}>
                <HRow gap={10} style={{ padding: '12px 14px' }} align="center">
                  <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: T.brandWash, color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CBIcon name="scale" size={15} />
                  </div>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Body size={13} color={T.ink900} weight={600}>{format(new Date(r.record_date), 'MMM d, yyyy')}</Body>
                    <Body size={11} color={T.ink500}>
                      {[r.weight_kg && `${r.weight_kg}kg`, r.height_cm && `${r.height_cm}cm`, r.head_circumference_cm && `HC ${r.head_circumference_cm}cm`].filter(Boolean).join(' · ')}
                    </Body>
                  </Stack>
                  {i === 0 && (
                    <div style={{ padding: '3px 8px', borderRadius: 999, background: T.brandWash, color: T.brand, fontSize: 10, fontWeight: 700 }}>Latest</div>
                  )}
                </HRow>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </Card>
        )}

        <Spacer h={24} />
      </div>
    </div>
  );
}
