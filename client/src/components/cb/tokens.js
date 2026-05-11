// ChildBloom design tokens — CSS-var Proxy.
//
// Every read of T.brand / T.bg / T.ink900 returns a `var(--brand)` string,
// which the browser resolves at runtime against the active palette × mode.
// The active palette is set by `applyTheme()` in theme.js, driven by the
// themeStore. So `<div style={{ background: T.bg }}>` re-skins live when
// the user picks a new palette in Settings — no React re-render needed.
//
// Legacy aliases (forest700, forest500, bgWarm, card, terra, blush)
// keep all pre-revamp code working without a sweeping rename.

const THEME_TOKENS = {
  // Surfaces
  bg: '--bg',
  surface: '--surface',
  surfaceDim: '--surface-dim',
  surfaceWarm: '--surface-warm',

  // Ink scale
  ink900: '--ink-900',
  ink700: '--ink-700',
  ink500: '--ink-500',
  ink400: '--ink-400',
  ink300: '--ink-300',
  ink200: '--ink-200',
  ink100: '--ink-100',
  line: '--line',

  // Brand
  brand: '--brand',
  brandDeep: '--brand-deep',
  brandSoft: '--brand-soft',
  brandWash: '--brand-wash',
  brandTint: '--brand-tint',

  // Warm/accent
  accent: '--accent',
  accentSoft: '--accent-soft',
  gold: '--gold',
  cream: '--cream',

  // Semantic
  success: '--success',
  warn: '--warn',
  danger: '--danger',
};

// Legacy aliases — map old token names to current CSS vars.
const LEGACY_ALIASES = {
  // Pre-revamp emerald scale
  forest900: '--brand-deep',
  forest700: '--brand',
  forest600: '--brand',
  forest500: '--brand-soft',
  forest300: '--brand-soft',
  forest100: '--brand-wash',
  forest50:  '--brand-tint',
  // Pre-revamp surface aliases
  bgWarm: '--surface-warm',
  card: '--surface',
  // Warm aliases
  terra: '--accent',
  blush: '--accent-soft',
};

// System colors — fixed across themes.
const SYSTEM = {
  blue:   '#0A84FF',
  red:    '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  purple: '#AF52DE',
  pink:   '#FF2D55',
  white:  '#FFFFFF',
  black:  '#000000',
};

// Composite tokens for shadows/rings (set by applyTheme()).
const SHADOWS = {
  shadowSm: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
  shadowRing: 'var(--shadow-ring)',
};

export const T = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (prop in THEME_TOKENS)  return `var(${THEME_TOKENS[prop]})`;
    if (prop in LEGACY_ALIASES) return `var(${LEGACY_ALIASES[prop]})`;
    if (prop in SYSTEM)        return SYSTEM[prop];
    if (prop in SHADOWS)       return SHADOWS[prop];
    // Symbol.iterator / toJSON / etc. → undefined (safe)
    return undefined;
  },
  has(_target, prop) {
    return (typeof prop === 'string') &&
      (prop in THEME_TOKENS || prop in LEGACY_ALIASES || prop in SYSTEM || prop in SHADOWS);
  },
});

// Typography constants (font families don't change with theme).
export const FONTS = {
  serif: "'Fraunces', 'Cormorant Garamond', Georgia, serif",
  sans:  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  mono:  "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

// Radius scale (matches revamp 'soft' density).
export const RADIUS = {
  xs: 6, sm: 10, md: 16, lg: 22, xl: 28, pill: 999,
};
