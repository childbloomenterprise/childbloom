import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import Stepper from '../../components/ui/Stepper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { BabyIcon } from '../../assets/icons';

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    childType: 'born',
    childName: '',
    dateOfBirth: '',
    gender: 'male',
    dueDate: '',
  });

  const STEPS = [t('onboarding.yourName'), t('onboarding.childType'), t('onboarding.details'), t('onboarding.complete')];

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = async () => {
    try {
      setLoading(true);
      await updateProfile({ full_name: formData.full_name, onboarding_complete: true });

      const childData = {
        user_id: user.id,
        name: formData.childName || (formData.childType === 'pregnant' ? 'Baby' : 'My Child'),
        is_pregnant: formData.childType === 'pregnant',
        gender: formData.childType === 'born' ? formData.gender : null,
        date_of_birth: formData.childType === 'born' ? formData.dateOfBirth : null,
        due_date: formData.childType === 'pregnant' ? formData.dueDate : null,
      };

      await supabase.from('children').insert(childData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Subtle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-forest-50/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-terracotta-50/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10 px-1">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-forest-700 rounded-2xl mb-3 sm:mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-h1 font-serif text-forest-700">{t('onboarding.welcome')}</h1>
          <p className="text-body text-gray-500 mt-2">{t('onboarding.setupSteps')}</p>
        </div>

        <Stepper steps={STEPS} currentStep={step} />

        <Card className="p-5 sm:p-8 shadow-elevated animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-h3 font-serif text-forest-700 mb-1">{t('onboarding.whatsYourName')}</h2>
                <p className="text-body text-gray-500">{t('onboarding.personalise')}</p>
              </div>
              <Input
                label={t('onboarding.fullName')}
                placeholder={t('onboarding.enterName')}
                value={formData.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
              />
              <Button onClick={nextStep} disabled={!formData.full_name.trim()} className="w-full" size="lg">
                {t('onboarding.continue')}
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-h3 font-serif text-forest-700 mb-1">{t('onboarding.tellUsAbout')}</h2>
                <p className="text-body text-gray-500">{t('onboarding.selectSituation')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => updateField('childType', 'born')}
                  className={`p-4 sm:p-6 rounded-2xl border-2 text-center transition-all duration-200 active:scale-[0.97] ${
                    formData.childType === 'born'
                      ? 'border-forest-500 bg-forest-50'
                      : 'border-cream-300 hover:border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
                    formData.childType === 'born' ? 'bg-forest-100' : 'bg-cream-200'
                  }`}>
                    <BabyIcon className={`w-7 h-7 ${formData.childType === 'born' ? 'text-forest-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="font-semibold text-forest-700 text-caption">{t('onboarding.haveChild')}</p>
                  <p className="text-micro text-gray-400 mt-1">{t('onboarding.alreadyBorn')}</p>
                </button>
                <button
                  onClick={() => updateField('childType', 'pregnant')}
                  className={`p-4 sm:p-6 rounded-2xl border-2 text-center transition-all duration-200 active:scale-[0.97] ${
                    formData.childType === 'pregnant'
                      ? 'border-forest-500 bg-forest-50'
                      : 'border-cream-300 hover:border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
                    formData.childType === 'pregnant' ? 'bg-rose-50' : 'bg-cream-200'
                  }`}>
                    <svg className={`w-7 h-7 ${formData.childType === 'pregnant' ? 'text-rose-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-forest-700 text-caption">{t('onboarding.expecting')}</p>
                  <p className="text-micro text-gray-400 mt-1">{t('onboarding.currentlyPregnant')}</p>
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={prevStep} className="flex-1" size="lg">{t('onboarding.back')}</Button>
                <Button onClick={nextStep} className="flex-1" size="lg">{t('onboarding.continue')}</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-h3 font-serif text-forest-700 mb-1">
                  {formData.childType === 'born' ? t('onboarding.childDetails') : t('onboarding.pregnancyDetails')}
                </h2>
              </div>

              {formData.childType === 'born' ? (
                <>
                  <Input
                    label={t('onboarding.childName')}
                    placeholder={t('onboarding.enterChildName')}
                    value={formData.childName}
                    onChange={(e) => updateField('childName', e.target.value)}
                  />
                  <Input
                    label={t('onboarding.dateOfBirth')}
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-caption font-semibold text-forest-700">{t('onboarding.gender')}</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'male', label: t('onboarding.male') },
                        { value: 'female', label: t('onboarding.female') },
                        { value: 'other', label: t('onboarding.other') },
                      ].map((g) => (
                        <button
                          key={g.value}
                          onClick={() => updateField('gender', g.value)}
                          className={`flex-1 py-3 rounded-xl text-caption font-medium border-2 transition-all duration-200 ${
                            formData.gender === g.value
                              ? 'border-forest-500 bg-forest-50 text-forest-700'
                              : 'border-cream-300 text-gray-500 hover:border-cream-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    label={t('onboarding.babyName')}
                    placeholder={t('onboarding.enterNameOrBlank')}
                    value={formData.childName}
                    onChange={(e) => updateField('childName', e.target.value)}
                  />
                  <Input
                    label={t('onboarding.dueDate')}
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                  />
                </>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={prevStep} className="flex-1" size="lg">{t('onboarding.back')}</Button>
                <Button
                  onClick={nextStep}
                  disabled={formData.childType === 'born' ? !formData.dateOfBirth : !formData.dueDate}
                  className="flex-1"
                  size="lg"
                >
                  {t('onboarding.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-forest-50 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-h3 font-serif text-forest-700 mb-2">{t('onboarding.allSet')}</h2>
                <p className="text-body text-gray-500 leading-relaxed">
                  {formData.childType === 'born'
                    ? t('onboarding.readyToTrack', { name: formData.childName || 'your child' })
                    : t('onboarding.guidePregnancy')}
                </p>
              </div>
              <Button onClick={handleComplete} loading={loading} className="w-full" size="lg">
                {t('onboarding.goToDashboard')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
