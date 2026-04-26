import { T } from './tokens';

export default function CBSegmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', padding: 2, background: T.ink100, borderRadius: 9 }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange?.(o.id)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: active ? '#fff' : 'transparent',
              color: active ? T.ink900 : T.ink500,
              fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: '-0.01em',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
