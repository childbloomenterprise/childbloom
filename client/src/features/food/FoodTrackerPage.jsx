// FoodTrackerPage — intelligent, timer-first feed logging.
//
// Logging flows per feed type:
//   breast → BreastfeedingFlow: Start → live L/R timer → Switch Side → Stop → summary → Save
//   bottle → BottleFlow: WheelPicker (0–500 ml) + recent amounts chips + smart suggestion → Save
//   pump   → PumpFlow: Start Pump → live timer → End Pump → WheelPicker → Save
//   solid  → coming soon
//
// Smart suggestions from computeBottleSuggestions() / computeBreastSuggestions()
// are shown BEFORE the parent touches anything — reducing decisions to zero
// for the common "same as last time" case.

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useChildById } from '../../hooks/useChild';
import useAuthStore from '../../stores/authStore';
import useUiStore from '../../stores/uiStore';
import CBIcon from '../../components/cb/CBIcon';
import WheelPicker, { ML_ITEMS } from '../../components/cb/WheelPicker';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, SectionLabel, AIBubble,
  SegmentedToggle,
} from '../../components/cb/primitives';
import { computeBottleSuggestions, computeBreastSuggestions } from '../../lib/feedLearning';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

// ── Animations ────────────────────────────────────────────────────────────
const ANIM = `
  @keyframes cb-ripple { from{transform:scale(1);opacity:.7} to{transform:scale(22);opacity:0} }
  @keyframes cb-slide-in { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes cb-spin { to{transform:rotate(360deg)} }
  @keyframes cb-pop { 0%{transform:scale(.88)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes cb-check { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
  @keyframes cb-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(0.85)} }
`;

const FEED_TYPES = [
  { id: 'breast', label: 'Breast', icon: 'heart',  color: '#1E7A55', bg: '#E8F5EF' },
  { id: 'bottle', label: 'Bottle', icon: 'bottle', color: '#0A84FF', bg: '#E5F1FF' },
  { id: 'pump',   label: 'Pump',   icon: 'leaf',   color: '#AF52DE', bg: '#F3E8FF' },
  { id: 'solid',  label: 'Solid',  icon: 'sun',    color: '#FF9500', bg: '#FFF0DC', soon: true },
];

function timeAgo(dateStr) {
  const mins = differenceInMinutes(new Date(), new Date(dateStr));
  if (mins < 60) return `${mins}m ago`;
  return `${differenceInHours(new Date(), new Date(dateStr))}h ago`;
}

// Format seconds as MM:SS or H:MM:SS
function formatTimer(secs) {
  const h   = Math.floor(secs / 3600);
  const m   = Math.floor((secs % 3600) / 60);
  const s   = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ── BottomSheet wrapper ────────────────────────────────────────────────────
function BottomSheet({ open, onClose, label, children }) {
  const ref = useRef(null);
  useFocusTrap(ref, open, onClose);
  const openModal  = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  useEffect(() => {
    if (!open) return;
    // Take over the screen: lock body scroll + hide the bottom dock/SOS so the
    // sheet's Save button is never covered by the floating tab bar.
    document.body.style.overflow = 'hidden';
    openModal();
    return () => {
      document.body.style.overflow = '';
      closeModal();
    };
  }, [open, openModal, closeModal]);

  return (
    <>
      <div
        onClick={onClose}
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
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label || 'Log a feed'}
        tabIndex={-1}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: T.surface,
          borderRadius: '28px 28px 0 0',
          paddingTop: 12,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: `max(calc(env(safe-area-inset-bottom) + 24px), 36px)`,
          transform: open ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.44s cubic-bezier(0.32,0.72,0,1)',
          zIndex: 201,
          maxHeight: '92dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
          boxSizing: 'border-box',
        }}
      >
        <div aria-hidden style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)', margin: '0 auto 24px' }} />
        {children}
      </div>
    </>
  );
}

