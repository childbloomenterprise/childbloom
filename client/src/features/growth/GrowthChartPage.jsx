import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider,
} from '../../components/cb/primitives';
import CBSegmented from '../../components/cb/CBSegmented';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area,
} from 'recharts';
import whoHeightBoys   from '../../data/who-growth/height-for-age-boys.json';
import whoHeightGirls  from '../../data/who-growth/height-for-age-girls.json';
import whoWeightBoys   from '../../data/who-growth/weight-for-age-boys.json';
import whoWeightGirls  from '../../data/who-growth/weight-for-age-girls.json';

function getAgeMonths(dob) {
  if (!dob) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dob)) / (30.44 * 24 * 60 * 60 * 1000)));
}

function calcPercentile(value, ageMonths, whoData) {
  if (!value || !whoData?.length) return null;
  const row = whoData.reduce((best, d) =>
    Math.abs(d.month - ageMonths) < Math.abs(best.month - ageMonths) ? d : best
  );
  const pts = [
    { p: 3, v: row.p3 }, { p: 15, v: row.p15 }, { p: 25, v: row.p25 },
    { p: 50, v: row.p50 }, { p: 75, v: row.p75 }, { p: 85, v: row.p85 },
    { p: 97, v: row.p97 },
  ].filter(x => x.v != null);
  if (value <= pts[0].v) return 3;
  if (value >= pts[pts.length - 1].v) return 97;
  for (let i = 0; i < pts.length - 1; i++) {
    if (value >= pts[i].v && value <= pts[i + 1].v) {
      const t = (value - pts[i].v) / (pts[i + 1].v - pts[i].v);
      return Math.round(pts[i].p + t * (pts[i + 1].p - pts[i].p));
    }
  }
  return 50;
}

function percentileInfo(p) {
  if (p <= 5)  return { color: '#E76F51', bg: 'rgba(231,111,81,0.06)', label: 'Needs attention',    advice: 'Below the 5th percentile — worth discussing at your next paediatrician visit.' };
  if (p <= 15) return { color: '#F4A261', bg: 'rgba(244,162,97,0.06)', label: 'Below average',       advice: 'Growing but on the lower end. Keep tracking every month.' };
  if (p <= 85) return { color: T.brand,   bg: T.brandWash,             label: 'Healthy range',       advice: 'Right on track with WHO standards. Keep going!' };
  if (p <= 95) return { color: '#2D9CDB', bg: 'rgba(45,156,219,0.06)', label: 'Above average',       advice: 'Growing beautifully — well above the median for their age.' };
  return         { color: '#2D9CDB', bg: 'rgba(45,156,219,0.06)', label: 'Exceptionally large',      advice: 'Above the 95th percentile. Worth a quick check with your doctor.' };
}

function buildChartData(records, whoData, dob, field) {
  const ageMonths = getAgeMonths(dob);
  const maxMonth  = Math.min(60, Math.max(ageMonths + 3, 12));

  const childByMonth = {};
  (records || []).forEach(r => {
    const val = parseFloat(r[field]);
    if (!val || !dob) return;
    const m = Math.round((new Date(r.record_date) - new Date(dob)) / (30.44 * 24 * 60 * 60 * 1000));
    if (m >= 0 && m <= 60) childByMonth[m] = val;
  });

  return whoData
    .filter(d => d.month <= maxMonth)
    .map(d => ({
      month:     d.month,
      outerBand: [d.p3,  d.p97],
      innerBand: [d.p15, d.p85],
      p50:       d.p50,
      child:     childByMonth[d.month] ?? null,
    }));
}

function PercentileGauge({ percentile, info }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentile), 250);
    return () => clearTimeout(t);
  }, [percentile]);

  const ordinal = percentile === 3 ? '≤3rd' : percentile === 97 ? '≥97th'
    : `${percentile}${percentile === 1 ? 'st' : percentile === 2 ? 'nd' : percentile === 3 ? 'rd' : 'th'}`;

  return (
    <Stack gap={8}>
      <HRow justify="space-between" align="flex-end">
        <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>WHO Percentile</Mono>
        <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontStyle: 'italic', color: info.color, lineHeight: 1 }}>{ordinal}</div>
      </HRow>
      <div style={{ height: 10, background: T.line, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: info.color, width: `${width}%`, transition: 'width 1s ease-out' }} />
      </div>
      <HRow justify="space-between">
        {['3rd', '25th', '50th', '75th', '97th'].map(l => (
          <Mono key={l} size={10} color={T.ink300}>{l}</Mono>
        ))}
      </HRow>
      <Body size={12} color={T.ink500} lh={1.5}>{info.advice}</Body>
    </Stack>
  );
}

