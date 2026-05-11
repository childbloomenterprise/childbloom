// Nav-ish primitives — TopBar (page header), TimelineEntry (rhythm row),
// QuickTile (one-tap log button on the dashboard).
import { T, FONTS, RADIUS } from '../tokens';
import CBIcon from '../CBIcon';

export function TopBar({ title, subtitle, leading, trailing, sticky = false, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', padding: '4px 20px 10px',
      gap: 12,
      position: sticky ? 'sticky' : 'relative',
      top: 0,
      background: T.bg,
      zIndex: 4,
      ...style,
    }}>
      {leading}
      <div style={{ flex: 1 }}>
        {subtitle && (
          <div style={{
            fontFamily: FONTS.sans, fontSize: 12, color: T.ink400, marginBottom: 2,
          }}>{subtitle}</div>
        )}
        <div style={{
          fontFamily: FONTS.serif, fontSize: 26, color: T.ink900,
          letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>{title}</div>
      </div>
      {trailing}
    </div>
  );
}

export function TimelineEntry({ time, title, sub, icon, color, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, padding: '10px 0', alignItems: 'flex-start',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'opacity 0.12s ease' : undefined,
        WebkitTapHighlightColor: 'transparent',
        borderRadius: 8,
        ...style,
      }}
      onTouchStart={onClick ? (e => { e.currentTarget.style.opacity = '0.65'; }) : undefined}
      onTouchEnd={onClick ? (e => { e.currentTarget.style.opacity = ''; }) : undefined}
    >
      <div style={{
        width: 56, flexShrink: 0,
        fontFamily: FONTS.mono, fontSize: 11, color: T.ink400,
        paddingTop: 11, letterSpacing: '0.04em',
      }}>{time}</div>
      <div style={{
        width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
        background: color || T.brandWash,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.brand,
      }}>
        <CBIcon name={icon} size={18} stroke={1.7} />
      </div>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: T.ink900 }}>{title}</div>
        {sub && (
          <div style={{ fontFamily: FONTS.sans, fontSize: 12, color: T.ink500, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {onClick && (
        <div style={{ paddingTop: 10, color: T.ink300, flexShrink: 0 }}>
          <CBIcon name="chevron-right" size={14} stroke={2} />
        </div>
      )}
    </div>
  );
}

export function QuickTile({ icon, label, color, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: T.surface, border: 'none', borderRadius: RADIUS.lg,
        padding: '14px 8px',
        boxShadow: 'var(--shadow-sm), var(--shadow-ring)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        fontFamily: FONTS.sans, color: T.ink900,
        transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.boxShadow = 'none'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: RADIUS.md,
        background: color || T.brandWash,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.brand, transition: 'background 0.2s ease',
      }}>
        <CBIcon name={icon} size={20} stroke={1.7} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '-0.005em' }}>{label}</span>
    </button>
  );
}
