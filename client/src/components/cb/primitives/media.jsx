// Media primitives — Avatar (initial circle), PhotoSlot (placeholder),
// BloomFlower (decorative SVG petal mark).
import { T, FONTS, RADIUS } from '../tokens';
import { Mono } from './text';

export function Avatar({ size = 40, name = 'A', tone = 'brand', style }) {
  const bg = tone === 'brand' ? T.brand : tone === 'soft' ? T.brandSoft : T.brandWash;
  const fg = tone === 'wash' ? T.brand : '#fff';
  const initial = (name || 'A')[0]?.toUpperCase() || 'A';
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: FONTS.serif, fontSize: Math.round(size * 0.42), color: fg,
      boxShadow: 'var(--shadow-ring)', position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <span style={{ position: 'relative', zIndex: 1, fontStyle: 'italic' }}>{initial}</span>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: `repeating-linear-gradient(135deg, ${fg}, ${fg} 1px, transparent 1px, transparent 6px)`,
      }} />
    </div>
  );
}

export function PhotoSlot({ label = 'photo', w = 80, h = 80, radius = 'md', style }) {
  const r = radius === 'pill' ? 999 : radius === 'md' ? RADIUS.md : RADIUS.sm;
  return (
    <div style={{
      width: w, height: h, borderRadius: r, position: 'relative',
      background: T.surfaceDim, overflow: 'hidden', flexShrink: 0,
      boxShadow: 'var(--shadow-ring)',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.45,
        backgroundImage: `repeating-linear-gradient(135deg, ${T.ink200}, ${T.ink200} 1px, transparent 1px, transparent 7px)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Mono color={T.ink400} size={9}>{label}</Mono>
      </div>
    </div>
  );
}

// Decorative 6-petal flower used in hero cards, premium screen, onboarding splash.
// Petals scaled by `petals` array (each 0..1). Colors loop through provided list.
export function BloomFlower({
  size = 200,
  petals = [0.85, 0.7, 0.78, 0.6, 0.9, 0.72],
  colors,
  style,
}) {
  const cx = size / 2, cy = size / 2;
  const cs = colors || [T.brand, T.brandSoft, T.accent, T.gold, T.brand, T.brandSoft];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', ...style }}>
      <defs>
        <radialGradient id="bloomCenter" cx="50%" cy="50%">
          <stop offset="0%"   stopColor={T.cream} stopOpacity="0.9" />
          <stop offset="100%" stopColor={T.brandWash} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      {petals.map((v, i) => {
        const angle = (i / petals.length) * Math.PI * 2 - Math.PI / 2;
        const len = (size / 2 - 10) * (0.45 + v * 0.55);
        const w = 18 + v * 14;
        const tx = cx + Math.cos(angle) * len * 0.45;
        const ty = cy + Math.sin(angle) * len * 0.45;
        const rot = (angle * 180) / Math.PI + 90;
        const c = cs[i % cs.length];
        return (
          <g key={i} transform={`translate(${tx} ${ty}) rotate(${rot})`}>
            <ellipse cx={0} cy={0} rx={w} ry={len * 0.5} fill={c} fillOpacity={0.18 + v * 0.25} />
            <ellipse cx={0} cy={-len * 0.15} rx={w * 0.5} ry={len * 0.32} fill={c} fillOpacity={0.4 + v * 0.3} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.12} fill="url(#bloomCenter)" />
      <circle cx={cx} cy={cy} r={size * 0.06} fill={T.gold} fillOpacity={0.6} />
    </svg>
  );
}
