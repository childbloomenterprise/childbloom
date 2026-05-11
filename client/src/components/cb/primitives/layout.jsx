// Layout primitives — flex helpers, dividers, section labels, chrome icon buttons.
import { T, FONTS, RADIUS } from '../tokens';
import CBIcon from '../CBIcon';

export function Stack({ children, gap = 12, dir = 'col', align, justify, style, onClick, role, ...rest }) {
  return (
    <div onClick={onClick} role={role || (onClick ? 'button' : undefined)} style={{
      display: 'flex',
      flexDirection: dir === 'row' ? 'row' : 'column',
      gap,
      alignItems: align,
      justifyContent: justify,
      cursor: onClick ? 'pointer' : undefined,
      ...style,
    }} {...rest}>{children}</div>
  );
}

export function HRow({ children, gap = 10, align = 'center', justify, style, onClick, role, ...rest }) {
  return (
    <div onClick={onClick} role={role || (onClick ? 'button' : undefined)} style={{
      display: 'flex',
      flexDirection: 'row',
      gap,
      alignItems: align,
      justifyContent: justify,
      cursor: onClick ? 'pointer' : undefined,
      ...style,
    }} {...rest}>{children}</div>
  );
}

export function Spacer({ h = 12, w }) {
  return <div style={{ height: h, width: w, flexShrink: 0 }} />;
}

export function Divider({ style }) {
  return <div style={{ height: 1, background: T.line, ...style }} />;
}

export function SectionLabel({ title, trailing, onTrailing, style }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '0 4px', marginBottom: 10, ...style,
    }}>
      <div style={{
        fontFamily: FONTS.serif, fontSize: 17, color: T.ink900, letterSpacing: '-0.01em',
      }}>{title}</div>
      {trailing && (
        <button onClick={onTrailing} style={{
          fontFamily: FONTS.sans, fontSize: 12, color: T.brand, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>{trailing}</button>
      )}
    </div>
  );
}

export function ChromeBtn({ icon, badge, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: 999,
        background: T.surface, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.ink700, position: 'relative',
        boxShadow: '0 0 0 1px rgba(11,23,20,0.06), 0 1px 3px rgba(11,23,20,0.04)',
        flexShrink: 0, transition: 'transform 0.15s ease',
        ...style,
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.88)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
    >
      <CBIcon name={icon} size={17} stroke={1.7} />
      {badge && (
        <div style={{
          position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4,
          background: T.accent, boxShadow: `0 0 0 2px ${T.surface}`,
          animation: 'badge-pulse 1.8s ease-in-out infinite',
        }} />
      )}
    </button>
  );
}
