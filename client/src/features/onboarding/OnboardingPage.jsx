import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import i18n, { LANGUAGES } from '../../i18n';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { LogoMark } from '../../components/ui/LogoMark';

const TOTAL_SCREENS = 2;

function calcAge(dob) {
  if (!dob) return null;
  const days   = Math.floor((Date.now() - new Date(dob).getTime()) / 86400000);
  const weeks  = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (days < 1)    return 'Today!';
  if (days < 21)   return `${days} days old`;
  if (months < 3)  return `${weeks} weeks old`;
  if (months < 24) return `${months} months old`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} yr ${m} mo old` : `${y} years old`;
}

function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '12px',
                    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginBottom: '8px' }}>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize="words"
      autoFocus={autoFocus}
      style={{
        width: '100%',
        padding: '15px 16px',
        borderRadius: '14px',
        border: '1.5px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        color: 'white',
        fontSize: '17px',
        fontWeight: 500,
        outline: 'none',
        colorScheme: 'dark',
        transition: 'border-color 0.18s',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(29,158,117,0.60)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
    />
  );
}

export default function OnboardingPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const user        = useAuthStore(s => s.user);

  const [screen, setScreen]       = useState(0);
  const [screenKey, setScreenKey] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState({
    babyName:    '',
    dateOfBirth: '',
    parentName:  '',
    language:    'en',
  });

  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.parentName) {
      setFormData(d => ({ ...d, parentName: user.user_metadata.full_name }));
    }
  }, [user]);

  const update = (field, value) => setFormData(d => ({ ...d, [field]: value }));

  const canProceed = () => {
    if (screen === 0) {
      return formData.babyName.trim().length >= 2 && !!formData.dateOfBirth;
    }
    if (screen === 1) {
      return formData.parentName.trim().length >= 2;
    }
    return false;
  };

  const goBack = useCallback(() => {
    if (screen === 0) return;
    setScreen(s => s - 1);
    setScreenKey(k => k + 1);
    setSaveError('');
  }, [screen]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setSaveError('Session expired. Please sign in again.');
      setSaving(false);
      return;
    }

    try {
      const [profileRes, childRes] = await Promise.all([
        supabase.from('profiles').update({
          full_name:           formData.parentName,
          onboarding_complete: true,
          updated_at:          new Date().toISOString(),
        }).eq('id', userId),

        supabase.from('children').insert({
          user_id:       userId,
          name:          formData.babyName.trim(),
          date_of_birth: formData.dateOfBirth,
          due_date:      null,
          is_pregnant:   false,
        }).select(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (childRes.error)   throw childRes.error;

      await queryClient.invalidateQueries({ queryKey: ['children'] });

      if (childRes.data?.[0]) {
        useChildStore.getState().setChildren([childRes.data[0]]);
        useChildStore.getState().setSelectedChildId(childRes.data[0].id);
      }

      localStorage.setItem('childbloom_voice_lang', formData.language);
      localStorage.setItem('childbloom-lang', formData.language);
      i18n.changeLanguage(formData.language);

      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        full_name:           formData.parentName,
        onboarding_complete: true,
      });
      localStorage.setItem('cb_onboarded', 'true');

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.details || JSON.stringify(err) || 'Unknown error';
      setSaveError(`Could not save: ${msg}`);
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!canProceed()) return;
    if (screen === TOTAL_SCREENS - 1) {
      handleSave();
    } else {
      setScreen(s => s + 1);
      setScreenKey(k => k + 1);
    }
  };

  const ageDisplay = calcAge(formData.dateOfBirth);

  const renderScreen = () => {
    switch (screen) {

      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '26px',
                           color: 'white', fontWeight: 600, lineHeight: 1.25, marginBottom: '6px' }}>
                Your child
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px' }}>
                We'll use this to personalise everything for them.
              </p>
            </div>

            <div>
              <FieldLabel>Child's name</FieldLabel>
              <TextInput
                value={formData.babyName}
                onChange={v => update('babyName', v)}
                placeholder="e.g. Arjun, Priya…"
                autoFocus
              />
            </div>

            <div>
              <FieldLabel>Date of birth</FieldLabel>
              <input
                type="date"
                value={formData.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                min={new Date(Date.now() - 7 * 365 * 86400000).toISOString().split('T')[0]}
                onChange={e => update('dateOfBirth', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.06)',
                  color: formData.dateOfBirth ? 'white' : 'rgba(255,255,255,0.30)',
                  fontSize: '17px',
                  outline: 'none',
                  colorScheme: 'dark',
                  boxSizing: 'border-box',
                }}
              />
              {ageDisplay && (
                <p className="animate-fade-in" style={{ color: '#3DD68C', fontSize: '13px',
                               fontWeight: 600, marginTop: '8px' }}>
                  {formData.babyName ? `${formData.babyName}` : 'Your child'} is {ageDisplay} 🌱
                </p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '26px',
                           color: 'white', fontWeight: 600, lineHeight: 1.25, marginBottom: '6px' }}>
                About you
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '14px' }}>
                So Dr. Bloom knows who to talk to.
              </p>
            </div>

            <div>
              <FieldLabel>Your name</FieldLabel>
              <TextInput
                value={formData.parentName}
                onChange={v => update('parentName', v)}
                placeholder="Your first name"
                autoFocus
              />
            </div>

            <div>
              <FieldLabel>Preferred language</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.slice(0, 6).map(({ code, nativeLabel, label }) => (
                  <button
                    key={code}
                    onClick={() => {
                      update('language', code);
                      i18n.changeLanguage(code);
                      localStorage.setItem('childbloom-lang', code);
                    }}
                    className="rounded-xl flex flex-col items-center justify-center transition-all duration-200 active:scale-[0.96]"
                    style={{
                      padding: '14px 10px',
                      background: formData.language === code ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.05)',
                      border: formData.language === code
                        ? '1.5px solid #1D9E75'
                        : '1.5px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                      {nativeLabel}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <div className="rounded-xl p-4"
                   style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}>
                <p style={{ color: '#FCA5A5', fontSize: '13px' }}>{saveError}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0C0E' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5"
           style={{ height: '60px', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>

        {screen > 0 ? (
          <button onClick={goBack}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-opacity active:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
            <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <span style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>ChildBloom</span>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
                 style={{
                   width:      i === screen ? 20 : 6,
                   height:     6,
                   background: i <= screen ? '#1D9E75' : 'rgba(255,255,255,0.15)',
                 }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div key={screenKey} className="flex-1 px-5 pt-8 pb-36 overflow-y-auto animate-fade-in-up">
        {renderScreen()}
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 px-5"
           style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 32px)',
                    background: 'linear-gradient(to top, #0C0C0E 70%, transparent)' }}>
        <button
          onClick={handleContinue}
          disabled={!canProceed() || saving}
          className="w-full rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          style={{
            height:     '54px',
            fontSize:   '16px',
            background: canProceed() && !saving ? '#1D9E75' : 'rgba(255,255,255,0.07)',
            color:      canProceed() && !saving ? 'white' : 'rgba(255,255,255,0.22)',
            boxShadow:  canProceed() && !saving ? '0 4px 20px rgba(29,158,117,0.30)' : 'none',
            cursor:     canProceed() && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving…
            </>
          ) : screen === TOTAL_SCREENS - 1 ? (
            <>
              Get started
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          ) : (
            <>
              Continue
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
