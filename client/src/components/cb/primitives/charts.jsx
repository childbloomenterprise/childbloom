// Chart primitives — Ring (single-arc), TripleArc (3 nested),
// Spark (line+area), MiniBars (vertical bars).
import { T, FONTS } from '../tokens';

export function Ring({ value = 0.7, size = 88, stroke = 9, color, track, label, sub, children, style }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track || T.ink100} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || T.brand} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${C * Math.max(0, Math.min(1, value))} ${C}`}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      {(label || children) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none',
        }}>
          {children || (
            <>
              <div style={{ fontFamily: FONTS.serif, fontSize: size * 0.28, color: T.ink900, lineHeight: 1 }}>{label}</div>
              {sub && (
                <div style={{
                  fontFamily: FONTS.sans, fontSize: 10, color: T.ink400, marginTop: 2,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{sub}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function TripleArc({ sleep = 0.85, feed = 0.7, well = 0.78, size = 180, style }) {
  const stroke = 11;
  const layers = [
    { r: (size - stroke) / 2,                          v: well,  c: T.brand },
    { r: (size - stroke) / 2 - stroke - 4,             v: sleep, c: T.brandSoft },
    { r: (size - stroke) / 2 - 2 * (stroke + 4),       v: feed,  c: T.accent },
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', ...style }}>
      {layers.map((l, i) => {
        const C = 2 * Math.PI * l.r;
        return (
          <g key={i}>
            <circle cx={size/2} cy={size/2} r={l.r} fill="none" stroke={T.ink100} strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={l.r} fill="none" stroke={l.c} strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${C * Math.max(0, Math.min(1, l.v))} ${C}`}
              transform={`rotate(-90 ${size/2} ${size/2})`} />
          </g>
        );
      })}
    </svg>
  );
}

export function Spark({ points, w = 240, h = 64, color, fill = true, dots = false, style }) {
  if (!points || !points.length) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const dx = w / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * dx, y = h - ((p - min) / span) * (h - 8) - 4;
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
  const area = path + ` L${w} ${h} L0 ${h} Z`;
  const c = color || T.brand;
  // Unique id per render so multiple Sparks on one screen don't collide.
  const gid = `sg-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {dots && points.map((p, i) => {
        const x = i * dx, y = h - ((p - min) / span) * (h - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={c} />;
      })}
    </svg>
  );
}

export function MiniBars({ values, w = 220, h = 60, color, labels, style }) {
  const max = Math.max(...values, 1);
  const gap = 4;
  const bw = (w - gap * (values.length - 1)) / values.length;
  const c = color || T.brand;
  return (
    <svg width={w} height={h + (labels ? 16 : 0)} viewBox={`0 0 ${w} ${h + (labels ? 16 : 0)}`} style={{ display: 'block', ...style }}>
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return (
          <g key={i}>
            <rect x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx="2" fill={c} opacity={0.85} />
            {labels && (
              <text x={i * (bw + gap) + bw / 2} y={h + 12} textAnchor="middle"
                fontSize="9" fill={T.ink400} fontFamily={FONTS.sans}>{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