// ── FeedTypeCard — same visual as before ─────────────────────────────────
function FeedTypeCard({ type, selected, onSelect }) {
  const [ripples, setRipples] = useState([]);
  const [pressed, setPressed] = useState(false);
  const isSel = selected === type.id;

  const handleTap = (e) => {
    if (type.soon) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(ri => ri.id !== id)), 700);
    onSelect(type.id);
  };

  return (
    <button
      onPointerDown={() => !type.soon && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={handleTap}
      disabled={type.soon}
      aria-pressed={isSel}
      aria-label={type.soon ? `${type.label} (coming soon)` : `Feed type: ${type.label}`}
      style={{
        position: 'relative', overflow: 'hidden', padding: '16px 8px',
        borderRadius: RADIUS.lg, border: `2px solid ${isSel ? type.color : 'transparent'}`,
        background: isSel ? type.bg : 'rgba(0,0,0,0.03)',
        cursor: type.soon ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
        opacity: type.soon ? 0.4 : 1,
        transform: pressed ? 'scale(0.91)' : isSel ? 'scale(1.04)' : 'scale(1)',
        transition: pressed
          ? 'transform 0.08s ease'
          : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background 0.2s',
        boxShadow: isSel ? `0 6px 20px ${type.color}28` : 'none',
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', left: r.x - 10, top: r.y - 10, width: 20, height: 20, borderRadius: '50%', background: type.color + '44', animation: 'cb-ripple 0.7s ease-out forwards', pointerEvents: 'none' }} />
      ))}
      <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, background: isSel ? type.color : 'rgba(0,0,0,0.06)', color: isSel ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.22s', animation: isSel ? 'cb-pop 0.35s ease' : 'none' }}>
        <CBIcon name={type.icon} size={22} stroke={1.8} />
      </div>
      <Body size={12} color={isSel ? type.color : T.ink500} weight={600}>{type.label}</Body>
      {type.soon && <div style={{ position: 'absolute', top: 5, right: 5, padding: '2px 5px', borderRadius: 5, background: T.line, fontSize: 7, fontWeight: 700, color: T.ink400 }}>SOON</div>}
    </button>
  );
}

// ── SaveButton — shared across all flows ──────────────────────────────────
function SaveButton({ onSave, isPending, saved, label = 'Save feed' }) {
  return (
    <button
      onClick={onSave}
      disabled={isPending || saved}
      style={{
        width: '100%', padding: '17px', borderRadius: RADIUS.lg, border: 'none',
        background: saved ? '#22c55e' : T.brand, color: '#fff',
        fontSize: 16, fontWeight: 700,
        cursor: saved || isPending ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.3s, transform 0.12s',
        fontFamily: FONTS.sans,
        transform: isPending ? 'scale(0.97)' : 'scale(1)',
        boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.35)' : '0 4px 20px rgba(0,0,0,0.15)',
      }}
      onPointerDown={e => { if (!saved && !isPending) e.currentTarget.style.transform = 'scale(0.96)'; }}
      onPointerUp={e => e.currentTarget.style.transform = ''}
      onPointerLeave={e => e.currentTarget.style.transform = ''}
    >
      {saved ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" strokeDasharray="24" style={{ animation: 'cb-check 0.3s ease forwards' }} />
          </svg>
          Saved!
        </>
      ) : isPending ? (
        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'cb-spin 0.7s linear infinite' }} />
      ) : label}
    </button>
  );
}

// ── SmartSuggestionBar — one-tap save for common case ─────────────────────
// Shows "Last: 90 ml  ·  Suggested: 95 ml  →  [Save 95 ml]"
function SmartSuggestionBar({ suggestions, onOneShot }) {
  const { lastAmount, suggestedAmount } = suggestions;
  if (!lastAmount && !suggestedAmount) return null;
  const saveVal = suggestedAmount ?? lastAmount;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: RADIUS.md,
      background: T.brandWash, border: `0.5px solid ${T.brandSoft}40`,
      marginBottom: 20,
    }}>
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        {lastAmount && (
          <Body size={12} color={T.ink500}>
            Last: <strong style={{ color: T.ink900 }}>{lastAmount} ml</strong>
            {suggestedAmount && suggestedAmount !== lastAmount && (
              <> &nbsp;·&nbsp; Suggested: <strong style={{ color: T.brand }}>{suggestedAmount} ml</strong></>
            )}
          </Body>
        )}
      </Stack>
      <button
        onClick={() => onOneShot(saveVal)}
        style={{
          padding: '10px 16px', borderRadius: RADIUS.pill, border: 'none',
          background: T.brand, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: FONTS.sans, flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
        onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
        onPointerUp={e => e.currentTarget.style.transform = ''}
        onPointerLeave={e => e.currentTarget.style.transform = ''}
      >
        Save {saveVal} ml
      </button>
    </div>
  );
}

