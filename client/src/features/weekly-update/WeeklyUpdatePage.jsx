import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider,
  Card, Button, ProgressBar, ChromeBtn,
} from '../../components/cb/primitives';
import { format } from 'date-fns';

const STEPS = [
  { id: 'mood',       label: 'mood' },
  { id: 'sleep',      label: 'sleep' },
  { id: 'feeding',    label: 'feeding' },
  { id: 'milestones', label: 'milestones' },
  { id: 'concerns',   label: 'concerns' },
];

const MOODS = [
  { id: 'fussy',   l: 'Fussy',   i: 'wave' },
  { id: 'content', l: 'Content', i: 'sun' },
  { id: 'sleepy',  l: 'Sleepy',  i: 'moon' },
  { id: 'alert',   l: 'Alert',   i: 'sparkle' },
  { id: 'crying',  l: 'Crying',  i: 'flame' },
  { id: 'mixed',   l: 'Mixed',   i: 'leaf' },
];

export default function WeeklyUpdatePage() {
  const navigate = useNavigate();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    mood: null,
    sleep_hours: null,
    feeding_notes: '',
    new_skills: '',
    concerns: '',
  });

  const total = STEPS.length;
  const current = STEPS[step];
  const progress = (step / total) * 100;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        child_id: childId,
        user_id: user.id,
        week_date: format(new Date(), 'yyyy-MM-dd'),
        mood: form.mood,
        sleep_hours: form.sleep_hours,
        feeding_notes: form.feeding_notes || null,
        new_skills: form.new_skills || null,
        concerns: form.concerns || null,
      };
      const { error } = await supabase.from('weekly_updates').insert(payload);
      if (error) throw error;

      if (form.sleep_hours) {
        await supabase.from('sleep_logs').insert({
          child_id: childId,
          user_id: user.id,
          logged_date: format(new Date(), 'yyyy-MM-dd'),
          hours_slept: form.sleep_hours,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-updates'] });
      queryClient.invalidateQueries({ queryKey: ['sleep-logs'] });
      navigate('/dashboard');
    },
  });

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1);
    else saveMutation.mutate();
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    else navigate('/dashboard');
  };

  const textarea = {
    width: '100%', marginTop: 20, padding: '14px',
    borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`,
    background: T.surface, fontSize: 15, color: T.ink900,
    outline: 'none', resize: 'none', fontFamily: FONTS.sans,
    boxSizing: 'border-box',
  };

  return (
    <div data-theme-root style={{ position: 'relative', minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>

      {/* Nav */}
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChromeBtn icon="back" onClick={handleBack} />
        <Mono size={13} color={T.ink500}>{step + 1} of {total}</Mono>
        <button onClick={() => navigate('/dashboard')}
          style={{ padding: '6px 4px', border: 'none', background: 'transparent', color: T.ink300, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          Skip
        </button>
      </div>

      {/* Progress */}
      <div style={{ padding: '0 16px 28px' }}>
        <ProgressBar value={progress} animated />
      </div>

      {/* Body */}
      <div style={{ padding: '4px 24px' }}>
        <Eyebrow color={T.ink300}>Daily check-in</Eyebrow>

        {current.id === 'mood' && (
          <>
            <Spacer h={6} />
            <Display size={30} italic weight={600} lh={1.1}>
              How was{'\n'}<span style={{ color: T.brand, fontStyle: 'italic' }}>{child?.name}</span> today?
            </Display>
            <Spacer h={8} />
            <Body size={14} color={T.ink500} lh={1.5}>Pick one — or hold the mic and just talk to me.</Body>
            <Spacer h={24} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MOODS.map(m => {
                const active = form.mood === m.id;
                return (
                  <button key={m.id} onClick={() => setForm(f => ({ ...f, mood: m.id }))}
                    style={{
                      padding: '18px 14px', borderRadius: RADIUS.lg,
                      border: active ? `1.5px solid ${T.brand}` : `0.5px solid ${T.line}`,
                      background: active ? T.brandWash : T.surface,
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.15s ease',
                    }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: active ? T.brandSoft : T.surfaceDim,
                      color: active ? T.brand : T.ink500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CBIcon name={m.i} size={17} />
                    </div>
                    <Body size={14} color={T.ink900} weight={600}>{m.l}</Body>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {current.id === 'sleep' && (
          <>
            <Spacer h={6} />
            <Display size={30} italic weight={600} lh={1.1}>
              How much did{'\n'}<span style={{ color: T.brand }}>{child?.name}</span> sleep?
            </Display>
            <Spacer h={8} />
            <Body size={14} color={T.ink500} lh={1.5}>Drag to set hours slept last night.</Body>
            <Spacer h={32} />
            <div style={{ fontFamily: FONTS.serif, fontSize: 48, fontStyle: 'italic', color: T.brand, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 16 }}>
              {form.sleep_hours ?? 0}h
            </div>
            <input type="range" min={0} max={20} step={0.5}
              value={form.sleep_hours ?? 0}
              onChange={e => setForm(f => ({ ...f, sleep_hours: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: T.brand, cursor: 'pointer' }}
            />
            <HRow justify="space-between" style={{ marginTop: 6 }}>
              <Mono size={12} color={T.ink300}>0h</Mono>
              <Mono size={12} color={T.brand}>Goal: 14–17h</Mono>
              <Mono size={12} color={T.ink300}>20h</Mono>
            </HRow>
          </>
        )}

        {current.id === 'feeding' && (
          <>
            <Spacer h={6} />
            <Display size={30} italic weight={600} lh={1.1}>Feeding notes</Display>
            <Spacer h={8} />
            <Body size={14} color={T.ink500} lh={1.5}>How did feeding go today? Any changes?</Body>
            <textarea value={form.feeding_notes} onChange={e => setForm(f => ({ ...f, feeding_notes: e.target.value }))}
              placeholder="e.g. Fed well, no issues..." rows={5} style={textarea} />
          </>
        )}

        {current.id === 'milestones' && (
          <>
            <Spacer h={6} />
            <Display size={30} italic weight={600} lh={1.1}>
              Anything new{'\n'}<span style={{ color: T.brand }}>this week?</span>
            </Display>
            <Spacer h={8} />
            <Body size={14} color={T.ink500} lh={1.5}>New sounds, movements, smiles — anything.</Body>
            <textarea value={form.new_skills} onChange={e => setForm(f => ({ ...f, new_skills: e.target.value }))}
              placeholder="e.g. First smile, tracked my face..." rows={5} style={textarea} />
          </>
        )}

        {current.id === 'concerns' && (
          <>
            <Spacer h={6} />
            <Display size={30} italic weight={600} lh={1.1}>
              Anything{'\n'}<span style={{ color: T.brand }}>worrying you?</span>
            </Display>
            <Spacer h={8} />
            <Body size={14} color={T.ink500} lh={1.5}>Dr. Bloom will review and respond. Nothing is too small.</Body>
            <textarea value={form.concerns} onChange={e => setForm(f => ({ ...f, concerns: e.target.value }))}
              placeholder="e.g. A bit more fussy than usual..." rows={5} style={textarea} />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 36px', background: `linear-gradient(to top, ${T.bg} 60%, transparent)` }}>
        <HRow gap={10}>
          <button style={{
            width: 54, height: 54, borderRadius: '50%',
            background: T.surface, border: `0.5px solid ${T.line}`,
            color: T.accent, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <CBIcon name="mic" size={22} />
          </button>
          <Button variant="primary" size="lg" full onClick={handleNext}
            disabled={saveMutation.isPending}
            style={{ opacity: saveMutation.isPending ? 0.7 : 1 }}>
            {step === total - 1 ? (saveMutation.isPending ? 'Saving…' : 'Done') : 'Continue'}
          </Button>
        </HRow>
        <Spacer h={8} />
        <Body size={11} color={T.ink300} style={{ textAlign: 'center' }}>
          Hold mic to dictate · English / हिन्दी / മലയാളം
        </Body>
      </div>
    </div>
  );
}
