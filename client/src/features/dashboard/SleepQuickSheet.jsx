// SleepQuickSheet — timer-first sleep logging.
//
// Three states:
//   idle   → parent has not started sleep yet (or no timer running)
//   running → timer is ticking (start time persisted in localStorage)
//   done   → timer stopped, duration calculated, quality picker shown
//
// localStorage key: `cb_sleep_timer_${childId}`
// Persists start time across app navigation and device lock.
//
// Mobile bug fixes applied:
//   - minHeight: 100% replaced with explicit dvh where needed
//   - No fixed heights that clip content on small screens (iPhone SE)
//   - overflowY: 'auto' on the sheet, not nested scroll containers
//   - env(safe-area-inset-bottom) padding for notch/home-indicator
//   - touchAction: 'none' only on interactive scroll elements

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useLogReward } from '../../hooks/useLogReward';
import useAuthStore from '../../stores/authStore';
import useUiStore from '../../stores/uiStore';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Display, Mono, Body, Spacer } from '../../components/cb/primitives';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { format } from 'date-fns';

const STORAGE_KEY = (childId) => `cb_sleep_timer_${childId}`;

const QUALITY_OPTIONS = [
  { id: 'excellent', label: 'Excellent', emoji: '😴', color: '#1E7A55' },
  { id: 'good',      label: 'Good',      emoji: '🙂', color: '#3B82F6' },
  { id: 'okay',      label: 'Okay',      emoji: '😐', color: '#D97706' },
  { id: 'poor',      label: 'Poor',      emoji: '😓', color: '#DC2626' },
];

