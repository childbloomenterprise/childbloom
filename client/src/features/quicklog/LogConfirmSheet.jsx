// LogConfirmSheet — editable confirmation before anything is written.
//
// Voice/typed parsing (api/parse-log) NEVER auto-saves. This sheet shows the
// parsed events, lets the parent fix or remove each one, and only writes to
// Supabase when they tap Save. Mirrors SleepQuickSheet's bottom-sheet styling.

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { track } from '../../lib/analytics';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Body, Mono, Spacer } from '../../components/cb/primitives';
import { writeEvents } from './parseLog';

const FEED_TYPES = ['bottle', 'breast', 'formula', 'solid'];
const QUALITIES = ['excellent', 'good', 'okay', 'poor'];
const DIAPER_KINDS = ['wet', 'dirty', 'both'];

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: RADIUS.sm,
  border: `0.5px solid ${T.line}`, fontFamily: FONTS.sans, fontSize: 14,
  color: T.ink900, background: T.surface, outline: 'none',
};

function Chips({ options, value, onChange, t, prefix }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(sel ? null : o)}
            style={{
              padding: '6px 12px', borderRadius: RADIUS.pill,
              border: sel ? `1.5px solid ${T.brand}` : `0.5px solid ${T.line}`,
              background: sel ? T.brandWash : T.surface,
              color: sel ? T.brand : T.ink500, fontSize: 12, fontWeight: sel ? 700 : 500,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}
          >
            {t(`${prefix}.${o}`, o)}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, onChange, suffix }) {
  return (
    <label style={{ display: 'block' }}>
      <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Mono>
      <Spacer h={4} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          style={{ ...inputStyle, width: 96 }}
        />
        {suffix && <Body size={12} color={T.ink400}>{suffix}</Body>}
      </div>
    </label>
  );
}

function EventEditor({ ev, onPatch, onRemove, t }) {
  const title = t(`quicklog.type.${ev.type}`, ev.type);
  return (
    <div style={{ border: `0.5px solid ${T.line}`, borderRadius: RADIUS.md, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Body size={13} color={T.ink900} weight={700}>{title}</Body>
        <button onClick={onRemove} aria-label={t('quicklog.remove', 'Remove')} style={{ border: 'none', background: 'transparent', color: T.ink400, cursor: 'pointer', fontSize: 13 }}>✕</button>
      </div>

      {ev.type === 'feed' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <Chips options={FEED_TYPES} value={ev.feed_type} onChange={(v) => onPatch({ feed_type: v || 'bottle' })} t={t} prefix="quicklog.feedType" />
          <div style={{ display: 'flex', gap: 16 }}>
            {(ev.feed_type === 'bottle' || ev.feed_type === 'formula') && (
              <NumberField label={t('quicklog.amount', 'Amount')} value={ev.amount_ml} onChange={(v) => onPatch({ amount_ml: v })} suffix="ml" />
            )}
            <NumberField label={t('quicklog.duration', 'Duration')} value={ev.duration_minutes} onChange={(v) => onPatch({ duration_minutes: v })} suffix="min" />
          </div>
          {ev.feed_type === 'breast' && (
            <Chips options={['left', 'right', 'both']} value={ev.side} onChange={(v) => onPatch({ side: v })} t={t} prefix="quicklog.side" />
          )}
        </div>
      )}

      {ev.type === 'sleep' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <NumberField label={t('quicklog.hours', 'Hours slept')} value={ev.hours_slept} onChange={(v) => onPatch({ hours_slept: v })} suffix="h" />
          <Chips options={QUALITIES} value={ev.quality} onChange={(v) => onPatch({ quality: v })} t={t} prefix="quicklog.quality" />
        </div>
      )}

      {ev.type === 'diaper' && (
        <Chips options={DIAPER_KINDS} value={ev.kind} onChange={(v) => onPatch({ kind: v || 'wet' })} t={t} prefix="quicklog.diaper" />
      )}

      {ev.type === 'meds' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'block' }}>
            <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('quicklog.medName', 'Medicine')}</Mono>
            <Spacer h={4} />
            <input value={ev.name || ''} onChange={(e) => onPatch({ name: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ display: 'block' }}>
            <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('quicklog.dose', 'Dose')}</Mono>
            <Spacer h={4} />
            <input value={ev.dose || ''} onChange={(e) => onPatch({ dose: e.target.value })} placeholder="e.g. 2.5ml" style={inputStyle} />
          </label>
        </div>
      )}
    </div>
  );
}

