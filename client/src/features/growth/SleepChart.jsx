import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

function getRecommendedRange(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) return [9, 11];
  if (ageMonths < 4)  return [14, 17];
  if (ageMonths < 12) return [12, 15];
  if (ageMonths < 36) return [11, 14];
  if (ageMonths < 72) return [10, 13];
  return [9, 11];
}

function getAgeMonths(dob) {
  if (!dob) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(dob)) / (30.44 * 24 * 60 * 60 * 1000)));
}

function SleepTooltip({ active, payload, label }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const bar = payload.find((p) => p.dataKey === 'hours');
  if (!bar?.value) return null;
  return (
    <div className="bg-white rounded-xl border border-cream-200 shadow-lifted px-3 py-2.5 text-caption min-w-[130px]">
      <p className="font-semibold text-forest-700 mb-1">{label}</p>
      <p style={{ color: '#2D6A4F' }}>
        {bar.value} {t('sleep.hours')}
      </p>
    </div>
  );
}

export default function SleepChart({ childId, childDob }) {
  const { t } = useTranslation();
  const ageMonths = getAgeMonths(childDob);
  const [recMin, recMax] = getRecommendedRange(ageMonths);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['sleep-logs', childId],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('logged_date, hours_slept')
        .eq('child_id', childId)
        .gte('logged_date', since)
        .order('logged_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });

  if (isLoading) return <SkeletonCard />;
  if (!logs || logs.length === 0) return null;

  const chartData = logs.map((row) => ({
    date: format(parseISO(row.logged_date), 'MMM d'),
    hours: parseFloat(row.hours_slept),
  }));

  const avgHours =
    chartData.reduce((sum, d) => sum + d.hours, 0) / chartData.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-serif font-semibold text-forest-700">
          {t('sleep.chartTitle')}
        </h2>
        <span className="text-caption text-gray-400">
          avg {avgHours.toFixed(1)} {t('sleep.hours')}
        </span>
      </div>

      <Card className="p-3 sm:p-5">
        <p className="text-micro font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {t('sleep.hoursSlept')} · last 30 days
        </p>

        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DF" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#B0BEC5' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#B0BEC5' }}
              domain={[0, 18]}
              width={34}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip content={<SleepTooltip />} />

            {/* Recommended band */}
            <ReferenceLine
              y={recMin}
              stroke="#A8D5BA"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: t('sleep.recommended'), position: 'insideTopRight', fontSize: 9, fill: '#A8D5BA', dy: -4 }}
            />
            <ReferenceLine
              y={recMax}
              stroke="#A8D5BA"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />

            <Bar
              dataKey="hours"
              fill="#2D6A4F"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-cream-200">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#2D6A4F' }} />
            <span className="text-micro text-gray-400">{t('sleep.hoursSlept')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 border-t-2 border-dashed" style={{ borderColor: '#A8D5BA' }} />
            <span className="text-micro text-gray-400">
              {t('sleep.recommended')} ({recMin}–{recMax}h)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
