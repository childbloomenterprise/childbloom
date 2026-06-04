import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getEmergency, SEVERITY } from './data/emergencies';
import { ILLUSTRATIONS } from './components/illustrations';
import CPRRhythmCoach from './components/CPRRhythmCoach';
import EmergencyStepGuide from './components/EmergencyStepGuide';
import CBIcon from '../../components/cb/CBIcon';
import { T } from '../../components/cb/tokens';

export default function EmergencyTopicPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [slowMode, setSlowMode] = useState(false);
  const data = getEmergency(topic);

  if (!data) return <Navigate to="/emergency" replace />;

  const sev = SEVERITY[data.severity];
  const Illustration = ILLUSTRATIONS[data.illustration];

  return (
    <div style={{
      background: T.bg,
      minHeight: '100dvh',
      fontFamily: "-apple-system, 'Inter', system-ui, sans-serif",
    }}>
      {/* Back chevron header */}
      <div style={{ paddingTop: 16, paddingLeft: 12 }}>
        <button
          onClick={() => navigate('/emergency')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: sev.color, fontSize: 14, fontWeight: 600,
            padding: '6px 8px', letterSpacing: '-0.01em',
          }}
        >
          <CBIcon name="chevron-left" size={18} stroke={2.2} />
          First-Aid
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: sev.color,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          {sev.label}
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 32,
          lineHeight: 1.08, letterSpacing: '-0.025em', color: T.ink900, margin: 0,
        }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <div style={{ fontSize: 14, color: T.ink500, marginTop: 6, letterSpacing: '-0.01em' }}>
            {data.subtitle}
          </div>
        )}

        {/* Hands-free guided mode CTA */}
        <button
          onClick={() => navigate(`/emergency/${data.id}/guided`)}
          style={{
            marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '15px 16px', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: sev.color, color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em',
            fontFamily: "-apple-system, 'Inter', system-ui, sans-serif",
            boxShadow: `0 6px 18px ${sev.color}44`,
          }}
        >
          <CBIcon name="play" size={18} stroke={2.4} />
          Start guided mode — read aloud, step by step
        </button>
      </div>

      {/* Critical first call-out */}
      {data.callOutFirst && (
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <div style={{
            background: sev.tint,
            border: `1px solid ${sev.border}`,
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: sev.color, color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 13, fontWeight: 800,
              marginTop: 1,
            }}>
              !
            </div>
            <div style={{ fontSize: 13, color: T.ink700, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
              {data.callOutFirst}
            </div>
          </div>
        </div>
      )}

      {/* Hero illustration */}
      {Illustration && (
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <div
            className={slowMode ? 'slow-mode' : ''}
            style={{
              background: `linear-gradient(160deg, ${T.card} 70%, ${sev.color}0D 100%)`,
              borderRadius: 22,
              padding: 24,
              boxShadow: `0 6px 24px ${sev.color}18`,
              border: `1px solid ${sev.color}28`,
              position: 'relative',
            }}
          >
            {/* slow-mode chip */}
            <button
              onClick={() => setSlowMode(s => !s)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 1,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${slowMode ? sev.color : T.ink100}`,
                background: slowMode ? sev.color + '18' : 'rgba(255,255,255,0.85)',
                color: slowMode ? sev.color : T.ink400,
                fontSize: 10, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              aria-pressed={slowMode}
            >
              <CBIcon name={slowMode ? 'pause' : 'play'} size={10} stroke={2.5} />
              {slowMode ? 'Slow ✓' : 'Slow down'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Illustration severityColor={sev.color} />
            </div>
          </div>
        </div>
      )}

      {/* Rhythm coach (CPR only) */}
      {data.rhythmCoach && (
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <CPRRhythmCoach kind={data.rhythmCoach} />
        </div>
      )}

      {/* Steps */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: T.ink300,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 10, paddingLeft: 4,
        }}>
          Step by step
        </div>
        <EmergencyStepGuide
          steps={data.steps}
          accentColor={sev.color}
          accentBg={sev.badgeBg}
        />
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '20px 16px 24px' }}>
        <div style={{
          background: T.bgWarm,
          border: `1px solid ${T.ink100}`,
          borderRadius: 14,
          padding: '12px 14px',
          fontSize: 11, color: T.ink300,
          textAlign: 'center', lineHeight: 1.5,
        }}>
          For first-aid reference only. Always follow the advice of your child's doctor and local emergency services. If your child is in immediate danger, contact your local emergency number.
          {data.source && (
            <div style={{ marginTop: 6, fontWeight: 600 }}>
              Source: {data.source} · Reviewed {data.lastReviewed}
            </div>
          )}
        </div>
      </div>

      {/* tab-bar clearance */}
      <div style={{ height: 16 }} />
    </div>
  );
}
