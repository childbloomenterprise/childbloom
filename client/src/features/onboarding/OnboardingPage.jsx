import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import i18n, { LANGUAGES } from '../../i18n';
import useAuthStore from '../../stores/authStore';
import { LogoMark } from '../../components/ui/LogoMark';

// ── Constants ─────────────────────────────────────────────────────
const TOTAL_STEPS = 8;

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
                 lineHeight: 1.3, fontWeight: 600, marginBottom: '28px' }}>
      {text}
    </h2>
  );
}

// Dark frosted glass card
function DarkCard({ children, selected, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl flex items-center gap-4 transition-all duration-200 active:scale-[0.97]"
      style={{
        padding: '18px 20px',
        background: selected ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.06)',
        border: selected ? '2px solid #1D9E75' : '1px solid rgba(255,255,255,0.10)',
        ...style,
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

// Dark select
function DarkSelect({ value, onChange, children, style = {} }) {
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
        ...style,
      }}
    >
      {children}
    </select>
  );
}

// ── Utility: calculate age display ────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
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
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState('forward');
  const [stepKey, setStepKey]     = useState(0);

  const [formData, setFormData] = useState({
    isPregnant:  null,   // true | false
    dueMonth:    '',
    dueYear:     '',
    dateOfBirth: '',
    babyName:    '',
    gender:      '',     // 'male' | 'female' | 'other'
    parentName:  '',
    language:    'en',
  });

  // Step 8 (index 7) state
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeDone, setWelcomeDone]       = useState(false);
  const [saveError, setSaveError]           = useState('');

  // Pre-fill parent name from Google metadata
  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.parentName) {
      setFormData(d => ({ ...d, parentName: user.user_metadata.full_name }));
    }
  }, [user]);

  // Trigger save + welcome when entering step 7
  useEffect(() => {
    if (step === 7) handleStep8();
  }, [step]);

  const update = (field, value) => setFormData(d => ({ ...d, [field]: value }));

  // ── Navigation ────────────────────────────────────
  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.isPregnant !== null;
      case 2: return formData.isPregnant
        ? (formData.dueMonth && formData.dueYear)
        : !!formData.dateOfBirth;
      case 3: return formData.babyName.trim().length >= 2;
      case 4: return !!formData.gender;
      case 5: return formData.parentName.trim().length >= 2;
      case 6: return true; // language has default
      default: return false;
    }
  };

  const goNext = useCallback(() => {
    if (!canProceed() || step >= 7) return;
    setDirection('forward');
    setStep(s => s + 1);
    setStepKey(k => k + 1);
  }, [step, formData]);

  const goBack = useCallback(() => {
    if (step === 0) return;
    setDirection('back');
    setStep(s => s - 1);
    setStepKey(k => k + 1);
  }, [step]);

  // ── Step 8: save + Claude welcome ────────────────
  const handleStep8 = async () => {
    setSaveError('');
    setWelcomeMessage('');
    setWelcomeDone(false);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setSaveError('Session expired. Please sign in again.'); return; }

    // Build due date string
    let dueDate = null;
    if (formData.isPregnant && formData.dueMonth && formData.dueYear) {
      const mi = String(MONTHS.indexOf(formData.dueMonth) + 1).padStart(2, '0');
      dueDate = `${formData.dueYear}-${mi}-15`;
    }

    // Save profile + child simultaneously
    try {
      const [profileRes, childRes] = await Promise.all([
        supabase.from('profiles').upsert({
          id:                  userId,
          full_name:           formData.parentName,
          onboarding_complete: true,
          updated_at:          new Date().toISOString(),
        }, { onConflict: 'id' }),

        supabase.from('children').insert({
          user_id:      userId,
          name:         formData.babyName || 'Baby',
          gender:       formData.gender || null,
          date_of_birth: formData.isPregnant ? null : (formData.dateOfBirth || null),
          due_date:     dueDate,
          is_pregnant:  formData.isPregnant || false,
        }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (childRes.error)   throw childRes.error;

      // Persist language in localStorage (both keys used across the app)
      localStorage.setItem('childbloom_voice_lang', formData.language);
      localStorage.setItem('childbloom-lang', formData.language);

      // Update store so ProtectedRoute doesn't bounce back to /onboarding
      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        full_name:           formData.parentName,
        onboarding_complete: true,
      });
      localStorage.setItem('cb_onboarded', 'true');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setSaveError('Couldn\'t save your profile. Check your connection and try again.');
      return;
    }

    // Generate personalised welcome message (streaming)
    try {
      await generateWelcome(session.access_token);
    } catch {
      // Fallback welcome
      setWelcomeMessage(`Welcome to ChildBloom, ${formData.parentName}! I'm Dr. Bloom, and I'm delighted to join you on ${formData.babyName || 'your little one'}'s journey. Let's grow together, week by week.\n\n— Dr. Bloom`);
      setWelcomeDone(true);
    }
  };

  const generateWelcome = async (token) => {
    const langName = LANGUAGES.find(l => l.code === formData.language)?.label || 'English';
    const childInfo = formData.isPregnant
      ? `expecting, due ${formData.dueMonth} ${formData.dueYear}`
      : `born ${formData.dateOfBirth}${formData.gender ? ', ' + formData.gender : ''}`;

    const question = `Write a warm, personal 3-sentence welcome message in ${langName} for a new ChildBloom parent.
Parent: ${formData.parentName}
Child: ${formData.babyName || 'Baby'}, ${childInfo}
Be warm and specific to their stage. End with one practical tip for this week or pregnancy stage. Sign off exactly as "— Dr. Bloom"`;

    const response = await fetch(`${API_BASE}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        child_name: formData.babyName || 'Baby',
        gender: formData.gender,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      const reader = response.body.getReader();
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

  // ── Rendered step content ─────────────────────────
  const currentYear  = new Date().getFullYear();
  const dueYears     = [currentYear, currentYear + 1];
  const ageDisplay   = calcAge(formData.dateOfBirth);
  const weekDisplay  = calcPregnancyWeek(formData.dueMonth, formData.dueYear);

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Welcome ──────────────────────────
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="animate-bloom-breathe mb-8">
              <LogoMark size={80} />
            </div>
            <h2 className="animate-fade-in-up" style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '26px', color: 'white', fontWeight: 700, marginBottom: '12px', animationDelay: '600ms' }}>
              Hello! I'm Dr. Bloom.
            </h2>
            <p className="animate-fade-in-up" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.6, maxWidth: '280px', animationDelay: '1000ms' }}>
              I'll be your family's child development companion — from pregnancy to age 7.
            </p>
          </div>
        );

      // ── Step 2: Pregnant or born? ────────────────
      case 1:
        return (
          <div>
            <DrBloomAvatar />
            <Question text="First, tell me about your little one:" />
            <div className="space-y-3">
              <DarkCard selected={formData.isPregnant === true} onClick={() => update('isPregnant', true)}>
                <span style={{ fontSize: '28px' }}>🤰</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>I'm currently pregnant</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '2px' }}>My baby is on the way</div>
                </div>
              </DarkCard>
              <DarkCard selected={formData.isPregnant === false} onClick={() => update('isPregnant', false)}>
                <span style={{ fontSize: '28px' }}>👶</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>My baby has been born</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '2px' }}>We're already home</div>
                </div>
              </DarkCard>
            </div>
          </div>
        );

      // ── Step 3A: Due date ────────────────────────
      // ── Step 3B: Date of birth ───────────────────
      case 2:
        return formData.isPregnant ? (
          <div>
            <DrBloomAvatar />
            <Question text="Congratulations! When is your baby due?" />
            <div className="flex gap-3">
              <DarkSelect value={formData.dueMonth} onChange={v => update('dueMonth', v)}>
                <option value="" style={{ background: '#1A1A1A' }}>Month</option>
                {MONTHS.map(m => (
                  <option key={m} value={m} style={{ background: '#1A1A1A' }}>{m}</option>
                ))}
              </DarkSelect>
              <DarkSelect value={formData.dueYear} onChange={v => update('dueYear', v)}>
                <option value="" style={{ background: '#1A1A1A' }}>Year</option>
                {dueYears.map(y => (
                  <option key={y} value={y} style={{ background: '#1A1A1A' }}>{y}</option>
                ))}
              </DarkSelect>
            </div>
            {weekDisplay && (
              <p className="mt-4 animate-fade-in" style={{ color: '#3DD68C', fontSize: '15px', fontWeight: 600 }}>
                You're in week {weekDisplay} of pregnancy ✨
              </p>
            )}
          </div>
        ) : (
          <div>
            <DrBloomAvatar />
            <Question text="Wonderful! When was your baby born?" />
            <input
              type="date"
              value={formData.dateOfBirth}
              max={new Date().toISOString().split('T')[0]}
              min={new Date(Date.now() - 7 * 365 * 86400000).toISOString().split('T')[0]}
              onChange={e => update('dateOfBirth', e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
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
              <p className="mt-4 animate-fade-in" style={{ color: '#3DD68C', fontSize: '15px', fontWeight: 600 }}>
                Your baby is {ageDisplay} 🌱
              </p>
            )}
          </div>
        );

      // ── Step 4: Baby name ────────────────────────
      case 3:
        return (
          <div>
            <DrBloomAvatar />
            <Question text="What is your baby's name?" />
            <input
              type="text"
              value={formData.babyName}
              onChange={e => update('babyName', e.target.value)}
              placeholder="Baby's name"
              autoFocus
              autoCapitalize="words"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.07)',
                color: 'white',
                fontSize: '28px',
                fontWeight: 600,
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
              This is how I'll always address your child ❤️
            </p>
          </div>
        );

      // ── Step 5: Gender ───────────────────────────
      case 4: {
        const babyName = formData.babyName || 'your baby';
        const genders = [
          { value: 'male',   label: 'Boy' },
          { value: 'female', label: 'Girl' },
          { value: 'other',  label: 'Prefer not to say' },
        ];
        return (
          <div>
            <DrBloomAvatar />
            <Question text={`What is ${babyName}'s gender?`} />
            <div className="flex gap-3 flex-wrap">
              {genders.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update('gender', value)}
                  className="flex-1 rounded-xl font-semibold transition-all duration-200 active:scale-[0.96]"
                  style={{
                    minWidth: '80px',
                    padding: '14px 12px',
                    fontSize: '14px',
                    background: formData.gender === value ? '#1D9E75' : 'rgba(255,255,255,0.07)',
                    border: formData.gender === value ? '2px solid #1D9E75' : '1px solid rgba(255,255,255,0.12)',
                    color: formData.gender === value ? 'white' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );
      }

      // ── Step 6: Parent name ──────────────────────
      case 5:
        return (
          <div>
            <DrBloomAvatar />
            <Question text="And what should I call you?" />
            <input
              type="text"
              value={formData.parentName}
              onChange={e => update('parentName', e.target.value)}
              placeholder="Your name"
              autoFocus
              autoCapitalize="words"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.07)',
                color: 'white',
                fontSize: '28px',
                fontWeight: 600,
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
              So I know who I'm talking to
            </p>
          </div>
        );

      // ── Step 7: Language ─────────────────────────
      case 6: {
        const displayLangs = LANGUAGES.slice(0, 6); // all 6
        return (
          <div>
            <DrBloomAvatar />
            <Question text="Which language do you prefer?" />
            <div className="grid grid-cols-2 gap-3">
              {displayLangs.map(({ code, nativeLabel, label }) => (
                <button
                  key={code}
                  onClick={() => {
                    update('language', code);
                    i18n.changeLanguage(code);
                    localStorage.setItem('childbloom-lang', code);
                  }}
                  className="rounded-xl flex flex-col items-center justify-center transition-all duration-200 active:scale-[0.96]"
                  style={{
                    padding: '20px 16px',
                    background: formData.language === code ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.06)',
                    border: formData.language === code ? '2px solid #1D9E75' : '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    {nativeLabel}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>{label}</span>
                  {formData.language === code && (
                    <div className="mt-2 w-5 h-5 rounded-full flex items-center justify-center"
                         style={{ background: '#1D9E75' }}>
                      <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      }

      // ── Step 8: Personalized welcome ─────────────
      case 7:
        return (
          <div>
            <DrBloomAvatar />
            {!welcomeMessage && !saveError && (
              <div className="flex flex-col items-center py-12 gap-5">
                <div className="animate-bloom-breathe">
                  <LogoMark size={56} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px' }}>
                  Getting everything ready for {formData.babyName || 'your little one'}…
                </p>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full thinking-dot" style={{ background: '#1D9E75' }} />
                  <div className="w-2 h-2 rounded-full thinking-dot" style={{ background: '#1D9E75' }} />
                  <div className="w-2 h-2 rounded-full thinking-dot" style={{ background: '#1D9E75' }} />
                </div>
              </div>
            )}

            {saveError && (
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <p className="text-sm mb-3">{saveError}</p>
                <button
                  onClick={handleStep8}
                  className="w-full rounded-xl font-semibold flex items-center justify-center transition-all duration-200 active:scale-[0.98]"
                  style={{ height: '44px', background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5', fontSize: '14px' }}
                >
                  Try again
                </button>
              </div>
            )}

            {welcomeMessage && (
              <div className="animate-fade-in">
                <div className="rounded-2xl p-5 mb-6"
                     style={{ background: 'rgba(29,158,117,0.10)', border: '1px solid rgba(29,158,117,0.20)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {welcomeMessage}
                    {!welcomeDone && (
                      <span className="inline-block w-0.5 h-4 ml-0.5 typewriter-cursor align-middle"
                            style={{ background: '#3DD68C' }} />
                    )}
                  </p>
                </div>

                {welcomeDone && (
                  <button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] animate-scale-in"
                    style={{ height: '60px', background: '#1D9E75', fontSize: '16px',
                             boxShadow: '0 4px 24px rgba(29,158,117,0.45)' }}
                  >
                    Let's go to your dashboard
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

  const enterClass = direction === 'forward' ? 'animate-step-forward' : 'animate-step-back';

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: '#0A0A0A' }}>

      {/* ── Top bar ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-safe-top"
           style={{ height: '60px', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>

        {/* Back arrow */}
        {step > 0 && step < 7 ? (
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
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
                 style={{
                   width:  i === step ? 12 : 8,
                   height: i === step ? 12 : 8,
                   background: i < step  ? '#1D9E75' :
                               i === step ? '#1D9E75' :
                               'rgba(255,255,255,0.18)',
                 }} />
          ))}
        </div>

        {/* Step counter */}
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', minWidth: '36px', textAlign: 'right' }}>
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* ── Step content ──────────────────────────── */}
      <div key={stepKey}
           className={`flex-1 px-5 pt-4 pb-28 overflow-y-auto ${enterClass}`}>
        {renderStep()}
      </div>

      {/* ── Navigation arrow button ───────────────── */}
      {step < 7 && canProceed() && (
        <button
          onClick={goNext}
          className="fixed z-50 rounded-full flex items-center justify-center animate-scale-in animate-arrow-pulse"
          style={{
            bottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 32px)',
            right: '24px',
            width: '56px',
            height: '56px',
            background: '#1D9E75',
            boxShadow: '0 4px 20px rgba(29,158,117,0.40)',
          }}
        >
          <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Step 0 hint text near arrow */}
      {step === 0 && (
        <div className="fixed z-40 flex items-center gap-2 animate-fade-in"
             style={{
               bottom: 'max(env(safe-area-inset-bottom, 0px) + 26px, 34px)',
               right: '88px',
               color: 'rgba(255,255,255,0.45)',
               fontSize: '14px',
               fontWeight: 500,
             }}>
          Let's begin
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
