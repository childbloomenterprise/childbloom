// ChildBloom theme system — 4 palettes × light/dark.
// applyTheme() writes every token onto :root as a CSS custom property,
// so anything reading var(--brand) etc. (including tokens.js Proxy)
// updates live. Palettes lifted verbatim from revamp/tokens.jsx.

export const PALETTES = {
  emerald: {
    name: 'Emerald',
    light: {
      bg: '#F2F0EA', surface: '#FFFFFF', surfaceDim: '#F7F5EF', surfaceWarm: '#F5EFE3',
      ink900: '#0B1714', ink700: '#1F2A26', ink500: '#4B5651', ink400: '#6B7570',
      ink300: '#8E9690', ink200: '#C8CCC6', ink100: '#E5E7E1', line: 'rgba(11,23,20,0.08)',
      brand: '#0F3D2E', brandDeep: '#0A2920', brandSoft: '#5FB48A', brandWash: '#D9EBE1', brandTint: '#EDF4EF',
      accent: '#D17A4F', accentSoft: '#F0C9BB', gold: '#C9A35A', cream: '#F5EFE3',
      success: '#1E7A55', warn: '#C9A35A', danger: '#B0492C',
    },
    dark: {
      bg: '#0B1714', surface: '#121E1A', surfaceDim: '#0E1815', surfaceWarm: '#171F1B',
      ink900: '#F4F1E8', ink700: '#D8D4C9', ink500: '#A6A89F', ink400: '#878A82',
      ink300: '#666B66', ink200: '#3A413D', ink100: '#222A26', line: 'rgba(244,241,232,0.10)',
      brand: '#5FB48A', brandDeep: '#2B7A5C', brandSoft: '#83CFA6', brandWash: '#1A2A23', brandTint: '#16221C',
      accent: '#E8A07F', accentSoft: '#3D2920', gold: '#D9B473', cream: '#1F1B14',
      success: '#5FB48A', warn: '#D9B473', danger: '#E48060',
    },
  },
  sage: {
    name: 'Sage cream',
    light: {
      bg: '#F0F2EB', surface: '#FBFAF4', surfaceDim: '#F4F2EA', surfaceWarm: '#F2EBDA',
      ink900: '#1A1F18', ink700: '#2C342C', ink500: '#4F564D', ink400: '#6E746A',
      ink300: '#929991', ink200: '#C8CDC4', ink100: '#E5E8DF', line: 'rgba(26,31,24,0.08)',
      brand: '#385D43', brandDeep: '#243F2D', brandSoft: '#7FAB8A', brandWash: '#DCE7DC', brandTint: '#EBF1E9',
      accent: '#B8884A', accentSoft: '#E8D3A8', gold: '#B8884A', cream: '#F2EBDA',
      success: '#385D43', warn: '#B8884A', danger: '#A14B30',
    },
    dark: {
      bg: '#0E120E', surface: '#171C16', surfaceDim: '#111510', surfaceWarm: '#1B1F18',
      ink900: '#F1EFE3', ink700: '#D5D2C5', ink500: '#A2A599', ink400: '#82877C',
      ink300: '#646962', ink200: '#3A3F38', ink100: '#222722', line: 'rgba(241,239,227,0.10)',
      brand: '#7FAB8A', brandDeep: '#385D43', brandSoft: '#9BC2A5', brandWash: '#1B2A1F', brandTint: '#172118',
      accent: '#D9B473', accentSoft: '#3A2D1A', gold: '#D9B473', cream: '#1F1B14',
      success: '#7FAB8A', warn: '#D9B473', danger: '#E48060',
    },
  },
  forest: {
    name: 'Forest + Terra',
    light: {
      bg: '#F4F1EA', surface: '#FFFFFF', surfaceDim: '#F8F4EB', surfaceWarm: '#F2E5D0',
      ink900: '#1A140C', ink700: '#33291E', ink500: '#5C4F40', ink400: '#7A6E5F',
      ink300: '#9E9482', ink200: '#CFC6B5', ink100: '#EBE3D2', line: 'rgba(26,20,12,0.08)',
      brand: '#0F3D2E', brandDeep: '#082619', brandSoft: '#5FB48A', brandWash: '#D9E8DD', brandTint: '#ECF2EC',
      accent: '#C26A3F', accentSoft: '#EFC8AB', gold: '#C9A35A', cream: '#F2E5D0',
      success: '#0F3D2E', warn: '#C9A35A', danger: '#B0492C',
    },
    dark: {
      bg: '#0B100D', surface: '#131916', surfaceDim: '#101411', surfaceWarm: '#1A1612',
      ink900: '#F4EEDE', ink700: '#D6CDB8', ink500: '#A29A86', ink400: '#84806C',
      ink300: '#666458', ink200: '#3A3A33', ink100: '#21221E', line: 'rgba(244,238,222,0.10)',
      brand: '#5FB48A', brandDeep: '#2B7A5C', brandSoft: '#83CFA6', brandWash: '#1A2A23', brandTint: '#162119',
      accent: '#E08960', accentSoft: '#3D2418', gold: '#D9B473', cream: '#1A1612',
      success: '#5FB48A', warn: '#D9B473', danger: '#E48060',
    },
  },
  ink: {
    name: 'Deep ink',
    light: {
      bg: '#EFEDE6', surface: '#FFFFFF', surfaceDim: '#F4F1E8', surfaceWarm: '#EFE8D6',
      ink900: '#0E1414', ink700: '#212A28', ink500: '#48524F', ink400: '#69716D',
      ink300: '#8C928E', ink200: '#C5C9C4', ink100: '#E3E5E0', line: 'rgba(14,20,20,0.08)',
      brand: '#0A1F18', brandDeep: '#040D0A', brandSoft: '#4A8068', brandWash: '#D5E0DA', brandTint: '#E8EEEB',
      accent: '#C26A3F', accentSoft: '#EFC8AB', gold: '#A87F4A', cream: '#EFE8D6',
      success: '#0A1F18', warn: '#A87F4A', danger: '#A14B30',
    },
    dark: {
      bg: '#070A09', surface: '#0F1413', surfaceDim: '#0A0E0D', surfaceWarm: '#15110B',
      ink900: '#F2EEE2', ink700: '#D2CDBF', ink500: '#9E9A8E', ink400: '#7E7B72',
      ink300: '#5D5C55', ink200: '#363632', ink100: '#1F201D', line: 'rgba(242,238,226,0.10)',
      brand: '#7FAB8A', brandDeep: '#3A6A52', brandSoft: '#9BC2A5', brandWash: '#152018', brandTint: '#0F1612',
      accent: '#E08960', accentSoft: '#3D2418', gold: '#D9B473', cream: '#15110B',
      success: '#7FAB8A', warn: '#D9B473', danger: '#E48060',
    },
  },
};

