import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import { T } from '../../components/cb/tokens';
import { format } from 'date-fns';

const STEPS = [
  { id: 'mood', label: 'mood' },
  { id: 'sleep', label: 'sleep' },
  { id: 'feeding', label: 'feeding' },
  { id: 'milestones', label: 'milestones' },
  { id: 'concerns', label: 'concerns' },
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

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: T.bg, fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={handleBack}
          style={{ padding: '6px 4px', border: 'none', background: 'transparent', color: T.forest700, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
          <CBIcon name="chevron-left" size={18} /> Back
        </button>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink500 }}>{step + 1} of {total}</div>
        <button onClick={() => navigate('/dashboard')}
          style={{ padding: '6px 4px', border: 'none', background: 'transparent', color: T.ink300, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          Skip
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 16px 28px' }}>
        <div style={{ height: 3, background: T.ink100, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: T.forest600, borderRadius: 99, transition: 'width 300ms ease' }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '4px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.ink300 }}>Daily check-in</div>

        {current.id === 'mood' && (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink900, marginTop: 6, marginBottom: 0 }}>
              How was<br /><span style={{ color: T.forest600, fontStyle: 'italic' }}>{child?.name}</span> today?
            </h1>
            <p style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5 }}>
              Pick one — or hold the mic and just talk to me. I'll figure it out.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
              {MOODS.map(m => {
                const active = form.mood === m.id;
                return (
                  <button key={m.id} onClick={() => setForm(f => ({ ...f, mood: m.id }))}
                    style={{ padding: '18px 14px', borderRadius: 16, border: active ? `1.5px solid ${T.forest500}` : `0.5px solid ${T.ink100}`, background: active ? T.forest50 : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: active ? T.forest100 : '#fafafa', color: active ? T.forest700 : T.ink500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CBIcon name={m.i} size={17} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink900 }}>{m.l}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {current.id === 'sleep' && (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink900, marginTop: 6, marginBottom: 0 }}>
              How much did<br /><span style={{ color: T.forest600, fontStyle: 'italic' }}>{child?.name}</span> sleep?
            </h1>
            <p style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5 }}>Drag to set hours slept last night.</p>
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 48, fontWeight: 600, color: T.forest700, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 16 }}>
                {form.sleep_hours ?? 0}h
              </div>
              <input type="range" min={0} max={20} step={0.5}
                value={form.sleep_hours ?? 0}
                onChange={e => setForm(f => ({ ...f, sleep_hours: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: T.forest600, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.ink300, marginTop: 6 }}>
                <span>0h</span><span style={{ color: T.forest600, fontWeight: 600 }}>Goal: 14–17h</span><span>20h</span>
              </div>
            </div>
          </>
        )}

        {current.id === 'feeding' && (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink900, marginTop: 6, marginBottom: 0 }}>
              Feeding notes
            </h1>
            <p style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5 }}>How did feeding go today? Any changes?</p>
            <textarea value={form.feeding_notes} onChange={e => setForm(f => ({ ...f, feeding_notes: e.target.value }))}
              placeholder="e.g. Fed well, no issues..."
              rows={5}
              style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 14, border: `0.5px solid ${T.ink100}`, background: '#fff', fontSize: 15, color: T.ink900, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </>
        )}

        {current.id === 'milestones' && (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink900, marginTop: 6, marginBottom: 0 }}>
              Anything new<br /><span style={{ color: T.forest600, fontStyle: 'italic' }}>this week?</span>
            </h1>
            <p style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5 }}>New sounds, movements, smiles — anything.</p>
            <textarea value={form.new_skills} onChange={e => setForm(f => ({ ...f, new_skills: e.target.value }))}
              placeholder="e.g. First smile, tracked my face..."
              rows={5}
              style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 14, border: `0.5px solid ${T.ink100}`, background: '#fff', fontSize: 15, color: T.ink900, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </>
        )}

        {current.id === 'concerns' && (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.025em', color: T.ink900, marginTop: 6, marginBottom: 0 }}>
              Anything<br /><span style={{ color: T.forest600, fontStyle: 'italic' }}>worrying you?</span>
            </h1>
            <p style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5 }}>Dr. Bloom will review and respond. Nothing is too small.</p>
            <textarea value={form.concerns} onChange={e => setForm(f => ({ ...f, concerns: e.target.value }))}
              placeholder="e.g. A bit more fussy than usual..."
              rows={5}
              style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 14, border: `0.5px solid ${T.ink100}`, background: '#fff', fontSize: 15, color: T.ink900, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 36px', background: `linear-gradient(to top, ${T.bg} 60%, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ width: 54, height: 54, borderRadius: '50%', background: '#fff', border: `0.5px solid ${T.ink100}`, color: T.terra, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CBIcon name="mic" size={22} />
          </button>
          <button onClick={handleNext} disabled={saveMutation.isPending}
            style={{ flex: 1, height: 54, borderRadius: 99, background: T.forest700, color: '#fff', border: 'none', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saveMutation.isPending ? 0.7 : 1 }}>
            {step === total - 1 ? (saveMutation.isPending ? 'Saving…' : 'Done') : 'Continue'}
            {step < total - 1 && <CBIcon name="arrow-right" size={16} />}
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: T.ink300, marginTop: 8 }}>
          Hold mic to dictate · English / हिन्दी / മലയാളം
        </div>
      </div>
    </div>
  );
}
