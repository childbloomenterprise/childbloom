// Onboarding v2 — 5-screen flow matching the Bloom design canvas.
// Screens: Welcome → Child → Birth & health → About you + tone → Ready.
// Saves: profiles (full_name, language, ai_tone, onboarding_complete) +
//        children (name, dob, pronouns, gestational_age, birth_weight, blood_group, allergies).

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import i18n, { LANGUAGES } from '../../i18n';
import useAuthStore from '../../stores/authStore';
import useChildStore from '../../stores/childStore';
import { track } from '../../lib/analytics';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Body, Mono, Eyebrow, Display, Spacer, Stack, HRow, Divider,
  PhotoSlot, BloomFlower, ProgressBar,
} from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';

const TOTAL = 5;
const BRAND_DARK = '#0F3D2E';
const ACCENT = '#1D9E75';

const PRONOUN_OPTIONS = [
  { id: 'she/her',   label: 'she / her' },
  { id: 'he/him',    label: 'he / him' },
  { id: 'they/them', label: 'they / them' },
];

const TONE_OPTIONS = [
  { id: 'warm',    label: 'Warm friend',    body: 'Encouraging, conversational, big-hearted.' },
  { id: 'precise', label: 'Precise coach',  body: 'Concise data, clear next actions, no fluff.' },
  { id: 'expert',  label: 'Quiet expert',   body: 'Pediatrics-grounded, calm, evidence-led.' },
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

function calcAge(dob) {
  if (!dob) return null;
  const days = Math.floor((Date.now() - new Date(dob).getTime()) / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (days < 1) return 'born today';
  if (days < 21) return `${days} days old`;
  if (months < 3) return `${weeks} weeks old`;
  if (months < 24) return `${months} months old`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y} yr ${m} mo old` : `${y} years old`;
}

// ─── shared field primitives ────────────────────────────────────────────

function DarkLabel({ children }) {
  return (
    <label style={{
      display: 'block', color: 'rgba(255,255,255,0.50)', fontSize: 11,
      fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
      marginBottom: 8,
    }}>{children}</label>
  );
}

function LightLabel({ children }) {
  return (
    <Mono size={10} color={T.ink400} style={{
      letterSpacing: '0.10em', textTransform: 'uppercase',
      display: 'block', marginBottom: 7,
    }}>{children}</Mono>
  );
}

function DarkInput({ value, onChange, placeholder, type = 'text', autoFocus, suffix, min, max, ariaLabel }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      autoFocus={autoFocus}
      min={min}
      max={max}
      autoCapitalize={type === 'text' ? 'words' : 'off'}
      style={{
        width: '100%', padding: '15px 16px', borderRadius: 14,
        border: '1.5px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        color: value ? 'white' : 'rgba(255,255,255,0.30)',
        fontSize: 16, fontWeight: 500, outline: 'none',
        colorScheme: 'dark', transition: 'border-color 0.18s',
        boxSizing: 'border-box', fontFamily: FONTS.sans,
      }}
      onFocus={(e) => { e.target.style.borderColor = `${ACCENT}99`; }}
      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
    />
  );
}

function LightInput({ value, onChange, placeholder, type = 'text', autoFocus, min, max, ariaLabel }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      autoFocus={autoFocus}
      min={min}
      max={max}
      autoCapitalize={type === 'text' ? 'words' : 'off'}
      style={{
        width: '100%', padding: '13px 14px', borderRadius: RADIUS.md,
        border: `1px solid ${T.line}`, background: T.surface,
        color: T.ink900, fontSize: 15, fontWeight: 500, outline: 'none',
        boxSizing: 'border-box', fontFamily: FONTS.sans,
        transition: 'border-color 0.18s, box-shadow 0.18s',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = T.brand;
        e.target.style.boxShadow = `0 0 0 3px ${T.brandTint}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = T.line;
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

function PillToggleGroup({ options, value, onChange, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 8 }}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={active} aria-label={o.label} onClick={() => onChange(o.id)}
            style={{
              padding: '11px 8px', borderRadius: RADIUS.md, cursor: 'pointer',
              background: active ? T.brandTint : T.surface,
              border: `1.5px solid ${active ? T.brand : T.line}`,
              color: active ? T.brand : T.ink700,
              fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StepDots({ step }) {
  return (
    <HRow gap={6}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i <= step ? T.brand : T.ink100,
          transition: 'background 0.2s',
        }} />
      ))}
    </HRow>
  );
}

// ─── individual screens ─────────────────────────────────────────────────

