// Surface primitives — Card, Chip, Button, ProgressBar.
import { T, FONTS, RADIUS } from '../tokens';
import CBIcon from '../CBIcon';
import { motion, useSpring } from 'framer-motion';

async function triggerHaptic(intensity = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style = intensity === 'HEAVY' ? ImpactStyle.Heavy
                : intensity === 'MEDIUM' ? ImpactStyle.Medium
                : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch { /* web fallback */ }
}

const PRESS_SPRING = { stiffness: 500, damping: 28, mass: 0.6 };

const RADIUS_KEY = { xs: RADIUS.xs, sm: RADIUS.sm, md: RADIUS.md, lg: RADIUS.lg, xl: RADIUS.xl };

export function Card({ children, p = 18, radius = 'lg', tone = 'surface', onClick, style, className }) {
  const r = RADIUS_KEY[radius] ?? RADIUS.lg;
  const bg =
    tone === 'warm'  ? T.surfaceWarm :
    tone === 'dim'   ? T.surfaceDim  :
    tone === 'brand' ? T.brand       :
    tone === 'wash'  ? T.brandWash   :
    tone === 'tint'  ? T.brandTint   :
    T.surface;
  const fg = tone === 'brand' ? '#fff' : T.ink900;
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bg,
        borderRadius: r,
        padding: p,
        boxShadow: 'var(--shadow-md), var(--shadow-ring)',
        color: fg,
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'transform 0.15s ease, box-shadow 0.15s ease' : undefined,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={onClick ? (e => { e.currentTarget.style.transform = 'scale(0.985)'; }) : undefined}
      onTouchEnd={onClick ? (e => { e.currentTarget.style.transform = ''; }) : undefined}
      onMouseDown={onClick ? (e => { e.currentTarget.style.transform = 'scale(0.985)'; }) : undefined}
      onMouseUp={onClick ? (e => { e.currentTarget.style.transform = ''; }) : undefined}
    >{children}</div>
  );
}

export function Chip({ children, tone = 'wash', icon, onClick, style }) {
  const bg =
    tone === 'wash'   ? T.brandWash :
    tone === 'cream'  ? T.cream     :
    tone === 'soft'   ? T.surfaceDim :
    tone === 'accent' ? T.accentSoft :
    tone === 'brand'  ? T.brand     :
    T.surface;
  const fg =
    tone === 'wash'   ? T.brand :
    tone === 'accent' ? T.accent :
    tone === 'brand'  ? '#fff' :
    T.ink700;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 28,
        padding: '0 12px', borderRadius: RADIUS.pill,
        background: bg, color: fg,
        fontFamily: FONTS.sans, fontSize: 12, fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        transition: onClick ? 'transform 0.12s ease, opacity 0.12s ease' : undefined,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={onClick ? (e => { e.currentTarget.style.transform = 'scale(0.93)'; }) : undefined}
      onTouchEnd={onClick ? (e => { e.currentTarget.style.transform = ''; }) : undefined}
      onMouseDown={onClick ? (e => { e.currentTarget.style.transform = 'scale(0.93)'; }) : undefined}
      onMouseUp={onClick ? (e => { e.currentTarget.style.transform = ''; }) : undefined}
    >
      {icon && <CBIcon name={icon} size={13} stroke={1.7} />}
      {children}
    </div>
  );
}

const BUTTON_SIZES = {
  sm: { h: 36, fs: 13, pad: 14 },
  md: { h: 48, fs: 15, pad: 18 },
  lg: { h: 56, fs: 16, pad: 22 },
};

export function Button({ children, variant = 'primary', size = 'md', icon, trailingIcon, onClick, full, disabled, type = 'button', style, haptic = 'LIGHT' }) {
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const scaleSpring = useSpring(1, PRESS_SPRING);

  const variantStyle =
    variant === 'primary'   ? { background: T.brand, color: '#fff', border: 'none' } :
    variant === 'accent'    ? { background: T.accent, color: '#fff', border: 'none' } :
    variant === 'secondary' ? { background: 'transparent', color: T.ink900, border: `1px solid ${T.line}` } :
    variant === 'ghost'     ? { background: 'transparent', color: T.ink700, border: 'none' } :
    variant === 'danger'    ? { background: T.danger, color: '#fff', border: 'none' } :
    { background: T.brand, color: '#fff', border: 'none' };

  const onDown = () => { if (!disabled) scaleSpring.set(0.96); };
  const onUp   = () => {
    if (disabled) return;
    scaleSpring.set(1.02);
    setTimeout(() => scaleSpring.set(1), 80);
  };

  const handleClick = (e) => {
    if (disabled) return;
    triggerHaptic(haptic);
    onClick?.(e);
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.h, padding: `0 ${s.pad}px`, borderRadius: RADIUS.pill,
        fontFamily: FONTS.sans, fontSize: s.fs, fontWeight: 600, letterSpacing: '-0.011em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto', flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        scale: scaleSpring,
        ...variantStyle, ...style,
      }}
    >
      {icon && <CBIcon name={icon} size={s.fs + 4} stroke={1.7} />}
      <span>{children}</span>
      {trailingIcon && <CBIcon name={trailingIcon} size={s.fs + 4} stroke={1.7} />}
    </motion.button>
  );
}

export function ProgressBar({ value = 0.5, color, h = 6, style, animated = false }) {
  return (
    <div style={{
      height: h, background: T.ink100, borderRadius: 999, overflow: 'hidden', width: '100%',
      ...style,
    }}>
      <div className={animated ? 'stat-bar-fill' : ''} style={{
        height: '100%',
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        background: color || T.brand,
        borderRadius: 999,
      }} />
    </div>
  );
}
