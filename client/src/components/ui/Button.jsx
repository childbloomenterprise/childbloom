import { useCallback } from 'react';
import { motion, useSpring } from 'framer-motion';

async function triggerHaptic(intensity = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style = intensity === 'HEAVY' ? ImpactStyle.Heavy
                : intensity === 'MEDIUM' ? ImpactStyle.Medium
                : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    /* Web fallback — silent */
  }
}

const PRESS_SPRING = { stiffness: 500, damping: 28, mass: 0.6 };

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled, loading, className = '', onClick, haptic = 'LIGHT', ...props
}) {
  const scaleSpring = useSpring(1, PRESS_SPRING);

  const handlePressStart = useCallback(() => {
    if (disabled || loading) return;
    scaleSpring.set(0.96);
  }, [disabled, loading, scaleSpring]);

  const handlePressEnd = useCallback(() => {
    if (disabled || loading) return;
    // Spring back with slight overshoot — the "alive" feeling
    scaleSpring.set(1.02);
    setTimeout(() => scaleSpring.set(1), 80);
  }, [disabled, loading, scaleSpring]);

  const handleClick = useCallback((e) => {
    if (disabled || loading) return;
    triggerHaptic(haptic);
    // Ripple
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 2.5;
    const rippleColors = {
      primary:   'rgba(255,255,255,0.30)',
      secondary: 'rgba(255,255,255,0.45)',
      ghost:     'rgba(143,186,200,0.30)',
      danger:    'rgba(220,53,69,0.22)',
    };
    const el = document.createElement('span');
    el.className = 'ripple-wave';
    Object.assign(el.style, {
      width: d + 'px', height: d + 'px',
      left: (e.clientX - rect.left - d / 2) + 'px',
      top:  (e.clientY - rect.top  - d / 2) + 'px',
      background: rippleColors[variant] ?? 'rgba(255,255,255,0.3)',
    });
    btn.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    onClick?.(e);
  }, [disabled, loading, haptic, variant, onClick]);

  const sizes = {
    sm:   'px-4 py-2 text-caption gap-1.5',
    md:   'px-5 py-2.5 text-body gap-2',
    lg:   'px-7 py-3.5 text-body-lg gap-2',
    icon: 'p-2.5',
  };

  const variantStyle = {
    primary: {
      background: '#8FBAC8', color: '#FFFFFF',
      borderColor: 'rgba(143,186,200,0.3)',
      boxShadow: '0 2px 12px rgba(143,186,200,0.30)',
    },
    secondary: {
      background: 'rgba(232,196,184,0.45)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      color: '#3D2B23',
      borderColor: 'rgba(255,255,255,0.7)',
      boxShadow: '0 1px 4px rgba(61,43,35,0.06)',
    },
    ghost:   { background: 'transparent', color: '#5C3D30', borderColor: 'transparent' },
    danger:  { background: 'rgba(220,53,69,0.12)', color: '#C0392B', borderColor: 'rgba(220,53,69,0.25)' },
  };

  return (
    <motion.button
      style={{ scale: scaleSpring, willChange: 'transform', ...variantStyle[variant] }}
      className={[
        'inline-flex items-center justify-center font-semibold tracking-tight',
        'rounded-xl focus:outline-none relative overflow-hidden select-none border',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size] ?? sizes.md,
        className,
      ].join(' ')}
      disabled={disabled || loading}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <motion.svg
          className="-ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </motion.svg>
      )}
      {children}
    </motion.button>
  );
}
