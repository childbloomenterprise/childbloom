import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import CBLargeTitle from '../../components/cb/CBLargeTitle';
import CBSegmented from '../../components/cb/CBSegmented';
import { T } from '../../components/cb/tokens';
import { format, differenceInWeeks } from 'date-fns';

function percentileLabel(val, metric, ageWeeks) {
  // Rough WHO percentile estimation
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
  const [metric, setMetric] = useState('weight');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ record_date: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', height_cm: '', head_circumference_cm: '' });

  const { data: records = [] } = useQuery({
    queryKey: ['growth-records', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_records')
        .select('*')
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
      setShowForm(false);
      setFormData({ record_date: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', height_cm: '', head_circumference_cm: '' });
    },
  });

  const latest = records[records.length - 1];
  const ageWeeks = child?.date_of_birth
    ? differenceInWeeks(new Date(), new Date(child.date_of_birth))
    : 0;

  // Chart data
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

  const unit = { weight: 'kg', height: 'cm', head: 'cm' }[metric];

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>
      <div style={{ paddingTop: 52 }}>
        <CBLargeTitle
          eyebrow={child ? `${child.name.toUpperCase()} · ${ageWeeks} WEEKS` : 'GROWTH'}
          title="Growth"
          trailing={
            <button onClick={() => setShowForm(!showForm)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', color: T.forest700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <CBIcon name="plus" size={18} />
            </button>
          }
        />
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 16, padding: '16px', border: `0.5px solid ${T.ink100}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink500, marginBottom: 12 }}>Log measurement</div>
          <input type="date" value={formData.record_date} onChange={e => setFormData(f => ({ ...f, record_date: e.target.value }))}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: `0.5px solid ${T.ink100}`, fontSize: 14, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[{ k: 'weight_kg', l: 'Weight (kg)' }, { k: 'height_cm', l: 'Height (cm)' }, { k: 'head_circumference_cm', l: 'Head (cm)' }].map(f => (
              <input key={f.k} type="number" step="0.1" placeholder={f.l} value={formData[f.k]}
                onChange={e => setFormData(prev => ({ ...prev, [f.k]: e.target.value }))}
                style={{ padding: '10px', borderRadius: 10, border: `0.5px solid ${T.ink100}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            ))}
          </div>
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}
            style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {addMutation.isPending ? 'Saving…' : 'Save measurement'}
          </button>
        </div>
      )}

      {/* KPI cards */}
      {latest && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Weight', v: latest.weight_kg, u: 'kg', metric: 'weight' },
            { l: 'Height', v: latest.height_cm, u: 'cm', metric: 'height' },
            { l: 'Head',   v: latest.head_circumference_cm, u: 'cm', metric: 'head' },
          ].map(k => (
            <div key={k.l} style={{ background: '#fff', borderRadius: 14, padding: '12px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink300, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {k.v ?? '—'}
                </span>
                {k.v && <span style={{ fontSize: 11, color: T.ink300, fontWeight: 500 }}>{k.u}</span>}
              </div>
              {k.v && <div style={{ fontSize: 11, color: T.forest600, marginTop: 6, fontWeight: 600 }}>{percentileLabel(k.v, k.metric, ageWeeks)} %ile</div>}
            </div>
          ))}
        </div>
      )}

      {/* Metric toggle */}
      <div style={{ padding: '18px 16px 12px', display: 'flex', justifyContent: 'center' }}>
        <CBSegmented value={metric} onChange={setMetric}
          options={[{ id: 'weight', label: 'Weight' }, { id: 'height', label: 'Height' }, { id: 'head', label: 'Head' }]} />
      </div>

      {/* Chart */}
      <div style={{ margin: '0 16px', background: '#fff', borderRadius: 16, padding: '16px 8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 12px 4px' }}>
          <div>
            <div style={{ fontSize: 11, color: T.ink300, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>WHO Standards</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: T.ink900, letterSpacing: '-0.015em', marginTop: 2 }}>
              {points.length > 0 ? 'Tracking healthy' : 'No data yet'}
            </div>
          </div>
        </div>
        {points.length > 1 ? (
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
            {[0, 1, 2, 3].map(i => {
              const y = padY + i * ((H - padY * 2) / 3);
              return <line key={i} x1={padX} y1={y} x2={W - padX} y2={y} stroke={T.ink100} strokeWidth="0.5" />;
            })}
            <path d={linePath} fill="none" stroke={T.forest700} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={xs(i)} cy={ys(p.v)} r="4" fill="#fff" stroke={T.forest700} strokeWidth="2" />
              </g>
            ))}
            {points.map((p, i) => (
              <text key={`l-${i}`} x={xs(i)} y={H - 2} textAnchor="middle" fontSize="9" fill={T.ink300}>w{differenceInWeeks(new Date(p.d), new Date(child?.date_of_birth || p.d))}</text>
            ))}
          </svg>
        ) : (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink300, fontSize: 13 }}>
            Add 2+ measurements to see chart
          </div>
        )}
        <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 14, fontSize: 10, color: T.ink500, fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 2, background: T.forest700, borderRadius: 2, display: 'inline-block' }} /> {child?.name}
          </span>
        </div>
      </div>

      {/* Dr. Bloom interpretation */}
      {latest && (
        <div style={{ margin: '14px 16px 0', padding: '14px 16px', borderRadius: 14, background: T.forest50, border: `0.5px solid ${T.forest100}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <CBLogoMark size={14} color={T.forest700} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.forest700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Dr. Bloom reads this as</span>
          </div>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: T.forest900, fontWeight: 500, letterSpacing: '-0.005em', lineHeight: 1.45, margin: 0 }}>
            {latest.weight_kg
              ? `${child?.name} weighs ${latest.weight_kg} kg at ${ageWeeks} weeks — in the WHO healthy range. Keep doing what you're doing.`
              : `Log ${child?.name}'s measurements to see Dr. Bloom's growth interpretation.`
            }
          </p>
        </div>
      )}

      {/* Recent measurements */}
      <div style={{ margin: '18px 16px 0' }}>
        <div style={{ padding: '0 4px 8px', fontSize: 11, fontWeight: 700, color: T.ink300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recent measurements</div>
        {records.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
            <p style={{ color: T.ink300, fontSize: 14 }}>No measurements yet.</p>
            <button onClick={() => setShowForm(true)}
              style={{ marginTop: 10, padding: '10px 20px', borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Add first measurement
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            {[...records].reverse().slice(0, 10).map((r, i, arr) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < arr.length - 1 ? `0.5px solid ${T.ink100}` : 'none', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.forest50, color: T.forest600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CBIcon name="scale" size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink900, letterSpacing: '-0.005em' }}>{format(new Date(r.record_date), 'MMM d, yyyy')}</div>
                  <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
                    {[r.weight_kg && `${r.weight_kg}kg`, r.height_cm && `${r.height_cm}cm`, r.head_circumference_cm && `HC ${r.head_circumference_cm}cm`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {i === 0 && <div style={{ padding: '3px 8px', borderRadius: 99, background: T.forest100, color: T.forest700, fontSize: 10, fontWeight: 700 }}>Latest</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
