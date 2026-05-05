import { useState } from 'react';
import { T } from '../../../components/cb/tokens';
import CBIcon from '../../../components/cb/CBIcon';
import { MINI_ILLUSTRATIONS } from './illustrations';

export default function EmergencyStepGuide({ steps, accentColor, accentBg }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  function toggleStep(i) {
    setActiveIndex(prev => (prev === i ? -1 : i));
  }

  function markDone(i) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((step, i) => {
        const isOpen = activeIndex === i;
        const isDone = completed.has(i);
        const MiniIllustration = step.stepIllustration
          ? MINI_ILLUSTRATIONS[step.stepIllustration]
          : null;

        return (
          <div
            key={i}
            style={{
              background: isOpen ? T.card : 'rgba(255,255,255,0.7)',
              borderRadius: 16,
              border: `1px solid ${isOpen ? accentColor + '33' : T.ink100}`,
              overflow: 'hidden',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <button
              onClick={() => toggleStep(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 14px',
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}
              aria-expanded={isOpen}
            >
              {/* number badge */}
              <div style={{
                flexShrink: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: isDone ? accentColor : accentBg,
                color: isDone ? '#FFFFFF' : accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                marginTop: 1,
                transition: 'background 0.2s ease, color 0.2s ease',
              }}>
                {isDone ? <CBIcon name="check" size={15} stroke={2.6} /> : i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: T.ink900,
                  letterSpacing: '-0.01em', lineHeight: 1.35,
                }}>
                  {step.title}
                </div>
                {!isOpen && (
                  <div style={{
                    fontSize: 12, color: T.ink300, marginTop: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                  }}>
                    {step.body}
                  </div>
                )}
              </div>

              <CBIcon name="chevron-down" size={16} stroke={2} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 14px 14px 54px' }}>
                {/* body + optional mini illustration side by side */}
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  marginBottom: 12,
                }}>
                  <div style={{
                    fontSize: 14, color: T.ink500, lineHeight: 1.55,
                    letterSpacing: '-0.005em', flex: 1,
                  }}>
                    {step.body}
                  </div>
                  {MiniIllustration && (
                    <div style={{
                      flexShrink: 0,
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: 14,
                      border: `1px solid ${accentColor}22`,
                      padding: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MiniIllustration />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => markDone(i)}
                    style={{
                      padding: '7px 14px', borderRadius: 999,
                      border: `1px solid ${isDone ? accentColor : T.ink100}`,
                      background: isDone ? accentColor : T.card,
                      color: isDone ? '#FFFFFF' : T.ink700,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      letterSpacing: '-0.01em',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <CBIcon name="check" size={13} stroke={2.4} />
                    {isDone ? 'Done' : 'Mark done'}
                  </button>

                  {i < steps.length - 1 && (
                    <button
                      onClick={() => setActiveIndex(i + 1)}
                      style={{
                        padding: '7px 14px', borderRadius: 999,
                        border: 'none',
                        background: T.ink900,
                        color: '#FFFFFF',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        letterSpacing: '-0.01em',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      Next step
                      <CBIcon name="arrow-right" size={13} stroke={2.4} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
