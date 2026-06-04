import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEmergency, SEVERITY, resolveStep } from './data/emergencies';
import { ILLUSTRATIONS, MINI_ILLUSTRATIONS } from './components/illustrations';
import CPRRhythmCoach from './components/CPRRhythmCoach';
import EmergencyTimer from './components/EmergencyTimer';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS } from '../../components/cb/tokens';
import useTextToSpeech from '../../hooks/useTextToSpeech';
import useWakeLock from '../../hooks/useWakeLock';
import { getEmergencyNumber } from '../../lib/emergencyNumber';
import { track } from '../../lib/analytics';

const MUTE_KEY = 'cb_sos_muted';

// Full-screen, one-step-at-a-time Guided Action Mode for a panicking parent.
// Hands-free: each step is read aloud automatically; CPR steps run an audible +
// haptic metronome; timed steps count down and auto-advance. Works fully
// offline (TTS falls back to the browser voice; metronome is local Web Audio).
export default function GuidedActionMode() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const data = getEmergency(topic);

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  });

  const { speak, stop } = useTextToSpeech();
  useWakeLock(!done);

  const emergencyNumber = useMemo(() => getEmergencyNumber(), []);
  const steps = useMemo(() => (data ? data.steps.map(resolveStep) : []), [data]);
  const startedRef = useRef(false);

  // Analytics: protocol started (once).
  useEffect(() => {
    if (data && !startedRef.current) {
      startedRef.current = true;
      track('sos_protocol_started', { type: data.id });
    }
  }, [data]);

  // Auto-speak the current step (unless muted). Offline-first so it never stalls
  // waiting on the TTS API in an emergency.
  useEffect(() => {
    if (!data || done) return;
    const step = steps[idx];
    if (!step) return;
    if (muted) { stop(); return; }
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    speak(step.voice, i18n.language, { preferBrowser: offline });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, muted, done, data]);

  // Stop any speech when leaving the flow.
  useEffect(() => () => stop(), [stop]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch { /* noop */ }
      if (next) stop();
      try { navigator.vibrate?.(8); } catch { /* noop */ }
      return next;
    });
  }, [stop]);

  const finish = useCallback(() => {
    stop();
    setDone(true);
    if (data) track('sos_protocol_completed', { type: data.id });
  }, [stop, data]);

  const goNext = useCallback(() => {
    try { navigator.vibrate?.(10); } catch { /* noop */ }
    setIdx((i) => {
      if (i >= steps.length - 1) { finish(); return i; }
      return i + 1;
    });
  }, [steps.length, finish]);

  const goBack = useCallback(() => {
    try { navigator.vibrate?.(8); } catch { /* noop */ }
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  const onCall = useCallback(() => {
    if (data) track('sos_call_pressed', { type: data.id, number_region: emergencyNumber.region || 'unknown' });
  }, [data, emergencyNumber.region]);

  if (!data) return <Navigate to="/emergency" replace />;

  const sev = SEVERITY[data.severity];
  const step = steps[idx];
  const isLast = idx >= steps.length - 1;

  // Small support illustration: the step's mini, else the protocol's hero (small).
  const Mini = step?.stepIllustration ? MINI_ILLUSTRATIONS[step.stepIllustration] : null;
  const Hero = !Mini ? ILLUSTRATIONS[data.illustration] : null;

  // ── Call bar (persistent on every screen) ──
  const callBar = (
    <a
      href={`tel:${emergencyNumber.number}`}
      onClick={onCall}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', padding: '16px', borderRadius: 16, textDecoration: 'none',
        background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em',
        boxShadow: '0 6px 22px rgba(220,38,38,0.32)',
      }}
      aria-label={t('sos.guided.call', { number: emergencyNumber.number })}
    >
      <CBIcon name="phone" size={22} stroke={2.2} />
      {t('sos.guided.call', { number: emergencyNumber.number })}
    </a>
  );

  // ── Completion screen ──
  if (done) {
    return (
      <div style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans, display: 'flex', flexDirection: 'column', padding: 20 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
            <CBIcon name="check" size={36} stroke={2.4} />
          </div>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 600, color: T.ink900, margin: 0, lineHeight: 1.1 }}>
            {t('sos.guided.completeTitle')}
          </h1>
          <p style={{ fontSize: 16, color: T.ink500, lineHeight: 1.5, maxWidth: 320, margin: 0 }}>
            {t('sos.guided.completeBody')}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
          {callBar}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setDone(false); setIdx(0); startedRef.current = false; }} style={ghostBtn}>
              {t('sos.guided.startOver')}
            </button>
            <button onClick={() => navigate('/emergency')} style={ghostBtn}>
              {t('sos.guided.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', maxHeight: '100dvh', overflow: 'hidden',
      background: `linear-gradient(180deg, ${sev.tint} 0%, ${T.bg} 30%)`,
      fontFamily: FONTS.sans, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header: close · progress · mute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 8px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>
        <button onClick={() => { stop(); navigate('/emergency'); }} aria-label={t('sos.guided.close')} style={iconBtn}>
          <CBIcon name="close" size={22} stroke={2.2} />
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: sev.color, letterSpacing: '0.02em' }}>
            {t('sos.guided.stepOf', { n: idx + 1, total: steps.length })}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {steps.map((_, i) => (
              <span key={i} style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i <= idx ? sev.color : T.ink100, transition: 'all 0.2s ease',
              }} />
            ))}
          </div>
        </div>
        <button onClick={toggleMute} aria-pressed={muted} aria-label={muted ? t('sos.guided.unmute') : t('sos.guided.mute')}
          style={{ ...iconBtn, color: muted ? T.ink300 : sev.color }}>
          <CBIcon name={muted ? 'volume-x' : 'volume-2'} size={22} stroke={2.2} />
        </button>
      </div>

      {/* Step body (scrollable middle) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <h1 style={{
          fontFamily: FONTS.serif, fontWeight: 600, fontSize: 30, lineHeight: 1.12,
          letterSpacing: '-0.02em', color: T.ink900, margin: '8px 0 0',
        }}>
          {step.action}
        </h1>

        {/* Metronome (CPR) — auto-running, mute-aware */}
        {step.metronome && data.rhythmCoach && (
          <div style={{ width: '100%', maxWidth: 420 }}>
            <CPRRhythmCoach kind={data.rhythmCoach} autoStart muted={muted} />
          </div>
        )}

        {/* Countdown timer */}
        {step.seconds && (
          <EmergencyTimer
            seconds={step.seconds}
            color={sev.color}
            running
            onComplete={step.autoAdvance ? goNext : undefined}
          />
        )}

        {/* Support illustration (only when no metronome/timer dominates) */}
        {!step.metronome && !step.seconds && (Mini || Hero) && (
          <div style={{ width: '100%', maxWidth: 240, opacity: 0.95 }}>
            {Mini ? <Mini /> : <Hero severityColor={sev.color} />}
          </div>
        )}

        {/* Detail */}
        {step.detail && (
          <p style={{ fontSize: 17, color: T.ink700, lineHeight: 1.5, maxWidth: 420, margin: 0 }}>
            {step.detail}
          </p>
        )}

        {/* Metronome depth cue */}
        {step.metronome?.depthCue && (
          <div style={{ fontSize: 15, fontWeight: 700, color: sev.color }}>
            {step.metronome.depthCue}
          </div>
        )}

        {/* Calming microcopy */}
        {step.reassure && (
          <div style={{ fontSize: 15, fontStyle: 'italic', color: '#16A34A', maxWidth: 380, lineHeight: 1.45 }}>
            {step.reassure}
          </div>
        )}
      </div>

      {/* Footer: Call bar + nav */}
      <div style={{ padding: '10px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)', display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${T.ink100}`, background: T.bg }}>
        {callBar}
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
          <button onClick={goBack} disabled={idx === 0} aria-label={t('sos.guided.back')}
            style={{ ...ghostBtn, flex: '0 0 96px', opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}>
            {t('sos.guided.back')}
          </button>
          <button onClick={goNext}
            style={{
              flex: 1, padding: '18px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: sev.color, color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em',
              boxShadow: `0 6px 18px ${sev.color}44`, fontFamily: FONTS.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {isLast ? t('sos.guided.finish') : t('sos.guided.next')}
            {!isLast && <CBIcon name="arrow-right" size={20} stroke={2.4} />}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
          <button onClick={() => { stop(); navigate(`/emergency/${data.id}`); }}
            style={{ background: 'transparent', border: 'none', color: T.ink400, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            {t('sos.guided.readAll')}
          </button>
          {data.source && (
            <span style={{ fontSize: 10, color: T.ink300 }}>
              {t('sos.guided.reviewed', { source: data.source, date: data.lastReviewed })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 44, height: 44, borderRadius: 12, border: 'none', background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  color: 'var(--ink-700)', flexShrink: 0,
};

const ghostBtn = {
  flex: 1, padding: '16px', borderRadius: 16, border: `1px solid var(--ink-100)`,
  background: 'var(--surface)', color: 'var(--ink-700)', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: FONTS.sans,
};
