import { useEffect, useRef, useState } from 'react';
import CBIcon from '../../../components/cb/CBIcon';
import { T } from '../../../components/cb/tokens';

// Live 30-compressions → 2-breaths pacing aid with synced visual demonstrator.
// `kind` selects the compression cadence:
//   'infant' — 110 bpm (≈545 ms / compression)  — 2 fingers
//   'child'  — 105 bpm (≈571 ms / compression)  — heel of hand
const CADENCE = {
  infant: 545,
  child:  571,
};
const BREATH_MS = 3000;
const COMPRESSIONS_PER_CYCLE = 30;
const BREATHS_PER_CYCLE = 2;
const RING_RADIUS = 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const RED   = '#DC2626';
const GREEN = '#16A34A';

// ─── Animated CPR demonstrators ──────────────────────────────────

function InfantCPRDemo({ pressDepth, isBreathing }) {
  const handY       = pressDepth * 7;
  const chestScaleY = 1 - pressDepth * 0.09;
  const handOpacity = isBreathing ? 0 : 1;
  const breathOpac  = isBreathing ? 1 : 0;
  const p = 'ic'; // ID prefix — unique to this SVG

  return (
    <svg viewBox="0 0 160 130" width="100%" style={{ maxHeight: 160 }} aria-hidden="true">
      <defs>
        {/* skin — warm radial: lit top-left, shadowed edge */}
        <radialGradient id={`${p}sk`} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFE8CA" />
          <stop offset="50%"  stopColor="#F2C9A0" />
          <stop offset="100%" stopColor="#B8723A" />
        </radialGradient>
        {/* darker skin for back of hand */}
        <radialGradient id={`${p}skd`} cx="40%" cy="25%" r="65%">
          <stop offset="0%"   stopColor="#F0D0A0" />
          <stop offset="60%"  stopColor="#D4A070" />
          <stop offset="100%" stopColor="#8B5030" />
        </radialGradient>
        {/* diaper — light blue gradient */}
        <linearGradient id={`${p}dp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D6E8F8" />
          <stop offset="100%" stopColor="#9EC4E8" />
        </linearGradient>
        {/* specular highlight — white radial for volume */}
        <radialGradient id={`${p}hl`} cx="40%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.72)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* drop shadow on hands */}
        <filter id={`${p}fs`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="3" stdDeviation="4"
            floodColor="#1a0805" floodOpacity="0.30" />
        </filter>
        {/* breath green radial */}
        <radialGradient id={`${p}br`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={GREEN} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── infant body — top-down view ── */}
      {/* head shadow */}
      <ellipse cx="33" cy="67" rx="22" ry="20" fill="rgba(0,0,0,0.10)" />
      {/* head */}
      <ellipse cx="32" cy="65" rx="22" ry="20" fill={`url(#${p}sk)`} />
      <ellipse cx="26" cy="59" rx="10" ry="7" fill={`url(#${p}hl)`} />
      {/* ear */}
      <ellipse cx="32" cy="79" rx="5" ry="3" fill="url(#icskd)" />
      {/* hair */}
      <ellipse cx="20" cy="57" rx="14" ry="9" fill="#3D2B1A" opacity="0.82" />

      {/* neck */}
      <rect x="50" y="58" width="8" height="14" rx="3" fill={`url(#${p}sk)`} />

      {/* torso shadow */}
      <path d="M58 52 Q71 46 119 50 Q129 54 129 67 Q129 80 119 84 Q71 88 58 82 Z"
        fill="rgba(0,0,0,0.08)" transform="translate(2,2)" />
      {/* torso */}
      <path
        d={`M57 50 Q70 44 118 48 Q128 52 128 65 Q128 78 118 82 Q70 86 57 80 Z`}
        fill={`url(#${p}sk)`}
        style={{
          transform: `scaleY(${chestScaleY})`,
          transformOrigin: '92px 75px',
          transition: 'transform 60ms linear',
        }}
      />
      {/* chest highlight */}
      <ellipse cx="85" cy="57" rx="22" ry="8" fill={`url(#${p}hl)`} opacity="0.55"
        style={{ transform: `scaleY(${chestScaleY})`, transformOrigin: '85px 65px', transition: 'transform 60ms linear' }} />

      {/* diaper */}
      <path d="M108 76 Q120 80 124 86 L114 94 Q100 97 88 94 L80 88 Q94 82 108 76 Z"
        fill={`url(#${p}dp)`} stroke="#7AAACA" strokeWidth="0.8" />

      {/* nipple line guide */}
      <line x1="70" y1="58" x2="118" y2="58"
        stroke={RED} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* ── two-finger compression hand ── */}
      <g
        filter={`url(#${p}fs)`}
        style={{
          transform: `translateY(${handY}px)`,
          opacity: handOpacity,
          transition: 'transform 60ms linear, opacity 0.3s ease',
        }}
      >
        {/* palm */}
        <path d="M78 26 Q76 16 88 14 Q100 12 102 22 Q102 30 90 32 Q80 32 78 26 Z"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.25)" strokeWidth="1" />
        {/* index finger */}
        <path d="M82 14 Q80 4 82 0 Q84 -4 87 -2 Q90 0 89 8 L87 14 Z"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.22)" strokeWidth="1" />
        {/* middle finger */}
        <path d="M90 14 Q88 2 91 -2 Q93 -6 96 -4 Q99 -2 98 6 L96 14 Z"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.22)" strokeWidth="1" />
        {/* finger groove shadow */}
        <path d="M88 14 L88 6" stroke="rgba(80,35,10,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        {/* knuckle specular */}
        <ellipse cx="84" cy="4" rx="4" ry="2" fill={`url(#${p}hl)`} opacity="0.7" />
        <ellipse cx="93" cy="2" rx="4" ry="2" fill={`url(#${p}hl)`} opacity="0.7" />
        {/* knuckle flush — brightens at peak compression */}
        <ellipse cx="88" cy="8" rx="9" ry="3.5"
          fill={RED} opacity={0.08 + pressDepth * 0.50} />
        {/* nail hints */}
        <ellipse cx="84" cy="-1" rx="2.5" ry="1.2" fill="rgba(255,220,200,0.7)" />
        <ellipse cx="93" cy="-3" rx="2.5" ry="1.2" fill="rgba(255,220,200,0.7)" />
        {/* palm highlight */}
        <ellipse cx="89" cy="22" rx="9" ry="4" fill={`url(#${p}hl)`} opacity="0.45" />
      </g>

      {/* pressure pulse ring */}
      <circle cx="88" cy="65" r="9"
        fill={RED} opacity={0.08 + pressDepth * 0.14}
        style={{ transition: 'opacity 60ms linear' }} />

      {/* ── breath phase — mouth-to-nose seal silhouette ── */}
      <g style={{ opacity: breathOpac, transition: 'opacity 0.4s ease' }}>
        {/* shadow */}
        <circle cx="89" cy="20" r="16" fill="rgba(0,0,0,0.12)" />
        {/* adult head */}
        <circle cx="88" cy="18" r="16" fill={`url(#${p}sk)`} />
        <ellipse cx="82" cy="12" rx="8" ry="5" fill={`url(#${p}hl)`} opacity="0.55" />
        {/* hair */}
        <ellipse cx="80" cy="8" rx="14" ry="10" fill="#2A1A0A" opacity="0.75" />
        {/* mouth covering infant mouth+nose */}
        <ellipse cx="88" cy="32" rx="12" ry="8"
          fill={`url(#${p}sk)`} stroke="rgba(80,30,10,0.2)" strokeWidth="0.8" />
        {/* lip line */}
        <path d="M78 30 Q88 33 98 30" stroke="rgba(160,60,40,0.4)" strokeWidth="1.2" fill="none" />
        {/* breath halo */}
        <ellipse cx="88" cy="65" rx="24" ry="10"
          fill={`url(#${p}br)`}
          style={{
            animation: isBreathing ? 'breath-cycle 3s ease-in-out infinite' : 'none',
            transformOrigin: '88px 65px',
          }}
        />
        <text x="88" y="112" textAnchor="middle" fontSize="9"
          fill={GREEN} fontFamily="Inter, sans-serif" fontWeight="600">
          Watch chest rise
        </text>
      </g>
    </svg>
  );
}