export const PALETTE_KEYS = Object.keys(PALETTES);

function camelToKebab(s) {
  return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase())
          .replace(/(\d+)/g, '-$1');
}

// Write every token of the chosen palette × mode onto :root as
// CSS custom properties (--bg, --brand, --ink-900, --brand-wash, etc.).
// Also sets data-palette + data-mode for any selectors that need them.
export function applyTheme(palette = 'emerald', mode = 'light') {
  if (typeof document === 'undefined') return;
  const p = PALETTES[palette]?.[mode] || PALETTES.emerald.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(p)) {
    root.style.setProperty('--' + camelToKebab(key), value);
  }
  // Brand-related composites used in shadows
  root.style.setProperty('--shadow-ring', mode === 'dark'
    ? '0 0 0 1px rgba(244,241,232,0.08)'
    : '0 0 0 1px rgba(11,23,20,0.04)');
  root.style.setProperty('--shadow-sm', mode === 'dark'
    ? '0 1px 2px rgba(0,0,0,0.5)'
    : '0 1px 2px rgba(11,23,20,0.04), 0 1px 1px rgba(11,23,20,0.03)');
  root.style.setProperty('--shadow-md', mode === 'dark'
    ? '0 8px 24px rgba(0,0,0,0.5)'
    : '0 2px 4px rgba(11,23,20,0.03), 0 12px 28px rgba(11,23,20,0.06)');
  root.style.setProperty('--shadow-lg', mode === 'dark'
    ? '0 24px 60px rgba(0,0,0,0.6)'
    : '0 6px 14px rgba(11,23,20,0.05), 0 28px 64px rgba(11,23,20,0.08)');

  root.dataset.palette = palette;
  root.dataset.mode = mode;
  // For any consumers that style based on color-scheme
  root.style.colorScheme = mode;
}
