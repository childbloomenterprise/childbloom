// Weekly check-in — single scrollable form (was a 5-step wizard).
// Calmer model: parent sees the whole shape of the check-in at once,
// fills what they want, taps Save. Drafts autosave to localStorage.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Display, Eyebrow, Body, Mono,
  Spacer,
  Button, ChromeBtn, ChipRow,
} from '../../components/cb/primitives';
import { format } from 'date-fns';

const MOODS = [
  { id: 'fussy',   l: 'Fussy',   i: 'wave' },
  { id: 'content', l: 'Content', i: 'sun' },
  { id: 'sleepy',  l: 'Sleepy',  i: 'moon' },
  { id: 'alert',   l: 'Alert',   i: 'sparkle' },
  { id: 'crying',  l: 'Crying',  i: 'flame' },
  { id: 'mixed',   l: 'Mixed',   i: 'leaf' },
];

const SLEEP_PRESETS = [8, 10, 11, 12, 13, 14, 15, 16];

const EMPTY_FORM = {
  mood: null,
  sleep_hours: null,
  feeding_notes: '',
  new_skills: '',
  concerns: '',
};

function draftKey(childId) {
  return `cb_checkin_draft_${childId || 'none'}`;
}

function SectionHeader({ eyebrow, title, hint }) {
  return (
    <>
      <Eyebrow color={T.brand}>{eyebrow}</Eyebrow>
      <Spacer h={6} />
      <div style={{
        fontFamily: FONTS.serif, fontSize: 22, fontStyle: 'italic',
        fontWeight: 500, color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1.15,
      }}>{title}</div>
      {hint && (
        <>
          <Spacer h={6} />
          <Body size={13} color={T.ink500} lh={1.5}>{hint}</Body>
        </>
      )}
      <Spacer h={14} />
    </>
  );
}

