import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import i18n, { LANGUAGES } from '../../i18n';
import useAuthStore from '../../stores/authStore';
import { LogoMark } from '../../components/ui/LogoMark';

// ── Constants ─────────────────────────────────────────────────────
const TOTAL_SCREENS = 3;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// ── Sub-components ────────────────────────────────────────────────

function DrBloomAvatar() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: 'rgba(29,158,117,0.18)', border: '1px solid rgba(29,158,117,0.35)' }}>
        <LogoMark size={20} />
      </div>
      <span style={{ color: '#3DD68C', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>
        Dr. Bloom
      </span>
    </div>
  );
}

function Question({ text }) {
  return (
    <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '22px', color: 'white',
                 lineHeight: 1.3, fontWeight: 600, marginBottom: '24px' }}>
      {text}
    </h2>
  );
}

function DarkCard({ children, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl flex items-center gap-4 transition-all duration-200 active:scale-[0.97]"
      style={{
        padding: '16px 18px',
        background: selected ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.06)',
        border: selected ? '2px solid #1D9E75' : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {children}
      {selected && (
        <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
             style={{ background: '#1D9E75' }}>
          <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
}

function DarkSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.07)',
        color: value ? 'white' : 'rgba(255,255,255,0.35)',
        fontSize: '16px',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
      }}
    >
      {children}
    </select>
  );
}

function DarkInput({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize="words"
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.07)',
        color: 'white',
        fontSize: '22px',
        fontWeight: 600,
        outline: 'none',
        textAlign: 'center',
        colorScheme: 'dark',
      }}
      {...rest}
    />
  );
}

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

function calcPregnancyWeek(month, year) {
  if (!month || !year) return null;
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1) return null;
  const due = new Date(parseInt(year), monthIdx, 15);
  const daysUntilDue = Math.round((due - Date.now()) / 86400000);
  const week = Math.round((280 - daysUntilDue) / 7);
  if (week < 1 || week > 42) return null;
  return week;
}

