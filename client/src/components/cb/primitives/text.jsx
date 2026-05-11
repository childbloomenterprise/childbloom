// Text primitives — Display (serif headline), Eyebrow (uppercase label),
// Body (sans paragraph), Mono (timestamps/numbers).
import { T, FONTS } from '../tokens';

export function Display({ children, size = 32, italic = false, weight = 400, lh = 1.05, color, style, className }) {
  return (
    <div className={className} style={{
      fontFamily: FONTS.serif,
      fontSize: size,
      fontWeight: weight,
      fontStyle: italic ? 'italic' : 'normal',
      letterSpacing: '-0.02em',
      color: color || T.ink900,
      lineHeight: lh,
      ...style,
    }}>{children}</div>
  );
}

export function Eyebrow({ children, color, style }) {
  return (
    <div style={{
      fontFamily: FONTS.sans,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: color || T.ink400,
      ...style,
    }}>{children}</div>
  );
}

export function Body({ children, size = 14, weight = 400, color, lh = 1.45, style }) {
  return (
    <div style={{
      fontFamily: FONTS.sans,
      fontSize: size,
      fontWeight: weight,
      color: color || T.ink700,
      letterSpacing: '-0.011em',
      lineHeight: lh,
      ...style,
    }}>{children}</div>
  );
}

export function Mono({ children, size = 11, color, style }) {
  return (
    <span style={{
      fontFamily: FONTS.mono,
      fontSize: size,
      color: color || T.ink400,
      letterSpacing: '0.04em',
      ...style,
    }}>{children}</span>
  );
}
