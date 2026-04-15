import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import { formatAgeInDays } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate } from '../../lib/formatters';
import { FoodIcon, PlusIcon, TrashIcon } from '../../assets/icons';
import { MEAL_TYPES } from '../../lib/constants';

export default function FoodTrackerPage() {
  const { t } = useTranslation();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [reactionAdvisory, setReactionAdvisory] = useState(null);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    meal_type: 'solid',
    food_name: '',
    quantity: '',
    notes: '',
    reaction: '',
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['food-logs', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('child_id', childId)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (record) => {
      const { error } = await supabase.from('food_logs').insert(record);
      if (error) throw error;
    },
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: ['food-logs', childId] });
      const previous = queryClient.getQueryData(['food-logs', childId]);
      queryClient.setQueryData(['food-logs', childId], (old) => [
        { ...newRecord, id: `temp-${Date.now()}`, optimistic: true },
        ...(old || []),
      ]);
      return { previous };
    },
    onError: (_err, newRecord, context) => {
      queryClient.setQueryData(['food-logs', childId], context?.previous);
    },
    onSuccess: async (_data, record) => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
      const saved = { ...formData };
      setShowForm(false);
      setFormData({ log_date: new Date().toISOString().split('T')[0], meal_type: 'solid', food_name: '', quantity: '', notes: '', reaction: '' });

      // If a reaction was noted, ask Dr. Bloom
      if (saved.reaction?.trim() && child) {
        try {
          const response = await api.post('/api/ai/ask', {
            question: `${child.name} had a reaction after eating ${saved.food_name}: "${saved.reaction}". In 1-2 warm sentences, what should I watch for or do?`,
            child_name: child.name,
            age_in_days: child.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
            gender: child.gender,
            language: localStorage.getItem('childbloom_voice_lang') || 'en',
          });
          setReactionAdvisory({ food: saved.food_name, reaction: saved.reaction, advice: response.answer });
        } catch {
          // Silently skip
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs', childId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food-logs'] }),
  });

  if (isLoading) return <SkeletonList count={4} />;

  const mealLabel = (type) => MEAL_TYPES.find((m) => m.value === type)?.label || type;

  const mealBadgeVariant = (type) => {
    const map = { breast_milk: 'info', formula: 'primary', solid: 'success', snack: 'warning' };
    return map[type] || 'default';
  };

  const grouped = (logs || []).reduce((acc, log) => {
    const date = log.log_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const pageTitle = child?.name ? t('food.title', { name: child.name }) : t('food.titleGeneric');
  const pageSubtitle = child?.name ? t('food.trackMeals', { name: child.name }) : t('food.trackMealsGeneric');
  const modalTitle = child?.name ? t('food.logMeal', { name: child.name }) : t('food.logMealGeneric');
  const emptyDesc = child?.name ? t('food.startTracking', { name: child.name }) : t('food.startTrackingGeneric');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h1 font-serif text-forest-700">{pageTitle}</h1>
          <p className="text-body text-gray-500 mt-1 truncate">{pageSubtitle}</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="flex-shrink-0">
          <PlusIcon className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('food.addMeal')}</span>
          <span className="sm:hidden">{t('common.add')}</span>
        </Button>
      </div>

      {/* Dr. Bloom reaction advisory */}
      {reactionAdvisory && (
        <Card accent="green" className="p-4 bg-forest-50/50">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-forest-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-micro font-bold text-forest-600 uppercase tracking-wider mb-1">Dr. Bloom on that reaction</p>
              <p className="text-sm text-gray-700 leading-relaxed">{reactionAdvisory.advice}</p>
            </div>
            <button onClick={() => setReactionAdvisory(null)} className="text-gray-300 hover:text-gray-500 text-lg leading-none self-start">×</button>
          </div>
        </Card>
      )}

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          title={child?.name ? `What ${child.name} eats` : 'Food tracker'}
          description={(() => {
            const months = child?.date_of_birth ? Math.floor((new Date() - new Date(child.date_of_birth)) / (30 * 24 * 60 * 60 * 1000)) : 0;
            return months < 6
              ? `At ${months} month${months !== 1 ? 's' : ''} old, every feed is building the foundation. Even logging one feed today creates a pattern over time.`
              : `${child?.name || 'Their'} nutrition story starts with one meal logged today.`;
          })()}
          actionLabel={child?.name ? `Log ${child.name}'s first meal` : 'Log first meal'}
          onAction={() => setShowForm(true)}
          icon={<FoodIcon className="w-8 h-8" />}
        />
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="space-y-2.5">
            <h3 className="text-micro font-semibold text-gray-400 uppercase tracking-wider">{formatDate(date)}</h3>
            {items.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-caption font-semibold text-forest-700">{log.food_name}</p>
                      <Badge variant={mealBadgeVariant(log.meal_type)}>{mealLabel(log.meal_type)}</Badge>
                    </div>
                    <div className="flex gap-3 text-micro text-gray-500">
                      {log.quantity && <span>{log.quantity}</span>}
                      {log.notes && <span>{log.notes}</span>}
                    </div>
                    {log.reaction && (
                      <p className="text-micro text-red-500 mt-1">{t('food.reactionLabel')}: {log.reaction}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(log.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ))
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={modalTitle}>
        <div className="space-y-4">
          <Input
            label={t('food.date')}
            type="date"
            value={formData.log_date}
            onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-caption font-semibold text-forest-700">{t('food.mealType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, meal_type: type.value })}
                  className={`py-2.5 px-3 rounded-xl text-caption font-medium border-2 transition-all duration-200 ${
                    formData.meal_type === type.value
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-cream-300 text-gray-600 hover:border-cream-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={t('food.foodName')}
            placeholder={child?.name ? `What did you give ${child.name}?` : t('food.foodPlaceholder')}
            value={formData.food_name}
            onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
          />
          <Input
            label={t('food.quantity')}
            placeholder={t('food.quantityPlaceholder')}
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
          <Input
            label={t('food.notes')}
            placeholder={t('food.notesPlaceholder')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <Input
            label={t('food.reaction')}
            placeholder={t('food.reactionPlaceholder')}
            value={formData.reaction}
            onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
          />
          <Button
            onClick={() => addMutation.mutate({
              child_id: childId,
              user_id: user.id,
              log_date: formData.log_date,
              meal_type: formData.meal_type,
              food_name: formData.food_name,
              quantity: formData.quantity || null,
              notes: formData.notes || null,
              reaction: formData.reaction || null,
            })}
            loading={addMutation.isPending}
            disabled={!formData.food_name.trim()}
            className="w-full"
          >
            {addMutation.isPending ? 'Saving...' : t('food.saveMeal')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