// ── Main component ────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);

  const [screen, setScreen] = useState(0);
  const [screenKey, setScreenKey] = useState(0);

  const [formData, setFormData] = useState({
    isPregnant:  null,
    dueMonth:    '',
    dueYear:     '',
    dateOfBirth: '',
    babyName:    '',
    parentName:  '',
    language:    'en',
  });

  // Welcome screen state
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeDone, setWelcomeDone]       = useState(false);
  const [saveError, setSaveError]           = useState('');

  // Pre-fill parent name from auth metadata
  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.parentName) {
      setFormData(d => ({ ...d, parentName: user.user_metadata.full_name }));
    }
  }, [user]);

  // Trigger save when screen 2 (welcome) appears
  useEffect(() => {
    if (screen === 2) handleSaveAndWelcome();
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field, value) => setFormData(d => ({ ...d, [field]: value }));

  // ── Validation per screen ─────────────────────────
  const canProceed = () => {
    if (screen === 0) {
      if (formData.isPregnant === null) return false;
      if (!formData.babyName.trim() || formData.babyName.trim().length < 2) return false;
      if (formData.isPregnant) return !!(formData.dueMonth && formData.dueYear);
      return !!formData.dateOfBirth;
    }
    if (screen === 1) {
      return formData.parentName.trim().length >= 2;
    }
    return false;
  };

  const goNext = useCallback(() => {
    if (!canProceed() || screen >= 2) return;
    setScreen(s => s + 1);
    setScreenKey(k => k + 1);
  }, [screen, formData]);

  const goBack = useCallback(() => {
    if (screen === 0) return;
    setScreen(s => s - 1);
    setScreenKey(k => k + 1);
  }, [screen]);

  // ── Save profile + child, then stream welcome ─────
  const handleSaveAndWelcome = async () => {
    setSaveError('');
    setWelcomeMessage('');
    setWelcomeDone(false);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setSaveError('Session expired. Please sign in again.'); return; }

    let dueDate = null;
    if (formData.isPregnant && formData.dueMonth && formData.dueYear) {
      const mi = String(MONTHS.indexOf(formData.dueMonth) + 1).padStart(2, '0');
      dueDate = `${formData.dueYear}-${mi}-15`;
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
          name:          formData.babyName || 'Baby',
          date_of_birth: formData.isPregnant ? null : (formData.dateOfBirth || null),
          due_date:      dueDate,
          is_pregnant:   formData.isPregnant || false,
        }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (childRes.error)   throw childRes.error;

      localStorage.setItem('childbloom_voice_lang', formData.language);
      localStorage.setItem('childbloom-lang', formData.language);
      i18n.changeLanguage(formData.language);

      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        full_name:           formData.parentName,
        onboarding_complete: true,
      });
      localStorage.setItem('cb_onboarded', 'true');
    } catch (err) {
      const msg = err?.message || err?.details || JSON.stringify(err) || 'Unknown error';
      setSaveError(`Save failed: ${msg}`);
      return;
    }

    // Stream personalised welcome from Dr. Bloom
    try {
      await streamWelcome(session.access_token);
    } catch {
      const childInfo = formData.isPregnant
        ? `on the way`
        : calcAge(formData.dateOfBirth) || 'here with you';
      setWelcomeMessage(
        `Welcome to ChildBloom, ${formData.parentName}. ${formData.babyName} is lucky to have you.\n\nI am here whenever you need me.`
      );
      setWelcomeDone(true);
    }
  };

  const streamWelcome = async (token) => {
    const langName  = LANGUAGES.find(l => l.code === formData.language)?.label || 'English';
    const childInfo = formData.isPregnant
      ? `expecting, due ${formData.dueMonth} ${formData.dueYear}`
      : `born ${formData.dateOfBirth}`;
    const ageDesc = formData.isPregnant
      ? `expecting, due ${formData.dueMonth} ${formData.dueYear}`
      : calcAge(formData.dateOfBirth) || 'a newborn';

    const question = `Write a warm 2-sentence welcome message from Dr. Bloom to ${formData.parentName} whose child ${formData.babyName || 'Baby'} is ${ageDesc}.
Address the parent by name. Reference the child by name.
Tone: warm paediatrician meeting a family for the first time.
Language: ${langName}. Never clinical. Do NOT sign off.`;

    const response = await fetch(`${API_BASE}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        child_name: formData.babyName || 'Baby',
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { setWelcomeDone(true); return; }
          try {
            const { text } = JSON.parse(data);
            if (text) setWelcomeMessage(prev => prev + text);
          } catch { /* ignore */ }
        }
      }
    } else {
      const json = await response.json();
      setWelcomeMessage(json.answer || '');
    }
    setWelcomeDone(true);
  };

  // ── Screen renderers ──────────────────────────────
  const currentYear = new Date().getFullYear();
  const dueYears    = [currentYear, currentYear + 1];
  const ageDisplay  = calcAge(formData.dateOfBirth);
  const weekDisplay = calcPregnancyWeek(formData.dueMonth, formData.dueYear);

  const renderScreen = () => {
    switch (screen) {

      // ── Screen 1: Child details ──────────────────
      case 0:
        return (
          <div className="space-y-5">
            <DrBloomAvatar />
            <Question text="Tell us about your child" />

            {/* Pregnant / born toggle */}
            <div className="space-y-2.5">
              <DarkCard selected={formData.isPregnant === true} onClick={() => update('isPregnant', true)}>
                <span style={{ fontSize: '26px' }}>🤰</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>I'm currently pregnant</div>
                  <div style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px', marginTop: '2px' }}>My baby is on the way</div>
                </div>
              </DarkCard>
              <DarkCard selected={formData.isPregnant === false} onClick={() => update('isPregnant', false)}>
                <span style={{ fontSize: '26px' }}>👶</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>My baby has been born</div>
                  <div style={{ color: 'rgba(255,255,255,0.40)', fontSize: '13px', marginTop: '2px' }}>We're already home</div>
                </div>
              </DarkCard>
            </div>

            {/* Baby name */}
            {formData.isPregnant !== null && (
              <div className="animate-fade-in-up space-y-2">
                <label style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px', fontWeight: 500 }}>
                  {formData.isPregnant ? "What do you call your baby?" : "What is your baby's name?"}
                </label>
                <DarkInput
                  value={formData.babyName}
                  onChange={v => update('babyName', v)}
                  placeholder="Baby's name"
                  autoFocus
                />
              </div>
            )}

            {/* Date */}
            {formData.isPregnant === true && (
              <div className="animate-fade-in-up space-y-2">
                <label style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px', fontWeight: 500 }}>
                  When is your baby due?
                </label>
                <div className="flex gap-3">
                  <DarkSelect value={formData.dueMonth} onChange={v => update('dueMonth', v)}>
                    <option value="" style={{ background: '#1A1A1A' }}>Month</option>
                    {MONTHS.map(m => <option key={m} value={m} style={{ background: '#1A1A1A' }}>{m}</option>)}
                  </DarkSelect>
                  <DarkSelect value={formData.dueYear} onChange={v => update('dueYear', v)}>
                    <option value="" style={{ background: '#1A1A1A' }}>Year</option>
                    {dueYears.map(y => <option key={y} value={y} style={{ background: '#1A1A1A' }}>{y}</option>)}
                  </DarkSelect>
                </div>
                {weekDisplay && (
                  <p className="animate-fade-in" style={{ color: '#3DD68C', fontSize: '14px', fontWeight: 600 }}>
                    You're in week {weekDisplay} ✨
                  </p>
                )}
              </div>
            )}

            {formData.isPregnant === false && (
              <div className="animate-fade-in-up space-y-2">
                <label style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px', fontWeight: 500 }}>
                  Date of birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 7 * 365 * 86400000).toISOString().split('T')[0]}
                  onChange={e => update('dateOfBirth', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.07)',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
                {ageDisplay && (
                  <p className="animate-fade-in" style={{ color: '#3DD68C', fontSize: '14px', fontWeight: 600 }}>
                    {formData.babyName ? `${formData.babyName} is` : 'Your baby is'} {ageDisplay} 🌱
                  </p>
                )}
              </div>
            )}
          </div>
        );

      // ── Screen 2: About you ──────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <DrBloomAvatar />
            <Question text="About you" />

            {/* Parent name */}
            <div className="space-y-2">
              <label style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px', fontWeight: 500 }}>
                What should Dr. Bloom call you?
              </label>
              <DarkInput
                value={formData.parentName}
                onChange={v => update('parentName', v)}
                placeholder="Your name"
                autoFocus
              />
            </div>

            {/* Language selector */}
            <div className="space-y-3">
              <label style={{ color: 'rgba(255,255,255,0.50)', fontSize: '13px', fontWeight: 500 }}>
                Preferred language
              </label>
              <div className="grid grid-cols-2 gap-2.5">
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
                      padding: '16px 12px',
                      background: formData.language === code ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.06)',
                      border: formData.language === code ? '2px solid #1D9E75' : '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <span style={{ fontSize: '17px', fontWeight: 600, color: 'white', marginBottom: '3px' }}>
                      {nativeLabel}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)' }}>{label}</span>
                    {formData.language === code && (
                      <div className="mt-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                           style={{ background: '#1D9E75' }}>
                        <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Screen 3: Welcome moment ─────────────────
      case 2:
        return (
          <div className="flex flex-col items-center text-center py-4">
            {/* Dr. Bloom avatar — large, centred */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                 style={{ background: 'rgba(29,158,117,0.18)', border: '1px solid rgba(29,158,117,0.30)' }}>
              <LogoMark size={44} />
            </div>

            {saveError && (
              <div className="w-full rounded-xl p-4 mb-5 text-left"
                   style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <p className="text-sm mb-3">{saveError}</p>
                <button
                  onClick={handleSaveAndWelcome}
                  className="w-full rounded-xl font-semibold flex items-center justify-center transition-all active:scale-[0.98]"
                  style={{ height: '44px', background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5', fontSize: '14px' }}
                >
                  Try again
                </button>
              </div>
            )}

            {!welcomeMessage && !saveError && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="animate-bloom-breathe">
                  <LogoMark size={40} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '15px' }}>
                  Getting everything ready for {formData.babyName || 'your little one'}…
                </p>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full thinking-dot" style={{ background: '#1D9E75' }} />
                  ))}
                </div>
              </div>
            )}

            {welcomeMessage && (
              <div className="animate-fade-in w-full">
                {/* Message */}
                <div className="rounded-2xl p-6 mb-8 text-left"
                     style={{ background: 'rgba(29,158,117,0.10)', border: '1px solid rgba(29,158,117,0.20)' }}>
                  <p style={{ fontFamily: 'Fraunces, Georgia, serif', color: 'rgba(255,255,255,0.90)', fontSize: '17px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {welcomeMessage}
                    {!welcomeDone && (
                      <span className="inline-block w-0.5 h-5 ml-0.5 typewriter-cursor align-middle"
                            style={{ background: '#3DD68C' }} />
                    )}
                  </p>
                </div>

                {welcomeDone && (
                  <button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] animate-scale-in"
                    style={{ height: '58px', background: '#1D9E75', fontSize: '16px',
                             boxShadow: '0 4px 24px rgba(29,158,117,0.45)' }}
                  >
                    Enter ChildBloom
                    <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: '#0A0A0A' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5"
           style={{ height: '60px', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>
        {/* Back arrow */}
        {screen > 0 && screen < 2 ? (
          <button onClick={goBack} className="flex items-center justify-center w-9 h-9 transition-opacity active:opacity-60">
            <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
                 style={{
                   width:  i === screen ? 12 : 8,
                   height: i === screen ? 12 : 8,
                   background: i <= screen ? '#1D9E75' : 'rgba(255,255,255,0.18)',
                 }} />
          ))}
        </div>

        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', minWidth: '36px', textAlign: 'right' }}>
          {screen + 1} / {TOTAL_SCREENS}
        </span>
      </div>

      {/* Screen content */}
      <div key={screenKey} className="flex-1 px-5 pt-4 pb-32 overflow-y-auto animate-fade-in-up">
        {renderScreen()}
      </div>

      {/* Continue button — screens 0 and 1 only */}
      {screen < 2 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe"
             style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 32px)' }}>
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="w-full rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
            style={{
              height: '56px',
              fontSize: '16px',
              background: canProceed() ? '#1D9E75' : 'rgba(255,255,255,0.08)',
              color: canProceed() ? 'white' : 'rgba(255,255,255,0.25)',
              boxShadow: canProceed() ? '0 4px 20px rgba(29,158,117,0.35)' : 'none',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s',
            }}
          >
            Continue
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
