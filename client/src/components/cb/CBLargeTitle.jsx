import { T } from './tokens';

export default function CBLargeTitle({ title, eyebrow, trailing }) {
  return (
    <div style={{ padding: '4px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          {eyebrow && (
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink300, letterSpacing: '-0.01em', marginBottom: 2 }}>
              {eyebrow}
            </div>
          )}
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.025em', color: T.ink900, margin: 0 }}>
            {title}
          </h1>
        </div>
        {trailing}
      </div>
    </div>
  );
}