function ScreenWelcome({ onNext }) {
  return (
    <div style={{
      minHeight: '100dvh', background: BRAND_DARK, position: 'relative',
      overflow: 'hidden', color: '#fff', fontFamily: FONTS.sans,
    }}>
      {/* Decorative flower */}
      <div style={{ position: 'absolute', right: -100, top: -100, opacity: 0.22, pointerEvents: 'none' }}>
        <BloomFlower size={520} colors={['#fff','#fff','#fff','#fff','#fff','#fff']} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        padding: '60px 28px 36px',
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <HRow gap={10} align="center">
          <div style={{
            width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CBLogoMark size={18} color="#fff" />
          </div>
          <div style={{
            fontFamily: FONTS.serif, fontSize: 19, fontStyle: 'italic',
            letterSpacing: '-0.02em',
          }}>Bloom</div>
          <div style={{ flex: 1 }} />
          <Mono size={11} color="rgba(255,255,255,0.45)">STEP 1 OF {TOTAL}</Mono>
        </HRow>

        <div style={{ flex: 1, minHeight: 40 }} />

        {/* Headline */}
        <div style={{
          fontFamily: FONTS.serif, fontSize: 42, fontStyle: 'italic',
          fontWeight: 300, lineHeight: 1.04, letterSpacing: '-0.02em',
          color: '#fff', textWrap: 'pretty', maxWidth: 320,
        }}>
          Every day with your baby,<br/>beautifully understood.
        </div>
        <Spacer h={16} />
        <div style={{
          fontFamily: FONTS.sans, fontSize: 15, color: 'rgba(255,255,255,0.72)',
          maxWidth: 300, lineHeight: 1.55,
        }}>
          Bloom watches what you log and gently turns it into rhythms,
          milestones, and reassurance — never noise.
        </div>

        <div style={{ flex: 1, minHeight: 40 }} />

        {/* CTAs */}
        <Stack gap={10}>
          <button onClick={onNext} aria-label="Begin your baby's profile" style={{
            width: '100%', height: 54, borderRadius: 16, border: 'none',
            background: '#fff', color: BRAND_DARK,
            fontFamily: FONTS.sans, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          }}>
            Begin your baby's profile
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <div style={{
            textAlign: 'center', fontFamily: FONTS.sans, fontSize: 12,
            color: 'rgba(255,255,255,0.50)', marginTop: 4,
          }}>
            Free forever for the basics · Premium when you want depth.
          </div>
        </Stack>
      </div>
    </div>
  );
}

function ScreenChild({ form, update, onNext, onBack }) {
  const ageDisplay = calcAge(form.dateOfBirth);
  const canProceed = form.babyName.trim().length >= 2 && !!form.dateOfBirth && !!form.pronouns;

  return (
    <ScreenShell step={1} onBack={onBack}>
      <Eyebrow color={T.brand}>About your little one</Eyebrow>
      <Spacer h={6} />
      <Display size={28} italic weight={400} lh={1.15}>
        Tell us about <span style={{ fontStyle: 'normal' }}>your baby.</span>
      </Display>
      <Spacer h={6} />
      <Body size={13} color={T.ink500}>Bloom personalises everything from this moment.</Body>

      <Spacer h={26} />

      <Card p={20}>
        <HRow gap={14} align="center">
          <PhotoSlot label="add photo" w={64} h={64} radius="pill" />
          <Stack gap={4} style={{ flex: 1 }}>
            <LightLabel>Name</LightLabel>
            <LightInput
              value={form.babyName}
              onChange={(v) => update('babyName', v)}
              placeholder="e.g. Adoa, Arjun, Priya…"
              autoFocus
            />
          </Stack>
        </HRow>

        <Spacer h={16} />
        <Divider />
        <Spacer h={16} />

        <LightLabel>Pronouns</LightLabel>
        <PillToggleGroup
          options={PRONOUN_OPTIONS}
          value={form.pronouns}
          onChange={(v) => update('pronouns', v)}
        />

        <Spacer h={16} />

        <LightLabel>Birthday</LightLabel>
        <LightInput
          type="date"
          value={form.dateOfBirth}
          onChange={(v) => update('dateOfBirth', v)}
          max={new Date().toISOString().split('T')[0]}
          min={new Date(Date.now() - 7 * 365 * 86400000).toISOString().split('T')[0]}
        />
        {ageDisplay && (
          <div style={{ marginTop: 8 }}>
            <Body size={12} weight={600} color={T.brand}>
              {form.babyName || 'Your child'} is {ageDisplay} 🌱
            </Body>
          </div>
        )}
      </Card>

      <Spacer h={20} />

      <ContinueBar onNext={onNext} canProceed={canProceed} />
    </ScreenShell>
  );
}

function ScreenBirth({ form, update, onNext, onBack }) {
  const toggleAllergy = (allergy) => {
    const cur = form.allergies || [];
    update('allergies', cur.includes(allergy) ? cur.filter((a) => a !== allergy) : [...cur, allergy]);
  };

  const presetAllergies = ['Milk', 'Egg', 'Peanut', 'Tree nut', 'Soy', 'Wheat', 'Fish', 'Shellfish'];
  const canProceed = !!form.bloodGroup;

  return (
    <ScreenShell step={2} onBack={onBack}>
      <Eyebrow color={T.brand}>Birth & health</Eyebrow>
      <Spacer h={6} />
      <Display size={28} italic weight={400} lh={1.15}>
        A few <span style={{ fontStyle: 'normal' }}>health basics.</span>
      </Display>
      <Spacer h={6} />
      <Body size={13} color={T.ink500}>Select a blood group to continue. Other fields are optional.</Body>

      <Spacer h={22} />

      <Card p={20}>
        <HRow gap={10}>
          <Stack gap={6} style={{ flex: 1 }}>
            <LightLabel>Born at (weeks)</LightLabel>
            <LightInput
              type="number"
              value={form.gestationalAge}
              onChange={(v) => update('gestationalAge', v)}
              placeholder="40"
              min="20"
              max="44"
            />
          </Stack>
          <Stack gap={6} style={{ flex: 1 }}>
            <LightLabel>Birth weight (kg)</LightLabel>
            <LightInput
              type="number"
              value={form.birthWeightKg}
              onChange={(v) => update('birthWeightKg', v)}
              placeholder="3.1"
              min="0.5"
              max="8"
            />
          </Stack>
        </HRow>

        <Spacer h={16} />
        <Divider />
        <Spacer h={16} />

        <LightLabel>Blood group</LightLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {BLOOD_GROUPS.map((bg) => {
            const active = form.bloodGroup === bg;
            return (
              <button key={bg} type="button"
                aria-pressed={active}
                aria-label={`Blood group: ${bg}`}
                onClick={() => update('bloodGroup', active ? '' : bg)}
                style={{
                  padding: '9px 6px', borderRadius: RADIUS.sm, cursor: 'pointer',
                  background: active ? T.brandTint : T.surface,
                  border: `1px solid ${active ? T.brand : T.line}`,
                  color: active ? T.brand : T.ink700,
                  fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600,
                  transition: 'all 0.18s',
                }}>
                {bg}
              </button>
            );
          })}
        </div>

        <Spacer h={16} />
        <Divider />
        <Spacer h={16} />

        <LightLabel>Known allergies</LightLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presetAllergies.map((a) => {
            const active = (form.allergies || []).includes(a);
            return (
              <button key={a} type="button"
                aria-pressed={active}
                aria-label={`Allergy: ${a}`}
                onClick={() => toggleAllergy(a)}
                style={{
                  padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                  background: active ? T.brand : T.surface,
                  border: `1px solid ${active ? T.brand : T.line}`,
                  color: active ? '#fff' : T.ink700,
                  fontFamily: FONTS.sans, fontSize: 12, fontWeight: 600,
                  transition: 'all 0.18s',
                }}>
                {active ? '✓ ' : '+ '}{a}
              </button>
            );
          })}
        </div>
      </Card>

      <Spacer h={20} />

      <ContinueBar onNext={onNext} canProceed={canProceed} />
    </ScreenShell>
  );
}

function ScreenAboutYou({ form, update, onNext, onBack }) {
  const canProceed = form.parentName.trim().length >= 2;
  return (
    <ScreenShell step={3} onBack={onBack}>
      <Eyebrow color={T.brand}>About you</Eyebrow>
      <Spacer h={6} />
      <Display size={28} italic weight={400} lh={1.15}>
        So Bloom knows <span style={{ fontStyle: 'normal' }}>who to talk to.</span>
      </Display>

      <Spacer h={22} />

      <Card p={20}>
        <LightLabel>Your name</LightLabel>
        <LightInput
          value={form.parentName}
          onChange={(v) => update('parentName', v)}
          placeholder="Your first name"
          autoFocus
        />

        <Spacer h={16} />
        <Divider />
        <Spacer h={16} />

        <LightLabel>Preferred language</LightLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {LANGUAGES.slice(0, 6).map(({ code, nativeLabel, label }) => {
            const active = form.language === code;
            return (
              <button key={code} type="button"
                aria-pressed={active}
                aria-label={`Language: ${label}`}
                onClick={() => {
                  update('language', code);
                  i18n.changeLanguage(code);
                  localStorage.setItem('childbloom-lang', code);
                }}
                style={{
                  padding: '10px 6px', borderRadius: RADIUS.sm, cursor: 'pointer',
                  background: active ? T.brandTint : T.surface,
                  border: `1.5px solid ${active ? T.brand : T.line}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  fontFamily: FONTS.sans, transition: 'all 0.18s',
                }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? T.brand : T.ink900 }}>{nativeLabel}</span>
                <span style={{ fontSize: 10, color: T.ink400 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Spacer h={20} />

      <Body size={12} color={T.ink400} style={{ paddingLeft: 4, marginBottom: 8 }}>
        How would you like Bloom to talk to you?
      </Body>
      <Stack gap={8}>
        {TONE_OPTIONS.map((t) => {
          const active = form.aiTone === t.id;
          return (
            <button key={t.id} type="button"
              aria-pressed={active}
              aria-label={`Tone: ${t.label}. ${t.body}`}
              onClick={() => update('aiTone', t.id)}
              style={{
                width: '100%', padding: 16, borderRadius: RADIUS.lg,
                background: T.surface, border: 'none', cursor: 'pointer', textAlign: 'left',
                boxShadow: active
                  ? `0 0 0 2px ${T.brand}, 0 4px 16px rgba(11,23,20,0.10)`
                  : 'var(--shadow-sm), var(--shadow-ring)',
                transition: 'box-shadow 0.18s',
              }}>
              <HRow gap={12} align="flex-start">
                <div style={{
                  width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                  border: `1.5px solid ${active ? T.brand : T.ink300}`,
                  background: active ? T.brand : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <CBIcon name="check" size={12} stroke={3} style={{ color: '#fff' }} />}
                </div>
                <Stack gap={3} style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: FONTS.serif, fontSize: 17, fontStyle: 'italic',
                    color: T.ink900, letterSpacing: '-0.02em',
                  }}>{t.label}</div>
                  <Body size={12} color={T.ink500}>{t.body}</Body>
                </Stack>
              </HRow>
            </button>
          );
        })}
      </Stack>

      <Spacer h={20} />

      <ContinueBar onNext={onNext} canProceed={canProceed} />
    </ScreenShell>
  );
}

function ScreenReady({ form, onFinish, saving, saveError }) {
  return (
    <div style={{
      minHeight: '100dvh', background: T.bg,
      paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 32px)',
      paddingLeft: 20, paddingRight: 20,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONTS.sans,
    }} data-theme-root>

      <StepDots step={4} />
      <Spacer h={28} />

      <Eyebrow color={T.brand}>You're set</Eyebrow>
      <Spacer h={6} />
      <Display size={30} italic weight={400} lh={1.1}>
        Bloom is learning{' '}
        <span style={{ fontStyle: 'normal' }}>{form.babyName || 'your child'}.</span>
      </Display>
      <Spacer h={8} />
      <Body size={13} color={T.ink500}>
        Three days of logs is usually enough to see their rhythm.
      </Body>

      <Spacer h={26} />

      <Card p={26} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BloomFlower size={170} />
        <Spacer h={14} />
        <Display size={20} italic weight={400}>Day 1 of 3</Display>
        <Spacer h={6} />
        <Body size={12} color={T.ink500} style={{ textAlign: 'center' }}>
          Log a feed and a sleep to get started.
        </Body>
        <Spacer h={16} />
        <div style={{ width: '100%' }}>
          <ProgressBar value={0.18} />
        </div>
      </Card>

      <Spacer h={18} />

      <Card p={16} tone="warm">
        <HRow gap={10} align="center">
          <CBIcon name="sparkle" size={18} style={{ color: T.brand }} />
          <Body size={12} color={T.ink500} style={{ flex: 1 }}>
            Bloom won't predict — it'll wait, watch, and meet you where you are.
          </Body>
        </HRow>
      </Card>

      {saveError && (
        <>
          <Spacer h={14} />
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
          }}>
            <Body size={13} color="#B0492C">{saveError}</Body>
          </div>
        </>
      )}

      <div style={{ flex: 1, minHeight: 24 }} />

      <Button variant="primary" size="lg" full onClick={onFinish} disabled={saving}>
        {saving ? 'Saving…' : 'Open my dashboard →'}
      </Button>
    </div>
  );
}

// ─── shared shell for steps 2–4 (light theme) ───────────────────────────

function ScreenShell({ step, onBack, children }) {
  return (
    <div style={{
      minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans,
      paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)',
      paddingBottom: 140,
    }} data-theme-root>
      <div style={{ padding: '0 20px 0' }}>
        <HRow gap={12} align="center" style={{ marginBottom: 18 }}>
          <button onClick={onBack} aria-label="Back"
            style={{
              width: 36, height: 36, borderRadius: 999, background: T.surface,
              border: `1px solid ${T.line}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.ink700, flexShrink: 0,
            }}>
            <CBIcon name="chevron-left" size={16} stroke={2} />
          </button>
          <div style={{ flex: 1 }}>
            <StepDots step={step} />
          </div>
          <Mono size={10} color={T.ink400}>{step + 1}/{TOTAL}</Mono>
        </HRow>

        {children}
      </div>
    </div>
  );
}

function ContinueBar({ onNext, canProceed }) {
  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      padding: '14px 20px',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 24px)',
      background: `linear-gradient(to top, ${T.bg} 65%, transparent)`,
      zIndex: 10,
    }}>
      <Button variant="primary" size="lg" full onClick={onNext} disabled={!canProceed}>
        <span>Continue</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Button>
    </div>
  );
}

// ─── root component ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // If user already completed onboarding, skip straight to dashboard
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      if (profile?.onboarding_complete) {
        navigate('/dashboard', { replace: true });
      }
    })();
  }, [user?.id]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    babyName: '',
    dateOfBirth: '',
    pronouns: '',
    gestationalAge: '',
    birthWeightKg: '',
    bloodGroup: '',
    allergies: [],
    parentName: '',
    language: localStorage.getItem('childbloom-lang') || 'en',
    aiTone: 'warm',
  });

  useEffect(() => {
    if (user?.user_metadata?.full_name && !form.parentName) {
      setForm((f) => ({ ...f, parentName: user.user_metadata.full_name }));
    }
  }, [user]);

  const update = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
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
      const birthWeightGrams = form.birthWeightKg
        ? Math.round(parseFloat(form.birthWeightKg) * 1000)
        : null;
      const gestAge = form.gestationalAge ? parseInt(form.gestationalAge, 10) : null;
      const isPremature = gestAge != null && gestAge < 37;

      const childPayload = {
        user_id: userId,
        name: form.babyName.trim(),
        date_of_birth: form.dateOfBirth,
        due_date: null,
        is_pregnant: false,
        pronouns: form.pronouns || null,
        gestational_age_at_birth: gestAge,
        is_premature: isPremature,
        birth_weight_grams: birthWeightGrams,
        blood_group: form.bloodGroup && form.bloodGroup !== 'Unknown' ? form.bloodGroup : null,
        known_allergies: form.allergies || [],
      };

      // Profile must exist before child insert (FK constraint). Use upsert in case
      // the auto-create trigger didn't fire (e.g. Google OAuth race condition).
      const profileRes = await supabase.from('profiles').upsert({
        id: userId,
        full_name: form.parentName.trim(),
        language: form.language,
        ai_tone: form.aiTone,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (profileRes.error) throw profileRes.error;

      const childRes = await supabase.from('children').insert(childPayload).select();
      if (childRes.error) throw childRes.error;

      await queryClient.invalidateQueries({ queryKey: ['children'] });

      if (childRes.data?.[0]) {
        track('child_added', { child_name: form.babyName.trim() });
        useChildStore.getState().setChildren([childRes.data[0]]);
        useChildStore.getState().setSelectedChildId(childRes.data[0].id);
      }

      localStorage.setItem('childbloom_voice_lang', form.language);
      localStorage.setItem('childbloom-lang', form.language);
      i18n.changeLanguage(form.language);

      useAuthStore.getState().setProfile({
        ...useAuthStore.getState().profile,
        full_name: form.parentName.trim(),
        language: form.language,
        ai_tone: form.aiTone,
        onboarding_complete: true,
      });
      localStorage.setItem('cb_onboarded', 'true');
      localStorage.setItem('cb_ai_tone', form.aiTone);

      track('onboarding_completed', { language: form.language, ai_tone: form.aiTone });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.message || err?.details || JSON.stringify(err) || 'Unknown error';
      setSaveError(`Could not save: ${msg}`);
      setSaving(false);
    }
  };

  switch (step) {
    case 0: return <ScreenWelcome onNext={next} />;
    case 1: return <ScreenChild form={form} update={update} onNext={next} onBack={back} />;
    case 2: return <ScreenBirth form={form} update={update} onNext={next} onBack={back} />;
    case 3: return <ScreenAboutYou form={form} update={update} onNext={next} onBack={back} />;
    case 4: return <ScreenReady form={form} onFinish={handleFinish} saving={saving} saveError={saveError} />;
    default: return null;
  }
}