// ── BottleFlow ─────────────────────────────────────────────────────────────
// WheelPicker + recent amount chips + one-tap "repeat last" bar
function BottleFlow({ suggestions, onSave, isPending, saved, notes, onNotesChange }) {
  const { recentUnique, suggestedAmount, lastAmount } = suggestions;
  const initialMl = suggestedAmount ?? lastAmount ?? 90;
  const [ml, setMl] = useState(initialMl);

  // Keep wheel in sync when initialMl settles (first render vs after suggestions load)
  const [pickerIndex, setPickerIndex] = useState(initialMl);

  useEffect(() => {
    setPickerIndex(initialMl);
    setMl(initialMl);
  }, [initialMl]);

  function handleWheelChange(idx) {
    setPickerIndex(idx);
    setMl(idx); // index = value for ML_ITEMS
  }

  function handleChipTap(amount) {
    setPickerIndex(amount);
    setMl(amount);
  }

  return (
    <>
      {/* Smart suggestion bar — one-tap repeat */}
      <SmartSuggestionBar
        suggestions={suggestions}
        onOneShot={(val) => onSave({ ml: val })}
      />

      {/* Wheel picker */}
      <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Amount</Mono>

      <WheelPicker
        items={ML_ITEMS}
        selectedIndex={pickerIndex}
        onChange={handleWheelChange}
        unit="ml"
        style={{ marginBottom: 4 }}
      />

      {/* Selected value readout — large, calming */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontFamily: FONTS.serif, fontSize: 32, fontStyle: 'italic',
          color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1,
        }}>
          {ml} <span style={{ fontSize: 18, color: T.ink400, fontWeight: 400 }}>ml</span>
        </div>
      </div>

      {/* Recent amounts — quick chips below wheel */}
      {recentUnique.length > 0 && (
        <>
          <Mono size={10} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'block' }}>
            Recent
          </Mono>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {recentUnique.map(amount => {
              const isSel = ml === amount;
              return (
                <button
                  key={amount}
                  onClick={() => handleChipTap(amount)}
                  aria-pressed={isSel}
                  aria-label={`${amount} ml`}
                  style={{
                    padding: '10px 18px', borderRadius: RADIUS.pill,
                    border: isSel ? `1.5px solid ${T.brand}` : `0.5px solid ${T.line}`,
                    background: isSel ? T.brandWash : T.surface,
                    color: isSel ? T.brand : T.ink900,
                    fontSize: 14, fontWeight: isSel ? 700 : 500,
                    cursor: 'pointer', fontFamily: FONTS.sans,
                    transition: 'all 0.14s ease',
                    minHeight: 44,
                  }}
                  onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                  onPointerUp={e => e.currentTarget.style.transform = ''}
                  onPointerLeave={e => e.currentTarget.style.transform = ''}
                >
                  {amount} ml
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Notes */}
      <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'block' }}>Notes (optional)</Mono>
      <input
        type="text" value={notes} onChange={e => onNotesChange(e.target.value)}
        placeholder="e.g. fed well, slow flow…"
        style={{ width: '100%', padding: '13px 14px', borderRadius: RADIUS.md, border: `1.5px solid ${T.line}`, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: T.ink900, background: 'rgba(0,0,0,0.02)', fontFamily: FONTS.sans, marginBottom: 20, transition: 'border-color 0.18s' }}
        onFocus={e => e.target.style.borderColor = T.brandSoft}
        onBlur={e => e.target.style.borderColor = T.line}
      />

      <SaveButton onSave={() => onSave({ ml })} isPending={isPending} saved={saved} label={`Save ${ml} ml`} />
    </>
  );
}