function AnimatedBar({ label, value, maxValue, color, unit, delay = 0, isChild }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(Math.min(100, (value / maxValue) * 100)), 300 + delay);
    return () => clearTimeout(t);
  }, [value, maxValue, delay]);

  return (
    <Stack gap={12} align="center">
      <Body size={12} color={isChild ? color : T.ink400} weight={isChild ? 600 : 400}>{label}</Body>
      <div style={{ position: 'relative', width: 52, height: 160, borderRadius: RADIUS.lg, overflow: 'hidden', background: T.line }}>
        <div style={{
          position: 'absolute', bottom: 0, width: '100%', borderRadius: RADIUS.lg,
          height: `${pct}%`, transition: `height 1s ease-out ${delay}ms`,
          background: isChild ? `linear-gradient(to top, ${color}, ${color}cc)` : 'linear-gradient(to top, #8FBAC8, #8FBAC8aa)',
        }} />
        <div style={{ position: 'absolute', width: '100%', borderTop: '1px dashed rgba(255,255,255,0.4)', top: '50%' }} />
      </div>
      <Stack gap={2} align="center">
        <Body size={12} color={isChild ? color : '#8FBAC8'} weight={700}>{value?.toFixed(1)}{unit}</Body>
        {isChild && <Mono size={10} color={T.ink400}>your child</Mono>}
      </Stack>
    </Stack>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const child = payload.find(p => p.dataKey === 'child');
  const p50   = payload.find(p => p.dataKey === 'p50');
  if (!child?.value && !p50?.value) return null;
  return (
    <Card p={12} style={{ minWidth: 130 }}>
      <Body size={12} color={T.brand} weight={600} style={{ marginBottom: 6 }}>
        {label < 24 ? `${label} month${label !== 1 ? 's' : ''}` : `${(label / 12).toFixed(1)} yrs`}
      </Body>
      {child?.value != null && <Body size={12} color={T.brand}>Child <strong>{child.value.toFixed(1)}{unit}</strong></Body>}
      {p50?.value != null && <Body size={12} color={T.ink400}>Median {p50.value.toFixed(1)}{unit}</Body>}
    </Card>
  );
}

