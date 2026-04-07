import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import { formatAgeInDays } from '../../lib/formatters';
import Stepper from '../../components/ui/Stepper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import MeasurementsStep from './steps/MeasurementsStep';
import MoodStep from './steps/MoodStep';
import MilestonesStep from './steps/MilestonesStep';
import FeedingStep from './steps/FeedingStep';
import ConcernsStep from './steps/ConcernsStep';
import AiInsightStep from './steps/AiInsightStep';

export default function WeeklyUpdatePage() {
  const { t } = useTranslation();
  const { id: childId } = useParams();
  const navigate = useNavigate();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [aiInsight, setAiInsight] = useState('');
  const [voiceLang, setVoiceLang] = useState(
    () => localStorage.getItem('childbloom_voice_lang') || 'en'
  );
  const [formData, setFormData] = useState({
    height_cm: '',
    weight_kg: '',
    mood: '',
    sleep_hours: 10,
    sleep_quality: 'okay',
    motor_milestone: '',
    new_skills: '',
    milestones_checked: [],
    feeding_type: '',
    breastfeed_times: '',
    solid_foods: '',
    food_reactions: '',
    water_intake: '',
    concerns: '',
    red_flags: [],
  });

  const STEPS = [
    t('weeklyUpdate.measurements'),
    t('weeklyUpdate.moodSleep'),
    t('weeklyUpdate.development'),
    t('weeklyUpdate.feeding'),
    t('weeklyUpdate.concerns'),
    t('weeklyUpdate.aiInsight'),
  ];

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async (insight) => {
      const updateData = {
        child_id: childId,
        user_id: user.id,
        week_date: new Date().toISOString().split('T')[0],
        age_in_days: child ? formatAgeInDays(child.date_of_birth) : 0,
        height_cm: formData.height_cm || null,
        weight_kg: formData.weight_kg || null,
        mood: formData.mood || null,
        sleep_hours: formData.sleep_hours || null,
        sleep_quality: formData.sleep_quality || null,
        motor_milestone: [
          formData.motor_milestone,
          ...(formData.milestones_checked || []),
        ].filter(Boolean).join('; '),
        new_skills: formData.new_skills || null,
        feeding_notes: [
          formData.feeding_type && `Type: ${formData.feeding_type}`,
          formData.breastfeed_times && `Breastfeed: ${formData.breastfeed_times}x/day`,
          formData.solid_foods && `Solids: ${formData.solid_foods}`,
          formData.food_reactions && `Reactions: ${formData.food_reactions}`,
        ].filter(Boolean).join('. '),
        concerns: formData.concerns || null,
        ai_insight: insight || null,
      };

      const { error } = await supabase.from('weekly_updates').insert(updateData);
      if (error) throw error;

      if (formData.height_cm || formData.weight_kg) {
        await supabase.from('growth_records').insert({
          child_id: childId,
          user_id: user.id,
          record_date: new Date().toISOString().split('T')[0],
          height_cm: formData.height_cm || null,
          weight_kg: formData.weight_kg || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-updates'] });
      queryClient.invalidateQueries({ queryKey: ['latest-update'] });
      queryClient.invalidateQueries({ queryKey: ['growth-records'] });
    },
  });

  const insightMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/ai/weekly-insight', {
        child_name: child?.name,
        age_in_days: child ? formatAgeInDays(child.date_of_birth) : 0,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        mood: formData.mood,
        sleep_hours: formData.sleep_hours,
        sleep_quality: formData.sleep_quality,
        motor_milestone: formData.motor_milestone,
        new_skills: formData.new_skills,
        feeding_notes: formData.solid_foods,
        concerns: formData.concerns,
      });
      return response.insight || 'Great job tracking your child\'s development this week! Keep up the amazing work.';
    },
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      if (step === 4) {
        generateInsight();
      }
    }
  };

  const generateInsight = async () => {
    try {
      const insight = await insightMutation.mutateAsync();
      setAiInsight(insight);
    } catch {
      setAiInsight('Your little one is growing beautifully. Every week brings new discoveries. Keep observing and nurturing their unique development journey!');
    }
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(aiInsight);
    navigate(`/child/${childId}/updates`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-h1 font-serif text-forest-700">{t('weeklyUpdate.title')}</h1>
        <p className="text-body text-gray-500 mt-1">
          {child?.name ? t('weeklyUpdate.howWasWeek', { name: child.name }) : t('weeklyUpdate.howWasWeekGeneric')}
        </p>
      </div>

      <Stepper steps={STEPS} currentStep={step} onStepClick={(i) => i <= step && setStep(i)} />

      <Card className="p-5 sm:p-6">
        {step === 0 && <MeasurementsStep formData={formData} updateField={updateField} childName={child?.name} />}
        {step === 1 && <MoodStep formData={formData} updateField={updateField} childName={child?.name} />}
        {step === 2 && <MilestonesStep formData={formData} updateField={updateField} child={child} voiceLang={voiceLang} />}
        {step === 3 && <FeedingStep formData={formData} updateField={updateField} child={child} voiceLang={voiceLang} />}
        {step === 4 && <ConcernsStep formData={formData} updateField={updateField} childName={child?.name} voiceLang={voiceLang} />}
        {step === 5 && (
          <AiInsightStep
            insight={aiInsight}
            loading={insightMutation.isPending}
            childName={child?.name}
            onRetry={generateInsight}
            voiceLang={voiceLang}
          />
        )}
      </Card>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1" size="lg">
            {t('common.back')}
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="flex-1" size="lg">
            {t('common.continue')}
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            loading={saveMutation.isPending}
            className="flex-1"
            size="lg"
          >
            {child?.name ? t('weeklyUpdate.saveUpdate', { name: child.name }) : 'Save the week'}
          </Button>
        )}
      </div>

    </div>
  );
}