// ── BreastfeedingFlow ──────────────────────────────────────────────────────
// idle → running (with side switching) → done (summary) → Save
function BreastfeedingFlow({ suggestions, onSave, isPending, saved }) {
  // 'idle' | 'running' | 'paused' | 'done'
  const [phase, setPhase]         = useState('idle');
  const [currentSide, setSide]    = useState(suggestions?.startWith || 'L');
  const [elapsed, setElapsed]     = useState(0);  // total seconds
  const [leftSecs,  setLeftSecs]  = useState(0);
  const [rightSecs, setRightSecs] = useState(0);

  const timerRef   = useRef(null);
  const startRef   = useRef(null);  // Date.now() when last resumed
  const sideRef    = useRef(currentSide);

  sideRef.current = currentSide;

  const SIDE_COLOR = { L: '#1E7A55', R: '#0A84FF' };
  const sideLabel  = currentSide === 'L' ? 'Left' : 'Right';

  function startTimer() {
    startRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      const totalSecs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(totalSecs);
      // Update current side duration
      const sideElapsed = Math.floor((Date.now() - (startRef.current + (sideRef.current === 'L' ? rightSecs : leftSecs) * 1000)) / 1000);
      if (sideRef.current === 'L') setLeftSecs(sideElapsed);
      else setRightSecs(sideElapsed);
    }, 1000);
  }

  function stopInterval() { clearInterval(timerRef.current); }

  // Actually, let me simplify side tracking: track side-specific accumulated seconds properly.
  // On Start: left starts, leftStart = now
  // On SwitchSide: record leftDuration so far, rightStart = now
  // On Stop: record finalDuration for current side

  const sideStartRef = useRef(0);  // timestamp when current side started
  const accLeftRef   = useRef(0);  // accumulated left seconds before current run
  const accRightRef  = useRef(0);  // accumulated right seconds before current run

  // Clear all intervals on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  function handleStart(startSide) {
    setPhase('running');
    setSide(startSide);
    sideRef.current = startSide;
    const now = Date.now();
    startRef.current    = now;
    sideStartRef.current = now;
    accLeftRef.current  = 0;
    accRightRef.current = 0;
    setLeftSecs(0);
    setRightSecs(0);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      const total    = Math.floor((Date.now() - startRef.current) / 1000);
      const sideElap = Math.floor((Date.now() - sideStartRef.current) / 1000);
      setElapsed(total);
      if (sideRef.current === 'L') setLeftSecs(accLeftRef.current + sideElap);
      else                         setRightSecs(accRightRef.current + sideElap);
    }, 1000);
    try { navigator.vibrate?.(15); } catch (_) {}
  }

  function handlePause() {
    stopInterval();
    const sideElap = Math.floor((Date.now() - sideStartRef.current) / 1000);
    if (sideRef.current === 'L') accLeftRef.current  += sideElap;
    else                         accRightRef.current += sideElap;
    setPhase('paused');
  }

  function handleResume() {
    setPhase('running');
    sideStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const total    = Math.floor((Date.now() - startRef.current) / 1000);
      const sideElap = Math.floor((Date.now() - sideStartRef.current) / 1000);
      setElapsed(total);
      if (sideRef.current === 'L') setLeftSecs(accLeftRef.current + sideElap);
      else                         setRightSecs(accRightRef.current + sideElap);
    }, 1000);
  }

  function handleSwitchSide() {
    // Record current side's elapsed
    const sideElap = Math.floor((Date.now() - sideStartRef.current) / 1000);
    if (sideRef.current === 'L') {
      accLeftRef.current += sideElap;
      setSide('R');
      sideRef.current = 'R';
    } else {
      accRightRef.current += sideElap;
      setSide('L');
      sideRef.current = 'L';
    }
    sideStartRef.current = Date.now();
    try { navigator.vibrate?.(10); } catch (_) {}
  }

  function handleStop() {
    stopInterval();
    // Final snapshot
    const sideElap = Math.floor((Date.now() - sideStartRef.current) / 1000);
    const finalLeft  = sideRef.current === 'L' ? accLeftRef.current + sideElap : accLeftRef.current;
    const finalRight = sideRef.current === 'R' ? accRightRef.current + sideElap : accRightRef.current;
    setLeftSecs(finalLeft);
    setRightSecs(finalRight);
    setPhase('done');
  }

  function minSec(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m} min` : `${s} sec`;
  }

  const totalMin = Math.max(1, Math.round(elapsed / 60));

  // Determine dominant side for notes
  const dominantSide = leftSecs >= rightSecs ? 'L' : 'R';

  return (
    <>
      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <>
          <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'block' }}>
            Start feeding on
          </Mono>
          {/* Side selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {(['L', 'R']).map(s => {
              const col = SIDE_COLOR[s];
              const lbl = s === 'L' ? 'Left' : 'Right';
              const isSel = currentSide === s;
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  aria-pressed={isSel}
                  aria-label={`Start on ${lbl} side`}
                  style={{
                    padding: '18px 12px',
                    borderRadius: RADIUS.lg,
                    border: `2px solid ${isSel ? col : T.line}`,
                    background: isSel ? `${col}12` : T.surface,
                    cursor: 'pointer', fontFamily: FONTS.sans,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.16s ease',
                  }}
                  onPointerDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                  onPointerUp={e => e.currentTarget.style.transform = ''}
                  onPointerLeave={e => e.currentTarget.style.transform = ''}
                >
                  <span style={{ fontSize: 28 }}>{s === 'L' ? '🤱' : '🤱'}</span>
                  <Body size={15} color={isSel ? col : T.ink900} weight={isSel ? 700 : 500}>{lbl}</Body>
                </button>
              );
            })}
          </div>

          {suggestions?.dominantSide && (
            <div style={{ padding: '10px 14px', borderRadius: RADIUS.md, background: T.brandWash, marginBottom: 20 }}>
              <Body size={12} color={T.ink500}>
                Usually starts on <strong style={{ color: T.brand }}>{suggestions.dominantSide === 'L' ? 'Left' : 'Right'}</strong>.
                Try starting <strong style={{ color: T.brand }}>{currentSide === 'L' ? 'Left' : 'Right'}</strong> to balance supply.
              </Body>
            </div>
          )}

          <button
            onClick={() => handleStart(currentSide)}
            style={{
              width: '100%', padding: '18px', borderRadius: RADIUS.lg, border: 'none',
              background: T.brand, color: '#fff', fontSize: 17, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 6px 24px var(--brand)33`,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}
          >
            <span style={{ fontSize: 18 }}>▶</span>
            Start Feeding
          </button>
        </>
      )}

      {/* ── RUNNING ── */}
      {(phase === 'running' || phase === 'paused') && (
        <>
          {/* Side + live time badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            {phase === 'running' ? (
              <div style={{ width: 8, height: 8, borderRadius: 4, background: SIDE_COLOR[currentSide], animation: 'cb-pulse-dot 1.6s ease-in-out infinite' }} />
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: 4, background: T.ink300 }} />
            )}
            <Mono size={12} color={SIDE_COLOR[currentSide]} style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {sideLabel} · {phase === 'paused' ? 'Paused' : 'Feeding'}
            </Mono>
          </div>

          {/* Giant elapsed timer */}
          <div style={{
            textAlign: 'center',
            fontFamily: FONTS.sans,
            fontSize: 'clamp(52px, 16vw, 78px)',
            fontWeight: 300,
            color: T.ink900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: 6,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTimer(elapsed)}
          </div>

          {/* Per-side live split */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <Mono size={9} color={SIDE_COLOR['L']} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Left</Mono>
              <Body size={15} color={leftSecs > 0 ? SIDE_COLOR['L'] : T.ink300} weight={600}>{minSec(leftSecs)}</Body>
            </div>
            <div style={{ width: 1, background: T.line, alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <Mono size={9} color={SIDE_COLOR['R']} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Right</Mono>
              <Body size={15} color={rightSecs > 0 ? SIDE_COLOR['R'] : T.ink300} weight={600}>{minSec(rightSecs)}</Body>
            </div>
          </div>

          {/* Control row */}
          <div style={{ display: 'grid', gridTemplateColumns: phase === 'running' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
            {phase === 'running' ? (
              <>
                <button
                  onClick={handlePause}
                  aria-label="Pause"
                  style={{ padding: '14px 8px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, background: T.surface, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, color: T.ink900 }}
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleSwitchSide}
                  aria-label="Switch side"
                  style={{
                    padding: '14px 8px', borderRadius: RADIUS.md, border: `1.5px solid ${T.brand}`,
                    background: T.brandWash, cursor: 'pointer', fontFamily: FONTS.sans,
                    fontSize: 13, fontWeight: 700, color: T.brand,
                  }}
                >
                  Switch →
                </button>
                <button
                  onClick={handleStop}
                  aria-label="Stop"
                  style={{ padding: '14px 8px', borderRadius: RADIUS.md, border: 'none', background: T.ink900, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 700, color: '#fff' }}
                >
                  ⏹ Stop
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  style={{ padding: '16px 8px', borderRadius: RADIUS.md, border: 'none', background: T.brand, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 700, color: '#fff' }}
                >
                  ▶ Resume
                </button>
                <button
                  onClick={handleStop}
                  style={{ padding: '16px 8px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, background: T.surface, cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: T.ink900 }}
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── DONE / SUMMARY ── */}
      {phase === 'done' && (
        <>
          <Display size={22} italic weight={500} style={{ marginBottom: 6 }}>Feed complete</Display>
          <Body size={13} color={T.ink500} style={{ marginBottom: 20 }}>
            Total feeding time.
          </Body>

          {/* Summary card */}
          <div style={{ borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, overflow: 'hidden', marginBottom: 24 }}>
            {[
              { label: 'Left',  val: minSec(leftSecs),   color: SIDE_COLOR['L'], show: leftSecs > 0 },
              { label: 'Right', val: minSec(rightSecs),  color: SIDE_COLOR['R'], show: rightSecs > 0 },
              { label: 'Total', val: `${totalMin} min`,  color: T.ink900,        show: true },
            ].filter(r => r.show).map((row, i, arr) => (
              <div key={row.label}>
                <HRow style={{ padding: '14px 16px' }} align="center" justify="space-between">
                  <Body size={14} color={T.ink500}>{row.label}</Body>
                  <Body size={16} color={row.color} weight={700}>{row.val}</Body>
                </HRow>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>

          <SaveButton
            onSave={() => onSave({
              durationMin: totalMin,
              notes: `side:${dominantSide}${leftSecs > 0 && rightSecs > 0 ? ` · L:${Math.round(leftSecs/60)}m R:${Math.round(rightSecs/60)}m` : ''}`,
            })}
            isPending={isPending}
            saved={saved}
            label="Save feed"
          />

          <Spacer h={10} />
          <button
            onClick={() => { setPhase('idle'); setElapsed(0); setLeftSecs(0); setRightSecs(0); }}
            style={{ width: '100%', padding: '12px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, background: 'transparent', color: T.ink400, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONTS.sans }}
          >
            Start over
          </button>
        </>
      )}
    </>
  );
}

// ── PumpFlow ───────────────────────────────────────────────────────────────
// idle → running → done (WheelPicker for ml) → Save
function PumpFlow({ onSave, isPending, saved }) {
  const [phase,   setPhase]   = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [ml,      setMl]      = useState(80);
  const [pickerIdx, setPickerIdx] = useState(80);
  const startRef  = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function handleStart() {
    startRef.current = Date.now();
    setElapsed(0);
    setPhase('running');
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    try { navigator.vibrate?.(15); } catch (_) {}
  }

  function handleStop() {
    clearInterval(timerRef.current);
    setPhase('done');
  }

  const durationMin = Math.max(1, Math.round(elapsed / 60));

  return (
    <>
      {phase === 'idle' && (
        <>
          <Body size={14} color={T.ink500} style={{ marginBottom: 24, textAlign: 'center' }}>
            Start the timer when you begin pumping.
          </Body>
          <button
            onClick={handleStart}
            style={{
              width: '100%', padding: '18px', borderRadius: RADIUS.lg, border: 'none',
              background: '#AF52DE', color: '#fff', fontSize: 17, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 6px 24px rgba(175,82,222,0.28)',
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}
          >
            <span style={{ fontSize: 18 }}>▶</span>
            Start Pump
          </button>
        </>
      )}

      {phase === 'running' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#AF52DE', animation: 'cb-pulse-dot 1.6s ease-in-out infinite' }} />
            <Mono size={11} color="#AF52DE" style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pumping</Mono>
          </div>
          <div style={{
            textAlign: 'center',
            fontFamily: FONTS.sans,
            fontSize: 'clamp(52px, 16vw, 78px)',
            fontWeight: 300, color: T.ink900,
            letterSpacing: '-0.04em', lineHeight: 1,
            marginBottom: 32,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTimer(elapsed)}
          </div>
          <button
            onClick={handleStop}
            style={{
              width: '100%', padding: '18px', borderRadius: RADIUS.lg, border: 'none',
              background: T.ink900, color: '#fff', fontSize: 17, fontWeight: 700,
              cursor: 'pointer', fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'transform 0.12s ease',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onPointerUp={e => e.currentTarget.style.transform = ''}
            onPointerLeave={e => e.currentTarget.style.transform = ''}
          >
            <span style={{ fontSize: 18 }}>⏹</span>
            End Pump
          </button>
        </>
      )}

      {phase === 'done' && (
        <>
          <Display size={22} italic weight={500} style={{ marginBottom: 4 }}>Pump complete</Display>
          <Body size={13} color={T.ink500} style={{ marginBottom: 4 }}>
            {durationMin} min · How much did you collect?
          </Body>
          <Spacer h={8} />

          <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>Amount collected</Mono>

          <WheelPicker
            items={ML_ITEMS}
            selectedIndex={pickerIdx}
            onChange={(idx) => { setPickerIdx(idx); setMl(idx); }}
            unit="ml"
            style={{ marginBottom: 4 }}
          />

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>
              {ml} <span style={{ fontSize: 18, color: T.ink400 }}>ml</span>
            </div>
          </div>

          <SaveButton
            onSave={() => onSave({ ml, durationMin })}
            isPending={isPending}
            saved={saved}
            label={`Save ${ml} ml`}
          />

          <Spacer h={10} />
          <button
            onClick={() => { setPhase('idle'); setElapsed(0); setMl(80); setPickerIdx(80); }}
            style={{ width: '100%', padding: '12px', borderRadius: RADIUS.md, border: `0.5px solid ${T.line}`, background: 'transparent', color: T.ink400, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONTS.sans }}
          >
            Start over
          </button>
        </>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function FoodTrackerPage() {
  const { id: childId } = useParams();
  const { data: child } = useChildById(childId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedType,  setFeedType]  = useState('breast');
  const [notes,     setNotes]     = useState('');
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const openSheet = (type) => {
    setFeedType(type || 'breast');
    setSaved(false);
    setSaveError('');
    setNotes('');
    setSheetOpen(true);
  };
  const closeSheet = () => { if (!addMutation.isPending) setSheetOpen(false); };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: logs = [] } = useQuery({
    queryKey: ['food-logs', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs').select('*')
        .eq('child_id', childId)
        .order('logged_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });

  // Recent logs for smart suggestions (last 20)
  const recentLogs = useMemo(() => logs.slice(0, 20), [logs]);

  const todayLogs    = logs.filter(l => l.logged_date === today);
  const lastFeed     = todayLogs[0];
  const feedsToday   = todayLogs.length;
  const feedsTarget  = 8;
  const feeds24      = todayLogs.slice(0, 8);

  // Smart suggestions (computed once per sheet open)
  const bottleSuggestions = useMemo(
    () => computeBottleSuggestions(recentLogs, feedType === 'pump' ? 'pump' : 'bottle'),
    [recentLogs, feedType]
  );
  const breastSuggestions = useMemo(
    () => computeBreastSuggestions(recentLogs),
    [recentLogs]
  );

  // ── Mutation ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async ({ ml, durationMin, notes: extraNotes }) => {
      const now  = new Date().toISOString();
      const meta = [];
      if (ml != null) meta.push(`${ml}ml`);
      if (extraNotes) meta.push(extraNotes);
      const combinedNotes = [meta.join(' · '), notes].filter(Boolean).join(' · ') || null;

      const { error } = await supabase.from('food_logs').insert({
        child_id:         childId,
        user_id:          user.id,
        logged_date:      today,
        logged_at:        now,
        food_name:        feedType,
        food_type:        feedType,
        duration_minutes: durationMin ?? null,
        notes:            combinedNotes,
      });
      if (error) throw error;
      return {
        id: crypto.randomUUID(), child_id: childId, user_id: user.id,
        logged_date: today, logged_at: now, food_type: feedType,
        duration_minutes: durationMin ?? null, notes: combinedNotes,
      };
    },
    onSuccess: (newLog) => {
      setSaveError('');
      queryClient.setQueryData(['food-logs', childId], (old = []) => [newLog, ...(old || [])]);
      queryClient.invalidateQueries({ queryKey: ['food-logs', childId] });
      setSaved(true);
      setTimeout(() => {
        setSheetOpen(false);
        setTimeout(() => { setSaved(false); setNotes(''); setFeedType('breast'); }, 400);
      }, 900);
    },
    onError: (err) => setSaveError(err?.message || 'Could not save. Check your connection.'),
  });

  const handleSave = ({ ml, durationMin, notes: extraNotes } = {}) => {
    if (!saved && !addMutation.isPending) addMutation.mutate({ ml, durationMin, notes: extraNotes });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>
      <style>{ANIM}</style>

      {/* ── Header ── */}
      <div style={{ paddingTop: 52 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <Eyebrow color={T.ink300}>FEEDING</Eyebrow>
          <Spacer h={4} />
          <Display size={34} italic weight={600} lh={1.05}>Nourishment</Display>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Hero — 24h ring + stats ── */}
        <Card p={20}>
          <HRow gap={14} align="center">
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
                {Array.from({ length: 24 }).map((_, h) => {
                  const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
                  const r1 = 58, r2 = h % 6 === 0 ? 52 : 55;
                  return <line key={h} x1={65 + Math.cos(a) * r1} y1={65 + Math.sin(a) * r1} x2={65 + Math.cos(a) * r2} y2={65 + Math.sin(a) * r2} stroke={T.line} strokeWidth={h % 6 === 0 ? 1.2 : 0.6} />;
                })}
                <circle cx="65" cy="65" r="48" fill="none" stroke={T.brandWash} strokeWidth="10" />
                {feeds24.map((f, i) => {
                  const hr  = new Date(f.logged_at).getHours() + new Date(f.logged_at).getMinutes() / 60;
                  const dur = (f.duration_minutes || 10) / 60;
                  const a0  = (hr / 24) * Math.PI * 2 - Math.PI / 2;
                  const a1  = ((hr + dur) / 24) * Math.PI * 2 - Math.PI / 2;
                  const x0  = 65 + Math.cos(a0) * 48, y0 = 65 + Math.sin(a0) * 48;
                  const x1  = 65 + Math.cos(a1) * 48, y1 = 65 + Math.sin(a1) * 48;
                  return <path key={i} d={`M${x0},${y0} A48,48 0 0,1 ${x1},${y1}`} fill="none" stroke={T.brand} strokeWidth="10" strokeLinecap="round" />;
                })}
                <text x="65" y="14" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12a</text>
                <text x="121" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6a</text>
                <text x="65" y="123" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">12p</text>
                <text x="9" y="68" textAnchor="middle" fontSize="9" fill={T.ink300} fontWeight="600">6p</text>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>{feedsToday}</div>
                <Mono size={10} color={T.ink300} style={{ marginTop: 2 }}>of {feedsTarget} today</Mono>
              </div>
            </div>

            <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
              {lastFeed ? (
                <>
                  <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}>Last feed</Mono>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 24, fontStyle: 'italic', color: T.ink900, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                    {timeAgo(lastFeed.logged_at)}
                  </div>
                  <Body size={12} color={T.ink500}>
                    {lastFeed.food_type}{lastFeed.duration_minutes ? ` · ${lastFeed.duration_minutes} min` : ''}
                  </Body>
                </>
              ) : (
                <Body size={14} color={T.ink300}>No feeds logged today</Body>
              )}
              <Spacer h={4} />
              <Button variant="primary" size="sm" icon="plus" onClick={() => openSheet()}>Log feed</Button>
            </Stack>
          </HRow>
        </Card>

        <Spacer h={16} />

        {/* ── Quick-tap type tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {FEED_TYPES.map(t => (
            <button key={t.id} onClick={() => !t.soon && openSheet(t.id)}
              aria-label={t.soon ? `${t.label} (coming soon)` : `Log a ${t.label.toLowerCase()} feed`}
              style={{ padding: '12px 6px', borderRadius: RADIUS.md, background: T.surface, border: `0.5px solid ${T.line}`, cursor: t.soon ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', opacity: t.soon ? 0.45 : 1 }}
              onPointerDown={e => { if (!t.soon) e.currentTarget.style.transform = 'scale(0.93)'; }}
              onPointerUp={e => e.currentTarget.style.transform = ''}
              onPointerLeave={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ color: t.color }}><CBIcon name={t.icon} size={20} /></div>
              <Body size={11} color={T.ink900} weight={600}>{t.label}</Body>
              {t.soon && <div style={{ position: 'absolute', top: 4, right: 4, padding: '2px 5px', borderRadius: 4, background: T.line, fontSize: 8, fontWeight: 700, color: T.ink500 }}>SOON</div>}
            </button>
          ))}
        </div>

        <Spacer h={18} />

        {/* ── Dr. Bloom insight ── */}
        {feedsToday > 0 && (
          <AIBubble lead="Pattern today" sparkle>
            {feedsToday >= feedsTarget
              ? `${child?.name} hit the daily feed target. Great job keeping up the rhythm.`
              : `${feedsToday} feeds so far — ${feedsTarget - feedsToday} more to reach today's target. Cluster feeds in the evening are normal.`}
          </AIBubble>
        )}

        <Spacer h={18} />

        {/* ── Today's feeds ── */}
        <HRow justify="space-between" align="baseline" style={{ marginBottom: 8 }}>
          <Display size={18} italic weight={600}>Today's feeds</Display>
          <Mono size={11} color={T.ink300}>{feedsToday} logged</Mono>
        </HRow>

        {todayLogs.length === 0 ? (
          <Card p={24} style={{ textAlign: 'center' }}>
            <Body size={14} color={T.ink300}>No feeds logged yet today.</Body>
          </Card>
        ) : (
          <Card p={0}>
            {todayLogs.map((f, i) => {
              const ft = FEED_TYPES.find(t => t.id === f.food_type);
              // Parse ml from notes for display
              const mlMatch = f.notes?.match(/\b(\d+)ml\b/i);
              const mlLabel = mlMatch ? `${mlMatch[1]} ml` : null;
              const durLabel = f.duration_minutes ? `${f.duration_minutes} min` : null;
              const subParts = [mlLabel, durLabel, f.notes?.replace(/\d+ml\s?·?\s?/gi, '').trim() || null].filter(Boolean);
              return (
                <div key={f.id}>
                  <HRow gap={10} style={{ padding: '12px 14px', animation: i === 0 ? 'cb-slide-in 0.32s ease-out' : 'none' }} align="center">
                    <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: ft ? ft.bg : T.brandWash, color: ft ? ft.color : T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CBIcon name={ft?.icon || 'bottle'} size={15} />
                    </div>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Body size={13} color={T.ink900} weight={600}>
                        {format(new Date(f.logged_at), 'h:mm a')}
                        <span style={{ color: T.ink300, fontWeight: 500 }}> · {f.food_type}</span>
                      </Body>
                      {subParts.length > 0 && (
                        <Body size={11} color={T.ink500}>{subParts.join(' · ')}</Body>
                      )}
                    </Stack>
                    {i === 0 && <div style={{ padding: '3px 8px', borderRadius: 999, background: T.brandWash, color: T.brand, fontSize: 10, fontWeight: 700 }}>{timeAgo(f.logged_at)}</div>}
                  </HRow>
                  {i < todayLogs.length - 1 && <Divider />}
                </div>
              );
            })}
          </Card>
        )}

        <Spacer h={24} />
      </div>

      {/* ── Log sheet ── */}
      <BottomSheet open={sheetOpen} onClose={closeSheet} label={`Log a ${feedType} feed`}>

        {/* Feed type selector — always visible at top */}
        <Mono size={11} color={T.ink300} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'block' }}>Type</Mono>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 22 }}>
          {FEED_TYPES.map(t => (
            <FeedTypeCard key={t.id} type={t} selected={feedType} onSelect={setFeedType} />
          ))}
        </div>

        {/* Error banner */}
        {saveError && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: RADIUS.md, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 13, color: '#dc2626' }}>
            {saveError}
          </div>
        )}

        {/* ── Per-type flow ── */}
        {feedType === 'bottle' && (
          <BottleFlow
            suggestions={bottleSuggestions}
            onSave={handleSave}
            isPending={addMutation.isPending}
            saved={saved}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}

        {feedType === 'breast' && (
          <BreastfeedingFlow
            suggestions={breastSuggestions}
            onSave={handleSave}
            isPending={addMutation.isPending}
            saved={saved}
          />
        )}

        {feedType === 'pump' && (
          <PumpFlow
            onSave={handleSave}
            isPending={addMutation.isPending}
            saved={saved}
          />
        )}

        {feedType === 'solid' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Body size={14} color={T.ink400}>Solid food tracking coming soon.</Body>
          </div>
        )}

      </BottomSheet>
    </div>
  );
}