// Format elapsed seconds as HH:MM:SS
function formatElapsed(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// Format seconds as "Xh Ym" for the summary
function formatDurationLabel(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDecimalHours(secs) {
  return Math.round((secs / 3600) * 10) / 10; // 1 decimal, e.g. 7.5
}

export default function SleepQuickSheet({ open, onClose, childId }) {
  const user = useAuthStore((s) => s.user);
  const { reward } = useLogReward(childId);
  const qc   = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // ── State ────────────────────────────────────────────────────────────────
  // 'idle' | 'running' | 'done'
  const [timerState, setTimerState] = useState('idle');
  const [elapsed,    setElapsed]    = useState(0);      // seconds
  const [startedAt,  setStartedAt]  = useState(null);   // Date object
  const [quality,    setQuality]    = useState(null);
  const [saved,      setSaved]      = useState(false);

  const intervalRef = useRef(null);
  const dialogRef   = useRef(null);
  useFocusTrap(dialogRef, open, onClose);
  const openModal  = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);

  // ── Lock body scroll + hide the bottom dock/SOS while open ────────────────
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    openModal();
    return () => {
      document.body.style.overflow = '';
      closeModal();
    };
  }, [open, openModal, closeModal]);

  // ── Restore timer from localStorage on open ──────────────────────────────
  useEffect(() => {
    if (!open || !childId) return;

    const stored = localStorage.getItem(STORAGE_KEY(childId));
    if (stored) {
      try {
        const { startedAt: iso } = JSON.parse(stored);
        const start = new Date(iso);
        if (!isNaN(start.getTime())) {
          setStartedAt(start);
          setTimerState('running');
          setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
        }
      } catch (_) {
        localStorage.removeItem(STORAGE_KEY(childId));
      }
    } else {
      // Fresh open — reset to idle
      setTimerState('idle');
      setElapsed(0);
      setStartedAt(null);
      setQuality(null);
      setSaved(false);
    }
  }, [open, childId]);

  // ── Tick interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerState === 'running' && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerState, startedAt]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    const now = new Date();
    setStartedAt(now);
    setElapsed(0);
    setTimerState('running');
    localStorage.setItem(STORAGE_KEY(childId), JSON.stringify({ startedAt: now.toISOString() }));
    try { navigator.vibrate?.(20); } catch (_) {}
  }, [childId]);

  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current);
    setTimerState('done');
    // Keep localStorage entry until saved (so we can recover if user reopens)
  }, []);

  const handleDiscard = useCallback(() => {
    clearInterval(intervalRef.current);
    localStorage.removeItem(STORAGE_KEY(childId));
    setTimerState('idle');
    setElapsed(0);
    setStartedAt(null);
    setQuality(null);
  }, [childId]);

  // ── Save mutation ────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async () => {
      const hours = formatDecimalHours(elapsed);
      const { data, error } = await supabase.from('sleep_logs').insert({
        child_id:    childId,
        user_id:     user.id,
        logged_date: today,
        hours_slept: hours,
        quality:     quality || null,
        notes:       startedAt
          ? `timer: ${format(startedAt, 'h:mm a')} – ${format(new Date(), 'h:mm a')}`
          : null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newLog) => {
      qc.setQueryData(['sleep-logs-today', childId], (old = []) => [newLog, ...(old || [])]);
      qc.invalidateQueries({ queryKey: ['sleep-logs-7d', childId] });
      localStorage.removeItem(STORAGE_KEY(childId));
      setSaved(true);
      reward({ source: 'timer', types: ['sleep'] });
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setSaved(false);
          setTimerState('idle');
          setElapsed(0);
          setStartedAt(null);
          setQuality(null);
        }, 400);
      }, 700);
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────
  const durationH = formatDecimalHours(elapsed);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          if (timerState !== 'running') onClose();
        }}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.44)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
          zIndex: 200,
          backdropFilter: open ? 'blur(3px)' : 'none',
          WebkitBackdropFilter: open ? 'blur(3px)' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Log sleep"
        tabIndex={-1}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: T.surface,
          borderRadius: '28px 28px 0 0',
          // Correct padding for notch phones — no clipping on any screen size
          paddingTop: 12,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: `max(calc(env(safe-area-inset-bottom) + 24px), 36px)`,
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.44s cubic-bezier(0.32,0.72,0,1)',
          zIndex: 201,
          // Let natural content height determine sheet height (fixes clipping on SE)
          maxHeight: '88dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
          boxSizing: 'border-box',
        }}
      >
        {/* Drag handle */}
        <div aria-hidden style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 24px' }} />

        {/* ── IDLE state ── */}
        {timerState === 'idle' && (
          <>
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🌙</div>
              <Display size={24} italic weight={500} style={{ marginBottom: 6 }}>Log sleep</Display>
              <Body size={13} color={T.ink500} lh={1.5}>
                Tap Start when baby falls asleep.<br />
                Tap End when baby wakes up.
              </Body>
            </div>
            <Spacer h={28} />
            <button
              onClick={handleStart}
              style={{
                width: '100%', padding: '18px', borderRadius: RADIUS.lg, border: 'none',
                background: '#1D3461', color: '#fff', fontSize: 17, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONTS.sans,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'transform 0.12s ease',
                boxShadow: '0 6px 24px rgba(29,52,97,0.28)',
              }}
              onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onPointerUp={e => e.currentTarget.style.transform = ''}
              onPointerLeave={e => e.currentTarget.style.transform = ''}
            >
              <span style={{ fontSize: 20 }}>▶</span>
              Start Sleep
            </button>
          </>
        )}

        {/* ── RUNNING state ── */}
        {timerState === 'running' && (
          <>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#3B82F6', animation: 'badge-pulse 1.8s ease-in-out infinite' }} />
              <Mono size={11} color="#3B82F6" style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sleeping</Mono>
            </div>

            {/* Giant timer */}
            <div style={{
              textAlign: 'center',
              fontFamily: FONTS.sans,
              fontSize: 'clamp(48px, 14vw, 72px)',
              fontWeight: 300,
              color: T.ink900,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: 8,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatElapsed(elapsed)}
            </div>

            {startedAt && (
              <Body size={12} color={T.ink400} style={{ textAlign: 'center', marginBottom: 32 }}>
                Started {format(startedAt, 'h:mm a')}
              </Body>
            )}

            {/* End Sleep */}
            <button
              onClick={handleStop}
              style={{
                width: '100%', padding: '18px', borderRadius: RADIUS.lg, border: 'none',
                background: T.brand, color: '#fff', fontSize: 17, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONTS.sans,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'transform 0.12s ease',
                boxShadow: `0 6px 24px var(--brand)33`,
              }}
              onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onPointerUp={e => e.currentTarget.style.transform = ''}
              onPointerLeave={e => e.currentTarget.style.transform = ''}
            >
              <span style={{ fontSize: 18 }}>⏹</span>
              End Sleep
            </button>
            <Spacer h={12} />

            {/* Discreet discard */}
            <button
              onClick={handleDiscard}
              style={{
                width: '100%', padding: '12px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`,
                background: 'transparent', color: T.ink400, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              Discard session
            </button>

            {/* Tip: closing keeps timer running */}
            <Body size={11} color={T.ink300} style={{ textAlign: 'center', marginTop: 14 }}>
              Timer keeps running if you close this sheet.
            </Body>
          </>
        )}

        {/* ── DONE state ── */}
        {timerState === 'done' && (
          <>
            <Display size={24} italic weight={500} style={{ marginBottom: 6 }}>Sleep logged</Display>
            <Body size={13} color={T.ink500} style={{ marginBottom: 24 }}>
              That's {formatDurationLabel(elapsed)} of sleep.
            </Body>

            {/* Duration summary card */}
            <div style={{
              background: '#EBF4FF', borderRadius: RADIUS.md,
              padding: '16px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: RADIUS.sm,
                background: '#3B5BDB', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>🌙</div>
              <div>
                <Mono size={10} color="#3B5BDB" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Duration</Mono>
                <div style={{
                  fontFamily: FONTS.serif, fontSize: 28, fontStyle: 'italic',
                  color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 2,
                }}>
                  {formatDurationLabel(elapsed)}
                </div>
                {startedAt && (
                  <Body size={11} color={T.ink400} style={{ marginTop: 2 }}>
                    {format(startedAt, 'h:mm a')} – {format(new Date(), 'h:mm a')}
                  </Body>
                )}
              </div>
            </div>

            {/* Quality picker — optional */}
            <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'block' }}>
              Sleep quality (optional)
            </Mono>
            <div
              role="radiogroup"
              aria-label="Sleep quality"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}
            >
              {QUALITY_OPTIONS.map(q => {
                const isSel = quality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    aria-label={q.label}
                    onClick={() => setQuality(isSel ? null : q.id)}
                    style={{
                      padding: '12px 6px 10px',
                      borderRadius: RADIUS.md,
                      border: isSel ? `2px solid ${q.color}` : `0.5px solid ${T.line}`,
                      background: isSel ? `${q.color}12` : T.surface,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      transition: 'all 0.14s ease',
                      minHeight: 64,
                    }}
                    onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                    onPointerUp={e => e.currentTarget.style.transform = ''}
                    onPointerLeave={e => e.currentTarget.style.transform = ''}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{q.emoji}</span>
                    <Body size={11} color={isSel ? q.color : T.ink500} weight={isSel ? 700 : 500}>{q.label}</Body>
                  </button>
                );
              })}
            </div>

            {save.isError && (
              <Body size={12} color="#dc2626" style={{ marginBottom: 12, textAlign: 'center' }}>
                Could not save. Check your connection.
              </Body>
            )}

            {/* Save */}
            <button
              onClick={() => !saved && !save.isPending && save.mutate()}
              disabled={save.isPending || saved}
              aria-label="Save sleep"
              style={{
                width: '100%', padding: '17px', borderRadius: RADIUS.lg, border: 'none',
                background: saved ? '#22c55e' : T.brand, color: '#fff',
                fontSize: 16, fontWeight: 700,
                cursor: saved || save.isPending ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.3s, transform 0.12s',
                fontFamily: FONTS.sans,
                transform: save.isPending ? 'scale(0.97)' : 'scale(1)',
                boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.35)' : '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              {saved ? '✓ Saved' : save.isPending ? 'Saving…' : 'Save sleep'}
            </button>

            <Spacer h={10} />
            <button
              onClick={handleDiscard}
              style={{
                width: '100%', padding: '12px', borderRadius: RADIUS.md,
                border: `0.5px solid ${T.line}`,
                background: 'transparent', color: T.ink400, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              Discard &amp; start over
            </button>
          </>
        )}
      </div>
    </>
  );
}
