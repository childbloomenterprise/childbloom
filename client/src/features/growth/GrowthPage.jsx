import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate, formatWeight, formatHeight } from '../../lib/formatters';
import { GrowthIcon, PlusIcon } from '../../assets/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import whoWeightBoys from '../../data/who-growth/weight-for-age-boys.json';
import whoWeightGirls from '../../data/who-growth/weight-for-age-girls.json';
import whoHeightBoys from '../../data/who-growth/height-for-age-boys.json';
import whoHeightGirls from '../../data/who-growth/height-for-age-girls.json';

export default function GrowthPage() {
  const { t } = useTranslation();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('weight');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ record_date: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', head_circumference_cm: '' });

  const TABS = [
    { value: 'weight', label: t('growth.weight') },
    { value: 'height', label: t('growth.height') },
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

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('growth_records').insert({
        child_id: childId,
        user_id: user.id,
        record_date: formData.record_date,
        weight_kg: formData.weight_kg || null,
        height_cm: formData.height_cm || null,
        head_circumference_cm: formData.head_circumference_cm || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-records'] });
      setShowForm(false);
      setFormData({ record_date: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', head_circumference_cm: '' });
    },
  });

  const gender = child?.gender || 'male';
  const whoWeight = gender === 'female' ? whoWeightGirls : whoWeightBoys;
  const whoHeight = gender === 'female' ? whoHeightGirls : whoHeightBoys;

  const chartData = (records || []).map((r, i) => ({
    name: formatDate(r.record_date),
    month: i,
    weight: r.weight_kg ? parseFloat(r.weight_kg) : null,
    height: r.height_cm ? parseFloat(r.height_cm) : null,
  }));

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h1 font-serif text-forest-700">{t('growth.title')}</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="flex-shrink-0">
          <PlusIcon className="w-4 h-4 mr-1" /> {t('growth.add')}
        </Button>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {chartData.length > 0 ? (
        <Card className="p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B9DAF' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#8B9DAF' }} domain={['auto', 'auto']} width={35} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E8E4DF', fontSize: '12px', padding: '8px 12px', backgroundColor: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey={activeTab}
                stroke="#2D6A4F"
                strokeWidth={2.5}
                dot={{ fill: '#2D6A4F', r: 3.5, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#E9F5EF', fill: '#2D6A4F' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <EmptyState
          title={t('growth.noData')}
          description={t('growth.addFirst')}
          actionLabel={t('growth.addMeasurement')}
          onAction={() => setShowForm(true)}
          icon={<GrowthIcon className="w-8 h-8" />}
        />
      )}

      {records && records.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-caption min-w-[320px]">
              <thead>
                <tr className="border-b border-cream-300/60">
                  <th className="text-left p-3 sm:p-4 font-semibold text-gray-400 text-micro uppercase tracking-wider">{t('growth.date')}</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-gray-400 text-micro uppercase tracking-wider">{t('growth.weight')}</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-gray-400 text-micro uppercase tracking-wider">{t('growth.height')}</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-gray-400 text-micro uppercase tracking-wider">{t('growth.head')}</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-cream-200/60">
                    <td className="p-3 sm:p-4 text-forest-700 font-medium whitespace-nowrap">{formatDate(r.record_date)}</td>
                    <td className="p-3 sm:p-4 text-gray-600">{formatWeight(r.weight_kg)}</td>
                    <td className="p-3 sm:p-4 text-gray-600">{formatHeight(r.height_cm)}</td>
                    <td className="p-3 sm:p-4 text-gray-600">{r.head_circumference_cm ? `${r.head_circumference_cm} cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('growth.addMeasurement')}>
        <div className="space-y-4">
          <Input
            label={t('growth.date')}
            type="date"
            value={formData.record_date}
            onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
          />
          <Input
            label={t('growth.weightKg')}
            type="number"
            step="0.1"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
            placeholder="e.g. 7.5"
          />
          <Input
            label={t('growth.heightCm')}
            type="number"
            step="0.1"
            value={formData.height_cm}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
            placeholder="e.g. 68.0"
          />
          <Input
            label={t('growth.headCm')}
            type="number"
            step="0.1"
            value={formData.head_circumference_cm}
            onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value })}
            placeholder="e.g. 43.0"
          />
          <Button
            onClick={() => addMutation.mutate()}
            loading={addMutation.isPending}
            className="w-full"
          >
            {t('growth.saveMeasurement')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