export default function LogConfirmSheet({ open, events: initialEvents, child, method = 'voice', onClose }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (open) setEvents((initialEvents || []).map((e) => ({ ...e })));
  }, [open, initialEvents]);

  const save = useMutation({
    mutationFn: async () => {
      const valid = events.filter((e) => !(e.type === 'meds' && !(e.name || '').trim()));
      const { saved, invalidateKeys } = await writeEvents(valid, {
        supabase, childId: child?.id, userId: user?.id,
      });
      return { saved, invalidateKeys, types: valid.map((e) => e.type) };
    },
    onSuccess: ({ invalidateKeys, types }) => {
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      types.forEach((type) => track('quick_log_used', { method, type }));
      try { navigator.vibrate?.([30, 50, 30]); } catch (_) {}
      onClose(true);
    },
  });

  if (!open) return null;

  const patch = (i, fields) => setEvents((arr) => arr.map((e, idx) => (idx === i ? { ...e, ...fields } : e)));
  const remove = (i) => setEvents((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <>
      <div onClick={() => onClose(false)} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.44)', zIndex: 200 }} />
      <div
        role="dialog" aria-modal="true" aria-label={t('quicklog.confirmTitle', 'Confirm what to log')}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface,
          borderRadius: '28px 28px 0 0', padding: '12px 20px',
          paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 24px), 36px)',
          zIndex: 201, maxHeight: '88dvh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
        }}
      >
        <div aria-hidden style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 18px' }} />
        <Body size={16} color={T.ink900} weight={700}>{t('quicklog.confirmTitle', 'Confirm what to log')}</Body>
        <Spacer h={4} />
        <Body size={12} color={T.ink500}>{t('quicklog.confirmSub', 'Edit anything before saving. Nothing is saved until you tap Save.')}</Body>
        <Spacer h={16} />

        {events.length === 0 ? (
          <Body size={13} color={T.ink400} style={{ textAlign: 'center', padding: '20px 0' }}>
            {t('quicklog.nothingHeard', 'Nothing to log yet. Try again or add it manually.')}
          </Body>
        ) : (
          events.map((ev, i) => (
            <EventEditor key={i} ev={ev} t={t} onPatch={(f) => patch(i, f)} onRemove={() => remove(i)} />
          ))
        )}

        {save.isError && (
          <Body size={12} color="#dc2626" style={{ marginBottom: 10, textAlign: 'center' }}>
            {t('quicklog.saveError', 'Could not save. Check your connection.')}
          </Body>
        )}

        <button
          onClick={() => !save.isPending && events.length > 0 && save.mutate()}
          disabled={save.isPending || events.length === 0}
          style={{
            width: '100%', padding: '16px', borderRadius: RADIUS.lg, border: 'none',
            background: events.length === 0 ? T.ink200 : T.brand, color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: save.isPending || events.length === 0 ? 'default' : 'pointer', fontFamily: FONTS.sans,
          }}
        >
          {save.isPending ? t('quicklog.saving', 'Saving…') : t('quicklog.saveCount', 'Save {{n}}', { n: events.length })}
        </button>
        <Spacer h={8} />
        <button
          onClick={() => onClose(false)}
          style={{ width: '100%', padding: '12px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, background: 'transparent', color: T.ink400, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONTS.sans }}
        >
          {t('quicklog.cancel', 'Cancel')}
        </button>
      </div>
    </>
  );
}
