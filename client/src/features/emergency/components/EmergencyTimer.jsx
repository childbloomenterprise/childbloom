import useCountdown, { formatCountdown } from '../../../hooks/useCountdown';
import { T } from '../../../components/cb/tokens';

const R = 54;
const CIRC = 2 * Math.PI * R;

// Big countdown ring for a guided step's timer (3-sec hold, 10-sec rub,
// 5-min second-dose wait, 20-min burn cooling, …). Counts down once and calls
// `onComplete` when it reaches zero — the parent passes this to auto-advance.
export default function EmergencyTimer({ seconds, color = '#DC2626', running = true, onComplete, label }) {
  const { remaining } = useCountdown(seconds, { running, onComplete });
  const progress = seconds > 0 ? Math.max(0, remaining / seconds) : 0;
  const offset = CIRC * (1 - progress);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r={R} fill="none" stroke={T.ink100} strokeWidth="8" />
          <circle
            cx="70" cy="70" r={R} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.12s linear' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div
            role="timer"
            aria-live="off"
            style={{ fontFamily: "'Fraunces', serif", fontSize: 46, fontWeight: 600, color: T.ink900, lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            {formatCountdown(remaining)}
          </div>
          <div style={{ fontSize: 10, color: T.ink300, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            {seconds >= 60 ? 'min : sec' : 'seconds'}
          </div>
        </div>
      </div>
      {label && (
        <div style={{ fontSize: 13, color: T.ink500, textAlign: 'center', maxWidth: 280, lineHeight: 1.4 }}>
          {label}
        </div>
      )}
    </div>
  );
}
