import CBIcon from './CBIcon';
import { T } from './tokens';

export default function CBCell({ icon, iconColor, title, sub, value, valueColor, divider = true, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
      borderBottom: divider ? `0.5px solid ${T.ink100}` : 'none',
    }}>
      {icon && (
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: (iconColor || T.forest500) + '1f',
          color: iconColor || T.forest500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CBIcon name={icon} size={17} stroke={1.8} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: T.ink700, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.ink300, marginTop: 1 }}>{sub}</div>}
      </div>
      {value !== undefined && (
        <div style={{ fontSize: 15, color: valueColor || T.ink300, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {value}
        </div>
      )}
      <CBIcon name="chevron-right" size={14} stroke={2.2} />
    </button>
  );
}