export default function GrowthChartPage() {
  const { id: childId } = useParams();
  const navigate = useNavigate();
  const { data: child } = useChildById(childId);
  const [activeTab, setActiveTab] = useState('height');

  const { data: records, isLoading } = useQuery({
    queryKey: ['growth-records', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_records').select('*')
        .eq('child_id', childId)
        .order('record_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ height: 200, background: T.line, borderRadius: RADIUS.lg, opacity: 0.4 }} />
    </div>
  );

  const gender    = child?.gender === 'female' ? 'female' : 'male';
  const whoHeight = gender === 'female' ? whoHeightGirls : whoHeightBoys;
  const whoWeight = gender === 'female' ? whoWeightGirls : whoWeightBoys;
  const whoData   = activeTab === 'height' ? whoHeight : whoWeight;
  const isHeight  = activeTab === 'height';
  const unit      = isHeight ? ' cm' : ' kg';
  const field     = isHeight ? 'height_cm' : 'weight_kg';

  const ageMonths = getAgeMonths(child?.date_of_birth);
  const ageLabel  = ageMonths < 24
    ? `${ageMonths} month${ageMonths !== 1 ? 's' : ''} old`
    : `${(ageMonths / 12).toFixed(1)} years old`;

  const latest      = [...(records || [])].reverse().find(r => r[field]);
  const latestValue = latest ? parseFloat(latest[field]) : null;
  const percentile  = latestValue ? calcPercentile(latestValue, ageMonths, whoData) : null;
  const info        = percentile ? percentileInfo(percentile) : null;

  const p50AtAge = (() => {
    const capped = Math.min(60, ageMonths);
    const row = whoData.reduce((best, d) =>
      Math.abs(d.month - capped) < Math.abs(best.month - capped) ? d : best, whoData[0]);
    return row?.p50 ?? null;
  })();

  const chartData = buildChartData(records, whoData, child?.date_of_birth, field);
  const hasData   = (records || []).some(r => r[field]);
  const maxBar    = p50AtAge ? p50AtAge * 1.18 : (isHeight ? 120 : 20);

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, padding: '0 0 24px' }}>
      <div style={{ padding: '16px 20px 0' }}>
        <Eyebrow color={T.brand}>Development Index</Eyebrow>
        <Spacer h={4} />
        <Display size={30} italic weight={600}>
          {child?.name ? `${child.name}'s Growth` : 'Growth Charts'}
        </Display>
        <Spacer h={4} />
        <Body size={13} color={T.ink400}>{ageLabel} · WHO growth standards · 0–60 months</Body>
      </div>

      <Spacer h={20} />

      <div style={{ padding: '0 16px' }}>

        {/* Percentile summary card */}
        {percentile && info ? (
          <Card p={20} style={{ background: info.bg }}>
            <HRow justify="space-between" gap={16} align="flex-start" style={{ marginBottom: 20 }}>
              <Stack gap={4}>
                <Mono size={11} color={info.color} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isHeight ? 'Height' : 'Weight'} · {info.label}
                </Mono>
                <Body size={13} color={T.ink500}>
                  Latest: <strong style={{ color: T.brand }}>{latestValue?.toFixed(1)}{unit}</strong>
                </Body>
              </Stack>
              <div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 48, fontStyle: 'italic', color: info.color, lineHeight: 1 }}>{percentile}</div>
                <Body size={16} color={T.ink300}>th</Body>
              </div>
            </HRow>
            <PercentileGauge percentile={percentile} info={info} />
          </Card>
        ) : (
          <Card p={20}>
            <Body size={13} color={T.ink400} style={{ textAlign: 'center' }}>
              No measurements logged yet.{' '}
              <button onClick={() => navigate(`/child/${childId}/growth`)}
                style={{ color: T.brand, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: FONTS.sans }}>
                Log one now →
              </button>
            </Body>
          </Card>
        )}

        <Spacer h={20} />

        {/* Tab toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CBSegmented value={activeTab} onChange={setActiveTab}
            options={[{ id: 'height', label: 'Height' }, { id: 'weight', label: 'Weight' }]} />
        </div>

        <Spacer h={16} />

        {/* WHO Chart */}
        {hasData ? (
          <Card p={12}>
            <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 16 }}>
              WHO {isHeight ? 'Height' : 'Weight'}-for-Age Percentile Bands
            </Mono>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.line} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.ink300 }}
                  tickFormatter={v => v < 24 ? `${v}m` : `${v / 12}y`} />
                <YAxis tick={{ fontSize: 10, fill: T.ink300 }} domain={['auto', 'auto']} width={34} />
                <Tooltip content={<ChartTooltip unit={unit} />} />
                <Area type="monotone" dataKey="outerBand" stroke="none" fill={T.brandWash} fillOpacity={0.9} isAnimationActive={false} />
                <Area type="monotone" dataKey="innerBand" stroke="none" fill={T.brandSoft} fillOpacity={0.5} isAnimationActive={false} />
                <Line type="monotone" dataKey="p50" stroke={T.brandSoft} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="child" stroke={T.brand} strokeWidth={2.5}
                  dot={{ fill: T.brand, r: 4, strokeWidth: 2.5, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#fff', stroke: T.brand, strokeWidth: 2 }}
                  connectNulls={false} isAnimationActive animationDuration={1400} animationEasing="ease-out" />
                {ageMonths > 0 && ageMonths <= 60 && (
                  <ReferenceLine
                    x={chartData.reduce((best, d) =>
                      Math.abs(d.month - ageMonths) < Math.abs(best - ageMonths) ? d.month : best,
                      chartData[0]?.month ?? 0
                    )}
                    stroke={T.accent} strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: 'Now', position: 'insideTopRight', fontSize: 10, fill: T.accent, dy: -2 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 16, paddingTop: 12, borderTop: `0.5px solid ${T.line}` }}>
              {[
                { bg: T.brandWash, label: '3rd–97th percentile' },
                { bg: T.brandSoft, label: '15th–85th percentile' },
                { line: T.brandSoft, dashed: true, label: 'Median (50th)' },
                { line: T.brand, label: child?.name || 'Child' },
              ].map((item, i) => (
                <HRow key={i} gap={6} align="center">
                  {item.bg && <div style={{ width: 16, height: 12, borderRadius: 3, background: item.bg }} />}
                  {item.line && (
                    <div style={{ width: 20, borderTop: `${item.dashed ? '1.5px dashed' : '2.5px solid'} ${item.line}` }} />
                  )}
                  <Mono size={10} color={T.ink400}>{item.label}</Mono>
                </HRow>
              ))}
            </div>
          </Card>
        ) : (
          <Card p={20} style={{ textAlign: 'center' }}>
            <Body size={13} color={T.ink400} style={{ marginBottom: 12 }}>
              No {isHeight ? 'height' : 'weight'} data yet.<br />
              Log measurements from the Growth page to see their curve.
            </Body>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/child/${childId}/growth`)}>
              Go to Growth page
            </Button>
          </Card>
        )}

        {/* Comparison bars */}
        {latestValue && p50AtAge && (
          <>
            <Spacer h={16} />
            <Card p={20}>
              <Mono size={11} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 24 }}>
                {isHeight ? 'Height' : 'Weight'} at {ageLabel} vs. WHO Median
              </Mono>
              <HRow gap={48} justify="center" align="flex-end">
                <AnimatedBar label={child?.name || 'Child'} value={latestValue} maxValue={maxBar}
                  color={T.brand} unit={unit} delay={0} isChild />
                <AnimatedBar label="WHO median" value={p50AtAge} maxValue={maxBar}
                  color="#8FBAC8" unit={unit} delay={200} isChild={false} />
              </HRow>
              {(() => {
                const diff = latestValue - p50AtAge;
                const absDiff = Math.abs(diff).toFixed(1);
                if (Math.abs(diff) < 0.5) return null;
                return (
                  <>
                    <Spacer h={20} />
                    <Body size={13} color={T.ink400} style={{ textAlign: 'center' }}>
                      {child?.name || 'Your child'} is{' '}
                      <strong style={{ color: info?.color }}>{absDiff}{unit} {diff > 0 ? 'above' : 'below'}</strong>{' '}
                      the median for their age.
                    </Body>
                  </>
                );
              })()}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