function ChildCPRDemo({ pressDepth, isBreathing }) {
  const handY       = pressDepth * 7;
  const chestScaleY = 1 - pressDepth * 0.09;
  const handOpacity = isBreathing ? 0 : 1;
  const breathOpac  = isBreathing ? 1 : 0;
  const p = 'cc'; // ID prefix — unique to this SVG

  return (
    <svg viewBox="0 0 170 130" width="100%" style={{ maxHeight: 160 }} aria-hidden="true">
      <defs>
        <radialGradient id={`${p}sk`} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFE8CA" />
          <stop offset="50%"  stopColor="#F2C9A0" />
          <stop offset="100%" stopColor="#B8723A" />
        </radialGradient>
        <radialGradient id={`${p}skd`} cx="40%" cy="25%" r="65%">
          <stop offset="0%"   stopColor="#F0D0A0" />
          <stop offset="60%"  stopColor="#D4A070" />
          <stop offset="100%" stopColor="#8B5030" />
        </radialGradient>
        {/* shirt — light blue */}
        <linearGradient id={`${p}cl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#E0EAF6" />
          <stop offset="55%"  stopColor="#B0C8E2" />
          <stop offset="100%" stopColor="#7A9BBE" />
        </linearGradient>
        <radialGradient id={`${p}hl`} cx="40%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.72)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={`${p}fs`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="3" stdDeviation="4"
            floodColor="#1a0805" floodOpacity="0.30" />
        </filter>
        <radialGradient id={`${p}br`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={GREEN} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── child body — top-down view ── */}
      {/* head shadow */}
      <ellipse cx="31" cy="67" rx="21" ry="19" fill="rgba(0,0,0,0.10)" />
      {/* head */}
      <ellipse cx="30" cy="65" rx="20" ry="18" fill={`url(#${p}sk)`} />
      <ellipse cx="24" cy="59" rx="9" ry="6" fill={`url(#${p}hl)`} />
      {/* hair */}
      <ellipse cx="18" cy="55" rx="16" ry="11" fill="#3D2B1A" opacity="0.80" />

      {/* neck */}
      <rect x="46" y="58" width="10" height="14" rx="4" fill={`url(#${p}sk)`} />

      {/* torso shadow */}
      <path d="M56 48 Q73 40 139 44 Q151 50 151 67 Q151 84 139 90 Q73 94 56 86 Z"
        fill="rgba(0,0,0,0.08)" transform="translate(2,2)" />
      {/* shirt/torso */}
      <path
        d="M55 46 Q72 38 138 42 Q150 48 150 65 Q150 82 138 88 Q72 92 55 84 Z"
        fill={`url(#${p}cl)`}
        style={{
          transform: `scaleY(${chestScaleY})`,
          transformOrigin: '100px 75px',
          transition: 'transform 60ms linear',
        }}
      />
      {/* collar opening */}
      <ellipse cx="95" cy="46" rx="10" ry="5" fill={`url(#${p}sk)`} />
      {/* chest highlight */}
      <ellipse cx="96" cy="52" rx="26" ry="9" fill={`url(#${p}hl)`} opacity="0.40"
        style={{ transform: `scaleY(${chestScaleY})`, transformOrigin: '96px 65px', transition: 'transform 60ms linear' }} />
      {/* shirt seam */}
      <path d="M78 40 L78 90" stroke="rgba(80,110,150,0.22)" strokeWidth="1.2" />

      {/* ── heel-of-hand compression ── */}
      <g
        filter={`url(#${p}fs)`}
        style={{
          transform: `translateY(${handY}px)`,
          opacity: handOpacity,
          transition: 'transform 60ms linear, opacity 0.3s ease',
        }}
      >
        {/* lower palm / heel shadow */}
        <path d="M85 24 Q83 12 100 10 Q117 12 115 24 Q115 34 100 36 Q85 34 85 24 Z"
          fill="rgba(0,0,0,0.12)" transform="translate(2,2)" />
        {/* lower palm / heel */}
        <path d="M84 22 Q82 10 100 8 Q118 10 116 22 Q116 32 100 34 Q84 32 84 22 Z"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.22)" strokeWidth="0.8" />
        {/* heel pad highlight */}
        <ellipse cx="100" cy="22" rx="12" ry="5" fill={`url(#${p}hl)`} opacity="0.50" />
        {/* second hand stacked */}
        <path d="M86 10 Q86 0 100 -2 Q114 0 114 10 L100 12 Z"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.20)" strokeWidth="0.8" />
        {/* top hand highlight */}
        <ellipse cx="100" cy="4" rx="11" ry="4" fill={`url(#${p}hl)`} opacity="0.45" />
        {/* interlaced fingers */}
        <path d="M89 0 L89 -8 Q89 -12 93 -12 Q97 -12 97 -8 L97 -2"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.20)" strokeWidth="0.8" />
        <path d="M100 -2 L100 -10 Q100 -14 104 -14 Q108 -14 108 -10 L108 -2"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.20)" strokeWidth="0.8" />
        <path d="M110 0 L110 -8 Q110 -12 114 -12 Q118 -12 118 -8 L118 -2"
          fill={`url(#${p}skd)`} stroke="rgba(100,50,20,0.20)" strokeWidth="0.8" />
        {/* finger nail hints */}
        <ellipse cx="91" cy="-11" rx="2.5" ry="1.2" fill="rgba(255,220,200,0.7)" />
        <ellipse cx="102" cy="-13" rx="2.5" ry="1.2" fill="rgba(255,220,200,0.7)" />
        <ellipse cx="112" cy="-11" rx="2.5" ry="1.2" fill="rgba(255,220,200,0.7)" />
        {/* heel pressure flush */}
        <ellipse cx="100" cy="28" rx="13" ry="5"
          fill={RED} opacity={0.06 + pressDepth * 0.48} />
        {/* wrist shadow line */}
        <path d="M84 22 Q100 24 116 22" stroke="rgba(80,35,10,0.25)" strokeWidth="1.2" fill="none" />
      </g>

      {/* pressure ring */}
      <circle cx="100" cy="65" r="11"
        fill={RED} opacity={0.07 + pressDepth * 0.13}
        style={{ transition: 'opacity 60ms linear' }} />

      {/* ── breath phase ── */}
      <g style={{ opacity: breathOpac, transition: 'opacity 0.4s ease' }}>
        {/* shadow */}
        <circle cx="101" cy="24" r="19" fill="rgba(0,0,0,0.12)" />
        {/* adult head */}
        <circle cx="100" cy="22" r="18" fill={`url(#${p}sk)`} />
        <ellipse cx="93" cy="15" rx="9" ry="6" fill={`url(#${p}hl)`} opacity="0.50" />
        {/* hair */}
        <ellipse cx="91" cy="10" rx="16" ry="11" fill="#2A1A0A" opacity="0.78" />
        {/* nose pinch + mouth seal */}
        <ellipse cx="100" cy="38" rx="14" ry="8"
          fill={`url(#${p}sk)`} stroke="rgba(80,30,10,0.18)" strokeWidth="0.8" />
        {/* lip line */}
        <path d="M88 36 Q100 40 112 36" stroke="rgba(160,60,40,0.4)" strokeWidth="1.2" fill="none" />
        {/* breath halo */}
        <ellipse cx="100" cy="65" rx="30" ry="11"
          fill={`url(#${p}br)`}
          style={{
            animation: isBreathing ? 'breath-cycle 3s ease-in-out infinite' : 'none',
            transformOrigin: '100px 65px',
          }}
        />
        <text x="100" y="112" textAnchor="middle" fontSize="9"
          fill={GREEN} fontFamily="Inter, sans-serif" fontWeight="600">
          Pinch nose · watch chest rise
        </text>
      </g>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function CPRRhythmCoach({ kind = 'infant' }) {
  const compressionMs = CADENCE[kind] || CADENCE.infant;

  const [running, setRunning] = useState(false);
  const [phase, setPhase]     = useState('compress');
  const [count, setCount]     = useState(0);
  const [cycle, setCycle]     = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [subProgress, setSubProgress] = useState(0); // 0→1 within a single compression

  const phaseStartRef  = useRef(null);
  const totalStartRef  = useRef(null);
  const lastCountRef   = useRef(0);
  const rafRef         = useRef(null);

  function reset() {
    setRunning(false);
    setPhase('compress');
    setCount(0);
    setCycle(1);
    setElapsed(0);
    setSubProgress(0);
    phaseStartRef.current = null;
    totalStartRef.current = null;
    lastCountRef.current  = 0;
    cancelAnimationFrame(rafRef.current);
  }

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const now = performance.now();
      if (totalStartRef.current == null) totalStartRef.current = now;
      if (phaseStartRef.current == null) phaseStartRef.current = now;

      setElapsed(Math.floor((now - totalStartRef.current) / 1000));

      const phaseDuration = phase === 'compress' ? compressionMs : BREATH_MS;
      const phaseLimit    = phase === 'compress' ? COMPRESSIONS_PER_CYCLE : BREATHS_PER_CYCLE;
      const sinceStart    = now - phaseStartRef.current;
      const next          = Math.min(phaseLimit, Math.floor(sinceStart / phaseDuration));

      // sub-compression progress (0→1) — drives hand animation
      if (phase === 'compress') {
        const withinCompression = (sinceStart % phaseDuration) / phaseDuration;
        // triangle wave: goes 0→1→0 within one compression cycle
        const p = withinCompression < 0.5
          ? withinCompression * 2
          : (1 - withinCompression) * 2;
        setSubProgress(p);
      } else {
        setSubProgress(0);
      }

      if (next !== count) setCount(next);

      if (next >= phaseLimit) {
        if (phase === 'compress') {
          setPhase('breathe');
        } else {
          setPhase('compress');
          setCycle(c => c + 1);
        }
        setCount(0);
        phaseStartRef.current = now;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, phase, count, compressionMs]);

  const phaseLimit    = phase === 'compress' ? COMPRESSIONS_PER_CYCLE : BREATHS_PER_CYCLE;
  const progress      = count / phaseLimit;
  const dashOffset    = RING_CIRCUMFERENCE * (1 - progress);
  const ringColor     = phase === 'compress' ? RED : GREEN;
  const isBreathing   = phase === 'breathe';
  const instruction   = isBreathing
    ? 'Two small puffs — watch the chest rise'
    : 'Push hard and fast';
  const minutes       = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds       = (elapsed % 60).toString().padStart(2, '0');
  const displayCount  = Math.min(count + (running && !isBreathing ? 1 : 0), phaseLimit);

  // The visual press depth: 0 at rest, rises and falls with each compression
  const pressDepth = running && !isBreathing ? subProgress : 0;

  return (
    <div style={{
      background: T.card,
      borderRadius: 22,
      padding: '20px 16px 18px',
      boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
      border: `1px solid ${T.ink100}`,
    }}>
      {/* safety caption */}
      <div style={{
        fontSize: 11, color: T.ink300, textAlign: 'center',
        marginBottom: 14, lineHeight: 1.4,
      }}>
        Pacing aid only. Continue until help arrives or the child responds.
      </div>

      {/* demonstrator + counter row */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* animated demonstrator */}
        <div style={{
          width: '100%', maxWidth: 260,
          background: isBreathing
            ? `rgba(${GREEN.slice(1).match(/../g).map(h => parseInt(h, 16)).join(',')},0.06)`
            : 'rgba(220,38,38,0.05)',
          borderRadius: 18,
          padding: '12px 16px 8px',
          border: `1px solid ${isBreathing ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.18)'}`,
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}>
          {kind === 'infant'
            ? <InfantCPRDemo pressDepth={pressDepth} isBreathing={isBreathing} />
            : <ChildCPRDemo  pressDepth={pressDepth} isBreathing={isBreathing} />
          }
          {/* phase label under demonstrator */}
          {!running && (
            <div style={{
              textAlign: 'center', fontSize: 11, color: T.ink300,
              marginTop: 4, letterSpacing: '-0.005em',
            }}>
              {kind === 'infant' ? '2 fingers · centre of chest' : 'heel of hand · lower sternum'}
            </div>
          )}
        </div>

        {/* ring + counter */}
        <div style={{ position: 'relative', width: 158, height: 158, flexShrink: 0 }}>
          <svg width="158" height="158" viewBox="0 0 158 158">
            {/* track */}
            <circle cx="79" cy="79" r={RING_RADIUS} fill="none" stroke={T.ink100} strokeWidth="9" />
            {/* progress arc */}
            <circle
              cx="79" cy="79" r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 79 79)"
              style={{ transition: 'stroke-dashoffset 60ms linear, stroke 0.3s ease' }}
            />
            {/* breath halo */}
            {isBreathing && running && (
              <circle className="breath-cycle" cx="79" cy="79" r="28"
                fill={ringColor} opacity="0.14" />
            )}
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 48, fontWeight: 600, color: T.ink900,
              lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              {displayCount}
            </div>
            <div style={{
              fontSize: 10, color: T.ink300, marginTop: 4,
              fontWeight: 500, letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {isBreathing ? `of ${BREATHS_PER_CYCLE} breaths` : `of ${COMPRESSIONS_PER_CYCLE}`}
            </div>
          </div>
        </div>
      </div>

      {/* instruction */}
      <div style={{
        textAlign: 'center', fontSize: 15, fontWeight: 600,
        color: ringColor, marginTop: 14, letterSpacing: '-0.01em',
        lineHeight: 1.3,
        transition: 'color 0.3s ease',
      }}>
        {instruction}
      </div>

      {/* meta row */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        marginTop: 8, marginBottom: 18,
        fontSize: 12, color: T.ink300,
      }}>
        <span>Cycle <strong style={{ color: T.ink700, fontWeight: 600 }}>{cycle}</strong></span>
        <span>{minutes}:{seconds}</span>
      </div>

      {/* controls */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            border: 'none',
            background: running ? T.ink900 : RED,
            color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: running
              ? '0 4px 12px rgba(0,0,0,0.15)'
              : '0 6px 18px rgba(220,38,38,0.40)',
            transition: 'transform 0.15s ease, box-shadow 0.2s ease',
          }}
          aria-label={running ? 'Pause' : 'Start'}
        >
          <CBIcon name={running ? 'pause' : 'play'} size={26} stroke={2} />
        </button>
        <button
          onClick={reset}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: `1px solid ${T.ink100}`,
            background: T.card,
            color: T.ink700,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.01em',
          }}
          aria-label="Reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
