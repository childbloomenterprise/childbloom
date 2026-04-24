import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate } from '../../lib/formatters';
import { GrowthIcon } from '../../assets/icons';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area,
} from 'recharts';
import whoHeightBoys   from '../../data/who-growth/height-for-age-boys.json';
import whoHeightGirls  from '../../data/who-growth/height-for-age-girls.json';
import whoWeightBoys   from '../../data/who-growth/weight-for-age-boys.json';
import whoWeightGirls  from '../../data/who-growth/weight-for-age-girls.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (p <= 5)  return { color: '#E76F51', bg: '#FFF3EF', label: 'Needs attention',    advice: 'Below the 5th percentile — worth discussing at your next paediatrician visit.' };
  if (p <= 15) return { color: '#F4A261', bg: '#FFF8F2', label: 'Below average',       advice: 'Growing but on the lower end. Keep tracking every month.' };
  if (p <= 85) return { color: '#285C2A', bg: '#F2F8F2', label: 'Healthy range',       advice: 'Right on track with WHO standards. Keep going!' };
  if (p <= 95) return { color: '#2D9CDB', bg: '#EEF7FD', label: 'Above average',       advice: 'Growing beautifully — well above the median for their age.' };
  return         { color: '#2D9CDB', bg: '#EEF7FD', label: 'Exceptionally large',      advice: 'Above the 95th percentile. Worth a quick check with your doctor.' };
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
      month:      d.month,
      outerBand:  [d.p3,  d.p97],
      innerBand:  [d.p15, d.p85],
      p50:        d.p50,
      child:      childByMonth[d.month] ?? null,
    }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PercentileGauge({ percentile, info }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentile), 250);
    return () => clearTimeout(t);
  }, [percentile]);

  const ordinal = percentile === 3 ? '≤3rd' : percentile === 97 ? '≥97th'
    : `${percentile}${percentile === 1 ? 'st' : percentile === 2 ? 'nd' : percentile === 3 ? 'rd' : 'th'}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-micro font-semibold text-gray-400 uppercase tracking-wider">WHO Percentile</span>
        <span className="font-bold text-3xl leading-none" style={{ color: info.color }}>
          {ordinal}
        </span>
      </div>
      <div className="relative h-2.5 bg-cream-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: info.color }}
        />
      </div>
      <div className="flex justify-between text-micro text-gray-300 select-none">
        <span>3rd</span><span>25th</span><span>50th</span><span>75th</span><span>97th</span>
      </div>
      <p className="text-caption text-gray-500 pt-1">{info.advice}</p>
    </div>
  );
}

function AnimatedBar({ label, value, maxValue, color, unit, delay = 0, isChild }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(Math.min(100, (value / maxValue) * 100)), 300 + delay);
    return () => clearTimeout(t);
  }, [value, maxValue, delay]);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-caption font-semibold" style={{ color: isChild ? color : '#8B9DAF' }}>
        {label}
      </span>
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ width: 52, height: 160, background: '#EDE8DF' }}
      >
        <div
          className="absolute bottom-0 w-full rounded-2xl transition-all duration-1000 ease-out"
          style={{
            height: `${pct}%`,
            background: isChild
              ? `linear-gradient(to top, ${color}, ${color}cc)`
              : 'linear-gradient(to top, #8FBAC8, #8FBAC8aa)',
            transitionDelay: `${delay}ms`,
          }}
        />
        {/* Tick mark at 50% */}
        <div className="absolute w-full border-t border-dashed border-white/40" style={{ top: '50%' }} />
      </div>
      <div className="text-center">
        <p className="font-bold text-caption" style={{ color: isChild ? color : '#8FBAC8' }}>
          {value?.toFixed(1)}{unit}
        </p>
        {isChild && (
          <p className="text-micro text-gray-400">your child</p>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const child = payload.find(p => p.dataKey === 'child');
  const p50   = payload.find(p => p.dataKey === 'p50');
  if (!child?.value && !p50?.value) return null;
  return (
    <div className="bg-white rounded-xl border border-cream-200 shadow-lifted px-3 py-2.5 text-caption min-w-[130px]">
      <p className="font-semibold text-forest-700 mb-1.5">
        {label < 24 ? `${label} month${label !== 1 ? 's' : ''}` : `${(label / 12).toFixed(1)} yrs`}
      </p>
      {child?.value != null && (
        <p style={{ color: '#285C2A' }}>
          Child <b>{child.value.toFixed(1)}{unit}</b>
        </p>
      )}
      {p50?.value != null && (
        <p className="text-gray-400">Median {p50.value.toFixed(1)}{unit}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GrowthChartPage() {
  const { id: childId } = useParams();
  const navigate        = useNavigate();
  const { data: child } = useChildById(childId);
  const [activeTab, setActiveTab] = useState('height');

  const TABS = [
    { value: 'height', label: 'Height' },
    { value: 'weight', label: 'Weight' },
  ];

  const { data: records, isLoading } = useQuery({
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
  });

  if (isLoading) return <SkeletonCard />;

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

  // Latest measurement with the relevant field filled
  const latest      = [...(records || [])].reverse().find(r => r[field]);
  const latestValue = latest ? parseFloat(latest[field]) : null;
  const percentile  = latestValue ? calcPercentile(latestValue, ageMonths, whoData) : null;
  const info        = percentile   ? percentileInfo(percentile)                      : null;

  // Median for child's age (for animated comparison bar)
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
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <p className="text-micro font-bold text-forest-600 uppercase tracking-wider mb-1">Development Index</p>
        <h1 className="text-h1 font-serif text-forest-700">
          {child?.name ? `${child.name}'s Growth` : 'Growth Charts'}
        </h1>
        <p className="text-body text-gray-400 mt-1">
          {ageLabel} · WHO growth standards · 0–60 months
        </p>
      </div>

      {/* ── Percentile summary card ── */}
      {percentile && info ? (
        <Card className="p-5" style={{ background: info.bg }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-micro font-bold uppercase tracking-wider mb-1" style={{ color: info.color }}>
                {isHeight ? 'Height' : 'Weight'} · {info.label}
              </p>
              <p className="text-caption text-gray-500">
                Latest: <b className="text-forest-700">{latestValue?.toFixed(1)}{unit}</b>
                {latest?.record_date && <span className="ml-1 text-gray-400">· {formatDate(latest.record_date)}</span>}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="font-bold leading-none" style={{ fontSize: 48, color: info.color, lineHeight: 1 }}>
                {percentile}
              </span>
              <span className="text-lg text-gray-300">th</span>
            </div>
          </div>
          <PercentileGauge percentile={percentile} info={info} />
        </Card>
      ) : (
        <Card className="p-5 bg-cream-50">
          <p className="text-caption text-gray-400 text-center">
            No measurements logged yet.{' '}
            <button
              className="text-forest-600 underline font-medium"
              onClick={() => navigate(`/child/${childId}/growth`)}
            >
              Log one now →
            </button>
          </p>
        </Card>
      )}

      {/* ── Tabs ── */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── WHO Chart ── */}
      {hasData ? (
        <Card className="p-3 sm:p-5">
          <p className="text-micro font-semibold text-gray-400 uppercase tracking-wider mb-4">
            WHO {isHeight ? 'Height' : 'Weight'}-for-Age Percentile Bands
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DF" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#B0BEC5' }}
                tickFormatter={v => v < 24 ? `${v}m` : `${v / 12}y`}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#B0BEC5' }}
                domain={['auto', 'auto']}
                width={34}
              />
              <Tooltip content={<ChartTooltip unit={unit} />} />

              {/* Outer band: p3–p97 */}
              <Area
                type="monotone"
                dataKey="outerBand"
                stroke="none"
                fill="#D5EDD5"
                fillOpacity={0.7}
                isAnimationActive={false}
              />
              {/* Inner band: p15–p85 */}
              <Area
                type="monotone"
                dataKey="innerBand"
                stroke="none"
                fill="#AADCAA"
                fillOpacity={0.6}
                isAnimationActive={false}
              />
              {/* Median p50 */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#5A9C5A"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
              {/* Child's line */}
              <Line
                type="monotone"
                dataKey="child"
                stroke="#285C2A"
                strokeWidth={2.5}
                dot={{ fill: '#285C2A', r: 4, strokeWidth: 2.5, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#fff', stroke: '#285C2A', strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive
                animationDuration={1400}
                animationEasing="ease-out"
              />
              {/* "Now" reference line */}
              {ageMonths > 0 && ageMonths <= 60 && (
                <ReferenceLine
                  x={chartData.reduce((best, d) =>
                    Math.abs(d.month - ageMonths) < Math.abs(best - ageMonths) ? d.month : best,
                    chartData[0]?.month ?? 0
                  )}
                  stroke="#8FBAC8"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: 'Now', position: 'insideTopRight', fontSize: 10, fill: '#8FBAC8', dy: -2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-4 pt-3 border-t border-cream-200">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ background: '#D5EDD5' }} />
              <span className="text-micro text-gray-400">3rd–97th percentile</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ background: '#AADCAA' }} />
              <span className="text-micro text-gray-400">15th–85th percentile</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-dashed" style={{ borderColor: '#5A9C5A' }} />
              <span className="text-micro text-gray-400">Median (50th)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-[2.5px]" style={{ borderColor: '#285C2A' }} />
              <span className="text-micro text-gray-400">{child?.name || 'Child'}</span>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title={`No ${isHeight ? 'height' : 'weight'} data yet`}
          description={`Log ${child?.name || "your child"}'s measurements from the Growth page to see their curve against WHO standards.`}
          actionLabel="Go to Growth page"
          onAction={() => navigate(`/child/${childId}/growth`)}
          icon={<GrowthIcon className="w-8 h-8" />}
        />
      )}

      {/* ── Animated comparison bars ── */}
      {latestValue && p50AtAge && (
        <Card className="p-5">
          <p className="text-micro font-semibold text-gray-400 uppercase tracking-wider mb-6">
            {isHeight ? 'Height' : 'Weight'} at {ageLabel} vs. WHO Median
          </p>
          <div className="flex items-end justify-center gap-12">
            <AnimatedBar
              label={child?.name || 'Child'}
              value={latestValue}
              maxValue={maxBar}
              color="#285C2A"
              unit={unit}
              delay={0}
              isChild
            />
            <AnimatedBar
              label="WHO median"
              value={p50AtAge}
              maxValue={maxBar}
              color="#8FBAC8"
              unit={unit}
              delay={200}
              isChild={false}
            />
          </div>

          {/* Difference callout */}
          {(() => {
            const diff = latestValue - p50AtAge;
            const absDiff = Math.abs(diff).toFixed(1);
            if (Math.abs(diff) < 0.5) return null;
            return (
              <p className="text-caption text-center text-gray-400 mt-5">
                {child?.name || 'Your child'} is{' '}
                <span className="font-semibold" style={{ color: info?.color }}>
                  {absDiff}{unit} {diff > 0 ? 'above' : 'below'}
                </span>{' '}
                the median for their age.
              </p>
            );
          })()}
        </Card>
      )}
    </div>
  );
}
