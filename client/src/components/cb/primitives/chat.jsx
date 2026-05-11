// Chat primitives — AIBubble (serif card), UserBubble (surfaceDim pill),
// ReasonRow (icon + title + detail row inside structured AI cards),
// PlanRow (timestamp + activity row in plan cards).
import { T, FONTS, RADIUS } from '../tokens';
import CBIcon from '../CBIcon';

export function AIBubble({ children, lead, sparkle = true, tone = 'brand', style }) {
  const bg  = tone === 'brand' ? T.brand   : T.surface;
  const fg  = tone === 'brand' ? '#fff'    : T.ink900;
  const sub = tone === 'brand' ? 'rgba(255,255,255,0.65)' : T.ink400;
  return (
    <div style={{
      background: bg, color: fg, borderRadius: RADIUS.lg,
      padding: 18, boxShadow: 'var(--shadow-md)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {sparkle && (
        <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.6 }}>
          <CBIcon name="sparkle" size={16} stroke={1.6} style={{ color: fg }} />
        </div>
      )}
      {lead && (
        <div style={{
          fontFamily: FONTS.sans, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: sub, marginBottom: 8,
        }}>{lead}</div>
      )}
      <div style={{
        fontFamily: FONTS.serif, fontSize: 19, fontStyle: 'italic',
        lineHeight: 1.32, letterSpacing: '-0.02em',
      }}>{children}</div>
    </div>
  );
}

export function UserBubble({ children, align = 'right', style }) {
  return (
    <div style={{
      alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
      maxWidth: '78%',
      background: T.surfaceDim, color: T.ink900,
      padding: '10px 14px',
      borderRadius: align === 'right' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
      fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.4,
      border: `1px solid ${T.ink100}`,
      ...style,
    }}>{children}</div>
  );
}

export function ReasonRow({ icon, title, detail, color, style }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start',
      ...style,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: RADIUS.sm,
        background: T.brandWash, color: color || T.brand,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <CBIcon name={icon} size={14} stroke={1.8} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, color: T.ink900 }}>{title}</div>
        {detail && (
          <div style={{ fontFamily: FONTS.sans, fontSize: 11, color: T.ink500, lineHeight: 1.4 }}>{detail}</div>
        )}
      </div>
    </div>
  );
}

export function PlanRow({ time, activity, dark = false, last = false, style }) {
  const fg = dark ? 'rgba(255,255,255,0.95)' : T.ink900;
  const sub = dark ? 'rgba(255,255,255,0.55)' : T.ink400;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '7px 0', alignItems: 'center',
      borderBottom: last ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.1)' : T.line}`,
      ...style,
    }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: sub, letterSpacing: '0.04em' }}>{time}</span>
      <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: fg, fontWeight: 500 }}>{activity}</div>
    </div>
  );
}
