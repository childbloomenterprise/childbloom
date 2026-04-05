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
    mutationFn: async () => {
      const { error } = await supabase.from('food_logs').insert({
        child_id: childId,
        user_id: user.id,
        log_date: formData.log_date,
        meal_type: formData.meal_type,
        food_name: formData.food_name,
        quantity: formData.quantity || null,
        notes: formData.notes || null,
        reaction: formData.reaction || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
      setShowForm(false);
      setFormData({ log_date: new Date().toISOString().split('T')[0], meal_type: 'solid', food_name: '', quantity: '', notes: '', reaction: '' });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h1 font-serif text-forest-700">{t('food.title')}</h1>
          <p className="text-body text-gray-500 mt-1 truncate">{t('food.trackMeals', { name: child?.name || 'your child' })}</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="flex-shrink-0">
          <PlusIcon className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">{t('food.addMeal')}</span><span className="sm:hidden">{t('common.add')}</span>
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          title={t('food.noLogs')}
          description={t('food.startTracking')}
          actionLabel={t('food.logMeal')}
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('food.logMeal')}>
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
            placeholder={t('food.foodPlaceholder')}
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
            onClick={() => addMutation.mutate()}
            loading={addMutation.isPending}
            disabled={!formData.food_name.trim()}
            className="w-full"
          >
            {t('food.saveMeal')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
