import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAchievementStore from '../../stores/achievementStore';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';

const CONFETTI_COLORS = ['#1D9E75', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316', '#EC4899', '#10B981'];

function ConfettiParticle({ x, y, color, size, delay, duration, rotate, shape }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: '-10%',
        width: size,
        height: shape === 'rect' ? size * 0.5 : size,
        borderRadius: shape === 'circle' ? '50%' : shape === 'rect' ? 2 : 4,
        background: color,
        animation: `confetti-fall ${duration}s ease-in ${delay}s both`,
        '--fall-x': `${(x - 50) * 3}px`,
        '--fall-rotate': `${rotate}deg`,
      }}
    />
  );
}

function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 9,
    delay: Math.random() * 0.6,
    duration: 1.8 + Math.random() * 1.2,
    rotate: 180 + Math.random() * 540,
    shape: ['circle', 'rect', 'square'][i % 3],
  }));
}

export default function AchievementCelebration() {
  const { t } = useTranslation();
  const celebration = useAchievementStore((s) => s.celebration);
  const dismiss = useAchievementStore((s) => s.dismissCelebration);
  const particles = useRef(generateParticles(36));

  // Auto-dismiss after 5s
  useEffect(() => {
    if (!celebration) return;
    particles.current = generateParticles(36);
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [celebration, dismiss]);

  if (!celebration) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cb-celebration-title"
      aria-describedby="cb-celebration-desc"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={dismiss}
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(11, 23, 20, 0.72)',
        animation: 'fade-in 0.2s ease-out',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Confetti */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.current.map((p) => (
          <ConfettiParticle key={p.id} {...p} />
        ))}
      </div>

      {/* Card */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          background: T.surface,
          borderRadius: RADIUS.lg,
          padding: '32px 28px',
          textAlign: 'center',
          maxWidth: 320, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          animation: 'achievement-card-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge emoji */}
        <div style={{
          fontSize: 72,
          lineHeight: 1,
          marginBottom: 16,
          animation: 'achievement-badge-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both',
          display: 'block',
        }}>
          {celebration.emoji}
        </div>

        {/* Label */}
        <div style={{
          fontFamily: FONTS.sans, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: celebration.color || T.brand,
          marginBottom: 8,
        }}>
          {t('ach.unlocked', 'Achievement unlocked')}
        </div>

        {/* Title */}
        <div id="cb-celebration-title" style={{
          fontFamily: FONTS.serif, fontSize: 26, fontStyle: 'italic',
          fontWeight: 400, letterSpacing: '-0.02em', color: T.ink900,
          lineHeight: 1.2, marginBottom: 10,
        }}>
          {t(`ach.${celebration.key}.title`, celebration.title)}
        </div>

        {/* Desc */}
        <div id="cb-celebration-desc" style={{
          fontFamily: FONTS.sans, fontSize: 14, color: T.ink500,
          lineHeight: 1.5, marginBottom: 24,
        }}>
          {t(`ach.${celebration.key}.desc`, celebration.desc)}
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          autoFocus
          aria-label="Dismiss achievement"
          style={{
            width: '100%', padding: '13px 0',
            background: celebration.color || T.brand,
            color: '#fff', border: 'none',
            borderRadius: RADIUS.md, cursor: 'pointer',
            fontSize: 15, fontWeight: 700,
            fontFamily: FONTS.sans,
            letterSpacing: '-0.01em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