export default function WeeklyUpdatePage() {
  const navigate = useNavigate();
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // ── Draft autosave ──
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') return EMPTY_FORM;
    try {
      const draft = localStorage.getItem(draftKey(childId));
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed?.savedAt && new Date(parsed.savedAt).toDateString() === new Date().toDateString()) {
          return { ...EMPTY_FORM, ...parsed.form };
        }
      }
    } catch {}
    return EMPTY_FORM;
  });

  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(childId), JSON.stringify({
          form, savedAt: new Date().toISOString(),
        }));
      } catch {}
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [form, childId]);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  // ── Save mutation ──
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
      try { localStorage.removeItem(draftKey(childId)); } catch {}
      queryClient.invalidateQueries({ queryKey: ['weekly-updates'] });
      queryClient.invalidateQueries({ queryKey: ['sleep-logs-today', childId] });
      queryClient.invalidateQueries({ queryKey: ['sleep-logs-7d', childId] });
      queryClient.invalidateQueries({ queryKey: ['latest-update', childId] });
      navigate('/dashboard');
    },
  });

  const filled =
    !!form.mood ||
    form.sleep_hours != null ||
    !!form.feeding_notes.trim() ||
    !!form.new_skills.trim() ||
    !!form.concerns.trim();

  const textarea = {
    width: '100%', padding: '14px',
    borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`,
    background: T.surface, fontSize: 15, color: T.ink900,
    outline: 'none', resize: 'none', fontFamily: FONTS.sans,
    boxSizing: 'border-box', transition: 'border-color 0.16s ease',
  };

  const onFocus = (e) => e.target.style.borderColor = T.brandSoft;
  const onBlur  = (e) => e.target.style.borderColor = T.line;

  const childName = child?.name || 'your little one';

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans, paddingBottom: 120 }}>

      {/* ── Top nav ── */}
      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChromeBtn icon="back" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" />
        <Mono size={11} color={T.ink400} style={{ letterSpacing: '0.12em' }}>
          {filled ? 'Draft saved' : 'Daily check-in'}
        </Mono>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Title ── */}
      <div style={{ padding: '14px 20px 6px' }}>
        <Eyebrow color={T.ink300}>{format(new Date(), 'EEEE · MMM d')}</Eyebrow>
        <Spacer h={6} />
        <Display size={28} italic weight={500} lh={1.12}>
          How is{' '}
          <span style={{ color: T.brand, fontStyle: 'italic' }}>{childName}</span>{' '}
          today?
        </Display>
        <Spacer h={6} />
        <Body size={13} color={T.ink500} lh={1.5}>
          Fill what you want. Skip what you don't. One Save at the bottom.
        </Body>
      </div>

      <Spacer h={20} />

      {/* ── Mood ── */}
      <div style={{ padding: '0 20px' }}>
        <SectionHeader eyebrow="Mood" title="Today's vibe" hint="Pick one. Optional." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MOODS.map(m => {
            const active = form.mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                aria-label={`Mood: ${m.l}`}
                onClick={() => update('mood', active ? null : m.id)}
                style={{
                  padding: '14px', borderRadius: RADIUS.lg,
                  border: active ? `1.5px solid ${T.brand}` : `0.5px solid ${T.line}`,
                  background: active ? T.brandWash : T.surface,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s ease', minHeight: 60,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: active ? T.brandSoft : T.surfaceDim,
                  color: active ? T.brand : T.ink500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CBIcon name={m.i} size={16} />
                </div>
                <Body size={14} color={T.ink900} weight={600}>{m.l}</Body>
              </button>
            );
          })}
        </div>
      </div>

      <Spacer h={32} />

      {/* ── Sleep ── */}
      <div style={{ padding: '0 20px' }}>
        <SectionHeader
          eyebrow="Sleep"
          title="Hours in the last 24"
          hint={form.sleep_hours != null ? null : 'Tap a chip. Optional.'}
        />
        <ChipRow values={SLEEP_PRESETS} selected={form.sleep_hours} onChange={(v) => update('sleep_hours', v)} unit="h" ariaLabelPrefix="Hours slept" />
        {form.sleep_hours != null && (
          <button
            type="button"
            onClick={() => update('sleep_hours', null)}
            style={{
              marginTop: 10, padding: 0, background: 'transparent',
              border: 'none', color: T.ink400, fontSize: 12,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}
          >
            Clear
          </button>
        )}
      </div>

      <Spacer h={32} />

      {/* ── Feeding ── */}
      <div style={{ padding: '0 20px' }}>
        <SectionHeader eyebrow="Feeding" title="How did feeding go?" hint="A few words. Optional." />
        <textarea
          value={form.feeding_notes}
          onChange={e => update('feeding_notes', e.target.value)}
          placeholder="e.g. Fed well, no issues…"
          rows={3}
          aria-label="Feeding notes"
          maxLength={500}
          style={textarea}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <Spacer h={32} />

      {/* ── Milestones / new skills ── */}
      <div style={{ padding: '0 20px' }}>
        <SectionHeader eyebrow="New this week" title="Anything new?" hint="New sounds, movements, smiles — anything." />
        <textarea
          value={form.new_skills}
          onChange={e => update('new_skills', e.target.value)}
          placeholder="e.g. First smile, tracked my face…"
          rows={3}
          aria-label="New skills or milestones"
          maxLength={500}
          style={textarea}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <Spacer h={32} />

      {/* ── Concerns ── */}
      <div style={{ padding: '0 20px' }}>
        <SectionHeader
          eyebrow="Concerns"
          title="Anything worrying you?"
          hint="Dr. Bloom reads this. Nothing is too small."
        />
        <textarea
          value={form.concerns}
          onChange={e => update('concerns', e.target.value)}
          placeholder="e.g. A bit more fussy than usual…"
          rows={3}
          aria-label="Concerns"
          maxLength={500}
          style={textarea}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <Spacer h={24} />

      {/* ── Save error ── */}
      {saveMutation.isError && (
        <div style={{ padding: '0 20px' }}>
          <div style={{
            padding: '12px 14px', borderRadius: RADIUS.md,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
            fontSize: 13, color: '#dc2626',
          }}>
            Could not save. Check your connection and try again.
          </div>
        </div>
      )}

      {/* ── Sticky save bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px max(calc(env(safe-area-inset-bottom) + 16px), 28px)',
        background: `linear-gradient(to top, ${T.bg} 70%, transparent)`,
        zIndex: 50,
      }}>
        <Button
          variant="primary"
          size="lg"
          full
          onClick={() => filled && saveMutation.mutate()}
          disabled={!filled || saveMutation.isPending}
          aria-label="Save check-in"
          style={{ opacity: !filled || saveMutation.isPending ? 0.55 : 1 }}
        >
          {saveMutation.isPending ? 'Saving…' : (filled ? 'Save check-in' : 'Fill anything above')}
        </Button>
        <Spacer h={6} />
        <Body size={11} color={T.ink300} style={{ textAlign: 'center' }}>
          Draft autosaves as you type
        </Body>
      </div>
    </div>
  );
}
