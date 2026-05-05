/**
 * Emergency / First-Aid SVG Illustrations
 * 3-D look via radial-gradient skin, linear-gradient clothing, feDropShadow hands,
 * and specular highlight ellipses. All animation classes are in index.css.
 * Each illustration gets unique gradient/filter IDs (prefix = short letter) so
 * multiple can coexist in the same document without conflicts.
 */
import { T } from '../../../../components/cb/tokens';

// ─── Shared SVG defs ─────────────────────────────────────────────
// `p` = short prefix string, must be unique per illustration rendered simultaneously.
function Defs({ p }) {
  return (
    <defs>
      {/* Skin — warm highlight top-left, peachy mid, tan-brown shadow */}
      <radialGradient id={`${p}sk`} cx="35%" cy="28%" r="72%">
        <stop offset="0%"   stopColor="#FFE8CA" />
        <stop offset="48%"  stopColor="#F2C9A0" />
        <stop offset="100%" stopColor="#B8723A" />
      </radialGradient>

      {/* Skin dark (ears, knuckle shadows) */}
      <radialGradient id={`${p}skd`} cx="35%" cy="28%" r="72%">
        <stop offset="0%"   stopColor="#EDB87A" />
        <stop offset="100%" stopColor="#8C4A20" />
      </radialGradient>

      {/* Clothing / onesie — steel-blue lit from above */}
      <linearGradient id={`${p}cl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#E8F0F8" />
        <stop offset="55%"  stopColor="#B8CCE0" />
        <stop offset="100%" stopColor="#7A9BB8" />
      </linearGradient>

      {/* Diaper — soft blue-white gradient */}
      <linearGradient id={`${p}dp`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#EFF6FF" />
        <stop offset="100%" stopColor="#93C5FD" />
      </linearGradient>

      {/* Red glowing target zone */}
      <radialGradient id={`${p}tg`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#DC2626" stopOpacity="0.75" />
        <stop offset="55%"  stopColor="#DC2626" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
      </radialGradient>

      {/* Amber/orange glowing target (for urgent topics) */}
      <radialGradient id={`${p}tga`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#B45309" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
      </radialGradient>

      {/* Specular highlight — small bright ellipse on lit surface */}
      <radialGradient id={`${p}hl`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.82)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>

      {/* Water gradient */}
      <linearGradient id={`${p}wa`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>

      {/* Wood (rescue stick / floor) */}
      <linearGradient id={`${p}wd`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#DEB887" />
        <stop offset="100%" stopColor="#8B5E3C" />
      </linearGradient>

      {/* Drop shadow — hands / key objects */}
      <filter id={`${p}fs`} x="-35%" y="-35%" width="170%" height="170%">
        <feDropShadow dx="1" dy="4" stdDeviation="5"
          floodColor="#1a0805" floodOpacity="0.32" />
      </filter>

      {/* Drop shadow small */}
      <filter id={`${p}fss`} x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5"
          floodColor="#1a0805" floodOpacity="0.22" />
      </filter>

      {/* Inner glow for compression zone */}
      <filter id={`${p}fg`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

// ─── Anatomy helpers ─────────────────────────────────────────────

// Volumetric arm — drawn as a thick stroked path with gradient fill illusion
// via two overlapping paths (filled wide, then stroked narrow dark)
function SkinArm({ d, width = 9, p }) {
  return (
    <>
      <path d={d} fill="none" stroke={`url(#${p}sk)`} strokeWidth={width + 3} strokeLinecap="round" />
      <path d={d} fill="none" stroke="rgba(180,100,50,0.18)" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

// Specular dot — small bright ellipse for 3D highlight
function Spec({ cx, cy, rx = 6, ry = 3.5, p }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${p}hl)`} />;
}

// Two-finger compression hand (top-down, pointing down)
function TwoFingerHand({ x, y, p, color }) {
  const f = `url(#${p}fs)`;
  const sk = `url(#${p}sk)`;
  return (
    <g transform={`translate(${x},${y})`} filter={f}>
      {/* palm base */}
      <ellipse cx="0" cy="2" rx="14" ry="10" fill={sk} />
      {/* palm side shadow */}
      <ellipse cx="0" cy="8" rx="14" ry="5" fill="rgba(100,50,20,0.18)" />

      {/* index finger */}
      <rect x="-9" y="-28" width="8" height="30" rx="4" fill={sk} />
      {/* knuckle shadow index */}
      <ellipse cx="-5" cy="-14" rx="3.5" ry="2" fill="rgba(140,70,30,0.30)" />
      {/* nail index */}
      <ellipse cx="-5" cy="-26" rx="3" ry="1.8" fill="rgba(255,220,190,0.7)" />

      {/* middle finger */}
      <rect x="1" y="-30" width="8" height="32" rx="4" fill={sk} />
      {/* knuckle shadow middle */}
      <ellipse cx="5" cy="-14" rx="3.5" ry="2" fill="rgba(140,70,30,0.30)" />
      {/* nail middle */}
      <ellipse cx="5" cy="-28" rx="3" ry="1.8" fill="rgba(255,220,190,0.7)" />

      {/* specular on palm */}
      <Spec cx="-2" cy="-2" rx={8} ry={4} p={p} />

      {/* finger-tip glow at compression point */}
      <ellipse cx="0" cy="30" rx="12" ry="6" fill={color} opacity="0.22" />
    </g>
  );
}

// Heel-of-hand (top-down, both hands stacked)
function HeelHand({ x, y, p, color }) {
  const f = `url(#${p}fs)`;
  const sk = `url(#${p}sk)`;
  return (
    <g transform={`translate(${x},${y})`} filter={f}>
      {/* bottom hand — heel pressing */}
      <ellipse cx="0" cy="0" rx="18" ry="12" fill={sk} />
      <ellipse cx="0" cy="6" rx="18" ry="7" fill="rgba(100,50,20,0.18)" />

      {/* top hand stacked */}
      <ellipse cx="0" cy="-10" rx="16" ry="10" fill={sk} />
      <ellipse cx="0" cy="-5" rx="16" ry="6" fill="rgba(100,50,20,0.13)" />

      {/* interlaced finger arch — one unified curved shape, no floating rectangles */}
      <path d="M -14 -18 Q -10 -30 -4 -28 Q 0 -34 4 -28 Q 10 -30 14 -18 Z"
        fill={sk} />
      <line x1="-2" y1="-28" x2="-2" y2="-19" stroke="rgba(130,65,20,0.22)" strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="-28" x2="4"  y2="-19" stroke="rgba(130,65,20,0.22)" strokeWidth="1" strokeLinecap="round" />

      <Spec cx="-2" cy="-13" rx={9} ry={5} p={p} />
      <ellipse cx="0" cy="28" rx="18" ry="8" fill={color} opacity="0.20" />
    </g>
  );
}

// ─── Main illustrations ──────────────────────────────────────────

export function HandPlacementInfant({ severityColor = T.red }) {
  const p = 'a';
  const sk = `url(#${p}sk)`;
  const cl = `url(#${p}cl)`;
  const dp = `url(#${p}dp)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="2-finger chest compression on infant">
      <Defs p={p} />

      {/* ── infant body (top-down) ── */}
      {/* head — large round, lit top-left */}
      <ellipse cx="42" cy="100" rx="30" ry="28" fill={sk} />
      {/* hair hint */}
      <ellipse cx="42" cy="76" rx="22" ry="10" fill="#5C3010" opacity="0.35" />
      {/* ear */}
      <ellipse cx="42" cy="120" rx="6" ry="7" fill={`url(#${p}skd)`} />
      {/* head specular */}
      <Spec cx="34" cy="88" rx={11} ry={7} p={p} />

      {/* neck */}
      <rect x="68" y="93" width="12" height="14" rx="5" fill={sk} />

      {/* torso — onesie cloth gradient, lit from above */}
      <path d="M78 82 Q100 72 152 76 Q168 80 168 100 Q168 120 152 124 Q100 128 78 118 Z"
        fill={cl} />
      {/* torso specular (top-lit) */}
      <ellipse cx="118" cy="86" rx="22" ry="7" fill="rgba(255,255,255,0.32)" />
      {/* clothing fold shadow */}
      <path d="M98 100 Q130 97 155 102" stroke="rgba(80,110,140,0.22)" strokeWidth="2.5" fill="none" />

      {/* diaper */}
      <path d="M138 114 Q155 118 162 126 L148 136 Q128 140 112 136 L100 130 Q118 122 138 114 Z"
        fill={dp} />
      {/* diaper specular */}
      <ellipse cx="132" cy="120" rx="12" ry="4" fill="rgba(255,255,255,0.40)" />

      {/* arms */}
      <SkinArm d="M82 86 Q66 70 58 74" width={8} p={p} />
      <SkinArm d="M82 114 Q66 128 58 124" width={8} p={p} />

      {/* legs */}
      <SkinArm d="M152 120 Q172 122 172 132 Q172 142 162 144" width={9} p={p} />

      {/* ── nipple line guide ── */}
      <line x1="92" y1="88" x2="152" y2="88"
        stroke={severityColor} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.45" />
      <circle cx="92"  cy="88" r="3" fill={severityColor} opacity="0.55" />
      <circle cx="152" cy="88" r="3" fill={severityColor} opacity="0.55" />

      {/* ── chest target zone (animated) ── */}
      <ellipse className="chest-depress" cx="120" cy="100" rx="26" ry="11"
        fill={`url(#${p}tg)`} filter={`url(#${p}fg)`}
        style={{ transformOrigin: '120px 108px' }} />

      {/* ── two-finger compression hand ── */}
      <g className="cpr-press">
        <TwoFingerHand x={120} y={74} p={p} color={severityColor} />
      </g>

      {/* depth ruler */}
      <line x1="174" y1="78" x2="174" y2="100"
        stroke={severityColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      <text x="178" y="91" fontSize="8" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="700">4cm</text>

      <text x="14" y="188" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        2 fingers · centre of chest · just below nipple line
      </text>
    </svg>
  );
}

export function HandPlacementChild({ severityColor = T.red }) {
  const p = 'b';
  const sk = `url(#${p}sk)`;
  const cl = `url(#${p}cl)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Heel-of-hand chest compression on child">
      <Defs p={p} />

      {/* head */}
      <ellipse cx="34" cy="100" rx="26" ry="24" fill={sk} />
      <ellipse cx="26" cy="88" rx="18" ry="8" fill="#5C3010" opacity="0.30" />
      <Spec cx="26" cy="90" rx={10} ry={6} p={p} />

      {/* neck */}
      <rect x="57" y="93" width="12" height="14" rx="5" fill={sk} />

      {/* torso */}
      <path d="M67 80 Q88 70 160 74 Q176 78 176 100 Q176 122 160 126 Q88 130 67 120 Z"
        fill={cl} />
      <ellipse cx="118" cy="84" rx="26" ry="8" fill="rgba(255,255,255,0.30)" />
      {/* clothing fold */}
      <path d="M90 100 Q120 96 158 102" stroke="rgba(80,110,140,0.20)" strokeWidth="2" fill="none" />
      <path d="M90 110 Q120 106 155 112" stroke="rgba(80,110,140,0.14)" strokeWidth="1.5" fill="none" />

      {/* legs */}
      <SkinArm d="M160 118 Q184 120 182 134 Q180 146 170 148" width={11} p={p} />

      {/* chest depress */}
      <ellipse className="chest-depress-slow" cx="118" cy="100" rx="30" ry="12"
        fill={`url(#${p}tg)`} filter={`url(#${p}fg)`}
        style={{ transformOrigin: '118px 110px' }} />

      {/* heel-of-hand */}
      <g className="cpr-press-slow">
        <HeelHand x={118} y={74} p={p} color={severityColor} />
      </g>

      <line x1="182" y1="76" x2="182" y2="104"
        stroke={severityColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      <text x="186" y="93" fontSize="8" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="700">5cm</text>

      <text x="14" y="188" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        heel of hand · lower breastbone · arms straight
      </text>
    </svg>
  );
}

export function BackBlowInfant({ severityColor = T.red }) {
  const p = 'c';
  const sk = `url(#${p}sk)`;
  const cl = `url(#${p}cl)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Back blows on face-down infant">
      <Defs p={p} />

      {/* ── parent forearm (perspective angle) ── */}
      {/* shadow cast by forearm */}
      <path d="M18 156 Q80 132 172 104" fill="none"
        stroke="rgba(0,0,0,0.12)" strokeWidth="28" strokeLinecap="round" />
      {/* forearm underside (shadow) */}
      <path d="M18 154 Q80 130 172 102" fill="none"
        stroke="#C8885A" strokeWidth="22" strokeLinecap="round" />
      {/* forearm top (highlight) */}
      <path d="M18 148 Q80 126 172 98" fill="none"
        stroke={sk} strokeWidth="22" strokeLinecap="round" />
      {/* forearm highlight ridge */}
      <path d="M20 145 Q80 122 170 95" fill="none"
        stroke="rgba(255,230,200,0.45)" strokeWidth="6" strokeLinecap="round" />

      {/* ── infant face-down on forearm ── */}
      {/* infant torso */}
      <path d="M92 110 Q118 100 148 110 Q152 120 146 128 Q118 136 90 126 Z"
        fill={cl} transform="rotate(-14 120 118)" />
      {/* torso highlight */}
      <ellipse cx="118" cy="110" rx="18" ry="6" fill="rgba(255,255,255,0.30)"
        transform="rotate(-14 118 110)" />

      {/* infant head (turned side) */}
      <ellipse cx="76" cy="116" rx="18" ry="15"
        fill={sk} transform="rotate(-18 76 116)" />
      <Spec cx="70" cy="108" rx={8} ry={5} p={p} />

      {/* ── striking hand swinging down ── */}
      <g className="hand-swing" style={{ transformOrigin: '152px 62px' }}
        filter={`url(#${p}fs)`}>
        {/* forearm of striking hand */}
        <path d="M152 62 Q148 76 142 96"
          fill="none" stroke={sk} strokeWidth="18" strokeLinecap="round" />
        <path d="M152 62 Q148 76 142 96"
          fill="none" stroke="#C8885A" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        {/* palm — clean ellipse */}
        <ellipse cx="140" cy="100" rx="14" ry="10"
          fill={sk} transform="rotate(-22 140 100)" />
        {/* finger mass — unified arch, no floating rects */}
        <path d="M 128 95 Q 130 86 136 88 Q 140 84 144 88 Q 150 86 152 95 Z"
          fill={sk} transform="rotate(-22 140 92)" />
        <Spec cx="140" cy="96" rx={7} ry={4} p={p} />
      </g>

      {/* impact shock ring */}
      <circle className="strike-shock" cx="130" cy="120" r="9"
        fill="none" stroke={severityColor} strokeWidth="2.5" opacity="0.75" />
      {/* target zone */}
      <ellipse cx="130" cy="120" rx="12" ry="7"
        fill={`url(#${p}tg)`} filter={`url(#${p}fg)`}
        transform="rotate(-14 130 120)" />

      {/* head lower arrow */}
      <path d="M56 100 L56 116" stroke={severityColor} strokeWidth="2"
        strokeLinecap="round" />
      <polygon points="51,114 61,114 56,122" fill={severityColor} />
      <text x="30" y="100" fontSize="8" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="600">head↓</text>

      <text x="10" y="178" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        head lower than chest · heel of hand · 5 firm blows
      </text>
      <text x="28" y="192" fontSize="8" fill={T.ink500} fontFamily="Inter,sans-serif">
        between the shoulder blades
      </text>
    </svg>
  );
}

export function HeimlichChild({ severityColor = T.red }) {
  const p = 'd';
  const sk  = `url(#${p}sk)`;
  const cl  = `url(#${p}cl)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Heimlich manoeuvre on standing child">
      <Defs p={p} />

      {/* ── Extra defs for this illustration ── */}
      <defs>
        {/* Adult skin — slightly darker/different to distinguish from child */}
        <radialGradient id={`${p}ask`} cx="35%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#F0D0A0" />
          <stop offset="55%"  stopColor="#D4A060" />
          <stop offset="100%" stopColor="#8C4A18" />
        </radialGradient>
        {/* Pants — dark navy */}
        <linearGradient id={`${p}pn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3A4E6A" />
          <stop offset="100%" stopColor="#22334A" />
        </linearGradient>
        {/* Adult shirt — muted grey-blue */}
        <linearGradient id={`${p}as`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7A8BA2" />
          <stop offset="100%" stopColor="#4E6278" />
        </linearGradient>
      </defs>

      {/* ════════════════════════════════════
          ADULT — drawn first so child sits in front
          ════════════════════════════════════ */}

      {/* Adult head (visible above child's left shoulder) */}
      <ellipse cx="84" cy="18" rx="18" ry="20"
        fill={`url(#${p}ask)`} opacity="0.80" />
      {/* Adult hair */}
      <path d="M66 14 Q70 2 84 4 Q98 2 102 14 Q98 6 84 8 Q70 8 66 14 Z"
        fill="#1C1008" opacity="0.70" />
      {/* Adult neck */}
      <rect x="77" y="36" width="14" height="12" rx="4"
        fill={`url(#${p}ask)`} opacity="0.75" />

      {/* Adult torso (behind child — the edges peek out at sides) */}
      {/* Left shoulder/torso visible */}
      <path d="M46 48 Q58 42 76 46 L78 130 Q62 134 50 128 Z"
        fill={`url(#${p}as)`} opacity="0.60" />
      {/* Right shoulder stub */}
      <path d="M140 46 Q154 42 166 48 L162 128 Q150 132 138 128 Z"
        fill={`url(#${p}as)`} opacity="0.60" />

      {/* ════════════════════════════════════
          CHILD — full realistic body, connected shapes
          ════════════════════════════════════ */}
      <g className="body-flex" style={{ transformOrigin: '112px 175px' }}>

        {/* ── Shoes / feet (drawn first so legs sit on top) ── */}
        <path d="M84 183 Q76 184 72 188 Q76 194 96 192 Q104 188 96 183 Z"
          fill="#222" />
        <ellipse cx="82" cy="186" rx="9" ry="3" fill="rgba(255,255,255,0.15)" />
        <path d="M136 183 Q144 184 148 188 Q144 194 124 192 Q116 188 124 183 Z"
          fill="#222" />
        <ellipse cx="138" cy="186" rx="9" ry="3" fill="rgba(255,255,255,0.15)" />

        {/* ── Pants legs ── */}
        {/* Left */}
        <path d="M94 138 Q88 158 86 174 Q86 186 97 186 Q104 186 106 178 L104 138 Z"
          fill={`url(#${p}pn)`} />
        <path d="M96 140 Q92 156 90 170" fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {/* Right */}
        <path d="M126 138 Q132 158 134 174 Q134 186 123 186 Q116 186 114 178 L116 138 Z"
          fill={`url(#${p}pn)`} />
        <path d="M124 140 Q128 156 130 170" fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

        {/* ── Child arms (filled capsule shapes, not strokes) ── */}
        {/* Left upper arm */}
        <path d="M80 80 Q70 82 65 96 Q62 110 64 122 Q66 128 73 126 Q80 124 80 116 L82 84 Z"
          fill={sk} />
        {/* Left forearm */}
        <path d="M66 122 Q62 140 62 154 Q62 162 69 162 Q76 162 76 154 L74 124 Z"
          fill={sk} />
        {/* Left hand */}
        <ellipse cx="68" cy="164" rx="7" ry="5" fill={sk}
          transform="rotate(-15 68 164)" />

        {/* Right upper arm */}
        <path d="M140 80 Q150 82 155 96 Q158 110 156 122 Q154 128 147 126 Q140 124 140 116 L138 84 Z"
          fill={sk} />
        {/* Right forearm */}
        <path d="M154 122 Q158 140 158 154 Q158 162 151 162 Q144 162 144 154 L146 124 Z"
          fill={sk} />
        {/* Right hand */}
        <ellipse cx="152" cy="164" rx="7" ry="5" fill={sk}
          transform="rotate(15 152 164)" />

        {/* ── Shirt / torso ── */}
        <path d="M80 70 Q68 76 64 88 L64 138 Q82 146 112 146 Q142 146 156 138 L156 88 Q152 76 140 70 Q132 64 112 66 Q92 64 80 70 Z"
          fill={cl} />
        {/* Collar opening */}
        <path d="M104 68 Q112 62 120 68 L118 78 Q112 72 106 78 Z"
          fill={sk} />
        {/* Shirt highlight top */}
        <ellipse cx="112" cy="80" rx="28" ry="9" fill="rgba(255,255,255,0.26)" />
        {/* Shirt fold lines */}
        <path d="M78 106 Q112 102 146 106" stroke="rgba(80,110,140,0.18)"
          strokeWidth="1.5" fill="none" />
        <path d="M80 120 Q112 117 144 120" stroke="rgba(80,110,140,0.13)"
          strokeWidth="1" fill="none" />
        {/* Belt line */}
        <path d="M88 138 Q112 136 136 138"
          stroke="#2A3448" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* ── Neck ── */}
        <path d="M104 58 L106 70 Q112 73 118 70 L120 58 Q116 54 112 54 Q108 54 104 58 Z"
          fill={sk} />

        {/* ── Head ── */}
        {/* head shadow */}
        <ellipse cx="113" cy="43" rx="21" ry="23" fill="rgba(0,0,0,0.10)" />
        {/* head */}
        <ellipse cx="112" cy="40" rx="21" ry="23" fill={sk} />
        {/* Hair */}
        <path d="M91 32 Q95 12 112 14 Q129 12 133 32 Q129 20 112 20 Q95 20 91 32 Z"
          fill="#3D2B1A" />
        {/* Side hair */}
        <ellipse cx="92" cy="38" rx="5" ry="10" fill="#3D2B1A" opacity="0.75" />
        <ellipse cx="132" cy="38" rx="5" ry="10" fill="#3D2B1A" opacity="0.75" />
        {/* Ears */}
        <ellipse cx="91" cy="42" rx="4.5" ry="5.5"
          fill={`url(#${p}skd)`} stroke="#8C4A20" strokeWidth="0.8" />
        <ellipse cx="133" cy="42" rx="4.5" ry="5.5"
          fill={`url(#${p}skd)`} stroke="#8C4A20" strokeWidth="0.8" />
        {/* Eyes — wide/alarmed (choking) */}
        <ellipse cx="104" cy="38" rx="4" ry="5" fill="#100800" />
        <ellipse cx="120" cy="38" rx="4" ry="5" fill="#100800" />
        {/* Eye shine */}
        <ellipse cx="102.5" cy="36" rx="1.8" ry="1.5" fill="white" opacity="0.8" />
        <ellipse cx="118.5" cy="36" rx="1.8" ry="1.5" fill="white" opacity="0.8" />
        {/* Eyebrows — raised in fear */}
        <path d="M100 31 Q104 28 108 30" fill="none" stroke="#3D2B1A" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M116 30 Q120 28 124 31" fill="none" stroke="#3D2B1A" strokeWidth="1.6" strokeLinecap="round" />
        {/* Nose */}
        <path d="M110 44 Q112 48 114 44" fill="none" stroke="#B07040" strokeWidth="1.3" strokeLinecap="round" />
        {/* Mouth — open, distressed */}
        <path d="M106 54 Q112 60 118 54" fill="rgba(100,40,20,0.6)" stroke="#8C4A20"
          strokeWidth="1.2" strokeLinecap="round" />
        {/* Chin/jaw shadow */}
        <path d="M96 56 Q112 64 128 56" fill="none"
          stroke="rgba(140,80,30,0.20)" strokeWidth="3" strokeLinecap="round" />
        {/* Forehead specular */}
        <Spec cx="104" cy="27" rx={10} ry={6} p={p} />
        {/* Cheek blush (distress) */}
        <ellipse cx="97" cy="48" rx="7" ry="5" fill="rgba(220,80,60,0.18)" />
        <ellipse cx="127" cy="48" rx="7" ry="5" fill="rgba(220,80,60,0.18)" />

        {/* Navel guide dot */}
        <circle cx="112" cy="118" r="2" fill="rgba(100,50,20,0.28)" />
      </g>

      {/* ════════════════════════════════════
          ADULT ARMS — wrap from behind, thrust in/up
          ════════════════════════════════════ */}
      <g className="thrust-up" filter={`url(#${p}fs)`}>
        {/* Left arm coming from behind-left, wrapping to front */}
        {/* Upper arm (behind left side) */}
        <path d="M56 72 Q54 88 56 104 Q58 112 62 112"
          fill="none" stroke={`url(#${p}ask)`} strokeWidth="20" strokeLinecap="round"
          opacity="0.72" />
        {/* Forearm reaching to fist */}
        <path d="M62 112 Q78 108 96 106"
          fill="none" stroke={`url(#${p}ask)`} strokeWidth="18" strokeLinecap="round" />

        {/* Right arm coming from behind-right */}
        <path d="M166 72 Q168 88 166 104 Q164 112 160 112"
          fill="none" stroke={`url(#${p}ask)`} strokeWidth="20" strokeLinecap="round"
          opacity="0.72" />
        <path d="M160 112 Q144 108 128 106"
          fill="none" stroke={`url(#${p}ask)`} strokeWidth="18" strokeLinecap="round" />

        {/* ── Clasped fist — seen from front ── */}
        {/* Fist body (heel of hand from right hand, left hand wraps over) */}
        <ellipse cx="112" cy="102" rx="16" ry="11"
          fill={`url(#${p}ask)`} filter={`url(#${p}fss)`} />
        {/* Shadow underside */}
        <ellipse cx="112" cy="108" rx="16" ry="6"
          fill="rgba(80,30,10,0.20)" />
        {/* Knuckle bumps */}
        {[100, 107, 114, 121].map((xk, i) => (
          <ellipse key={i} cx={xk} cy="97" rx="4" ry="3"
            fill={`url(#${p}ask)`} />
        ))}
        {/* Knuckle groove shadows */}
        {[104, 111, 118].map((xk, i) => (
          <line key={i} x1={xk} y1="95" x2={xk} y2="103"
            stroke="rgba(100,40,10,0.28)" strokeWidth="1.2" strokeLinecap="round" />
        ))}
        {/* Thumb visible on right side */}
        <path d="M126 100 Q132 96 134 102 Q132 108 126 108"
          fill={`url(#${p}ask)`} stroke="rgba(80,30,10,0.20)" strokeWidth="0.8" />
        {/* Fist specular */}
        <Spec cx="108" cy="96" rx={9} ry={4} p={p} />

        {/* Target zone at navel */}
        <ellipse cx="112" cy="116" rx="17" ry="9"
          fill={`url(#${p}tg)`} filter={`url(#${p}fg)`} />

        {/* Thrust direction arrow (inward + upward) */}
        <path className="trace-flow"
          d="M152 144 Q136 126 122 108"
          fill="none" stroke={severityColor} strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="118,104 128,110 120,116" fill={severityColor} />
      </g>

      <text x="12" y="196" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        fist above navel · sharply in and up · 5 thrusts
      </text>
    </svg>
  );
}

export function RecoveryPosition({ severityColor = T.forest500 }) {
  const p = 'e';
  const sk = `url(#${p}sk)`;
  const cl = `url(#${p}cl)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Recovery position — side lying">
      <Defs p={p} />

      {/* ground shadow */}
      <ellipse cx="100" cy="155" rx="75" ry="10" fill="rgba(0,0,0,0.07)" />

      {/* body (side-lying) */}
      <path d="M32 104 Q76 86 144 90 Q170 94 172 106 Q172 120 144 126 Q76 130 32 118 Z"
        fill={cl} />
      <ellipse cx="100" cy="92" rx="36" ry="8" fill="rgba(255,255,255,0.32)" />

      {/* head — slight tilt (airway open) */}
      <ellipse cx="28" cy="106" rx="22" ry="20" fill={sk} />
      {/* hair */}
      <ellipse cx="22" cy="90" rx="16" ry="8" fill="#5C3010" opacity="0.28" />
      <Spec cx="20" cy="96" rx={9} ry={5} p={p} />
      {/* eye closed */}
      <path d="M20 104 Q26 101 32 104" fill="none" stroke="#8C4A20" strokeWidth="1.5" strokeLinecap="round" />
      {/* mouth slightly open (airway) */}
      <path d="M18 112 Q24 116 30 112" fill="none" stroke="#8C4A20" strokeWidth="1.4" strokeLinecap="round" />

      {/* arm under cheek */}
      <SkinArm d="M40 90 Q52 76 70 78 Q76 80 70 88" width={9} p={p} />

      {/* top arm folded forward */}
      <SkinArm d="M80 90 Q100 72 124 76" width={8} p={p} />

      {/* top leg bent */}
      <SkinArm d="M148 96 Q174 78 182 94 Q186 108 176 118" width={12} p={p} />

      {/* breathing rise-fall */}
      <ellipse className="breath-cycle" cx="100" cy="106" rx="26" ry="10"
        fill={severityColor} opacity="0.20"
        style={{ transformOrigin: '100px 106px' }} />
      <ellipse cx="100" cy="100" rx="18" ry="5" fill="rgba(255,255,255,0.25)" />

      {/* airway open indicator */}
      <g className="airway-pulse">
        <path d="M10 96 Q14 86 22 82"
          fill="none" stroke={severityColor} strokeWidth="2" strokeLinecap="round" />
        <polygon points="20,78 28,86 18,86" fill={severityColor} opacity="0.9" />
        <text x="4" y="76" fontSize="8" fill={severityColor}
          fontFamily="Inter,sans-serif" fontWeight="600">airway</text>
      </g>

      <text x="28" y="166" fontSize="9" fill={T.ink500} fontFamily="Inter,sans-serif">
        side-lying · head tilted back · watch the chest rise
      </text>
    </svg>
  );
}

export function BurnCooling({ severityColor = '#B45309' }) {
  const p = 'f';
  const sk = `url(#${p}sk)`;
  const wa = `url(#${p}wa)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Cool burn under running water for 20 minutes">
      <Defs p={p} />

      {/* ── tap / faucet ── */}
      {/* wall plate */}
      <rect x="62" y="10" width="76" height="22" rx="5"
        fill="#D0D8E0" stroke="#8090A0" strokeWidth="1.5" />
      <rect x="64" y="12" width="72" height="10" rx="3" fill="rgba(255,255,255,0.45)" />
      {/* spout */}
      <rect x="92" y="32" width="16" height="16" rx="4"
        fill="#B0B8C0" stroke="#8090A0" strokeWidth="1.4" />
      {/* handle */}
      <rect x="56" y="13" width="22" height="10" rx="4"
        fill="#C0C8D0" stroke="#8090A0" strokeWidth="1.2" />
      <rect x="58" y="14" width="18" height="5" rx="2" fill="rgba(255,255,255,0.5)" />

      {/* ── continuous water stream ── */}
      {[0, 1, 2, 3, 4].map(i => (
        <path key={i}
          className="water-flow"
          d={`M${97 + i * 2} 48 Q${98 + i} ${72 + i * 4} ${97 + i * 2} ${96 + i * 4}`}
          fill="none" stroke={wa} strokeWidth={3.5 - i * 0.5}
          strokeLinecap="round" strokeDasharray="12 5" opacity={0.9 - i * 0.1}
          style={{ animationDelay: `${i * 0.1}s` }} />
      ))}

      {/* water splash at impact on hand */}
      <ellipse cx="100" cy="142" rx="18" ry="6" fill="#60A5FA" opacity="0.25" />

      {/* ── hand (3D with gradient) ── */}
      <g filter={`url(#${p}fss)`}>
        {/* palm */}
        <path
          d="M62 150 Q60 124 78 120 L78 96 Q78 84 87 83 Q96 82 97 93 L97 112 Q105 107 112 116 Q120 107 126 116 Q133 111 138 124 L138 154 Q138 178 100 180 Q62 178 62 150 Z"
          fill={sk} />
        {/* palm shadow underside */}
        <path
          d="M64 158 Q65 172 100 178 Q136 172 136 158"
          fill="rgba(140,70,30,0.18)" />
        {/* knuckle creases */}
        <path d="M70 120 Q72 116 78 118" stroke="rgba(140,70,30,0.35)" strokeWidth="1.2" fill="none" />
        <path d="M78 112 Q82 108 88 110" stroke="rgba(140,70,30,0.35)" strokeWidth="1.2" fill="none" />
        {/* burn highlight area */}
        <ellipse cx="100" cy="138" rx="18" ry="9"
          fill={`url(#${p}tga)`} filter={`url(#${p}fg)`} />
        {/* water on burn (shimmer) */}
        <ellipse className="breath-cycle" cx="100" cy="136" rx="14" ry="6"
          fill="#93C5FD" opacity="0.22" />
        {/* palm specular (top lit from stream) */}
        <Spec cx="90" cy="120" rx={12} ry={6} p={p} />
      </g>

      {/* ── 20-min badge ── */}
      <circle className="cpr-pulse" cx="168" cy="78" r="17"
        fill="rgba(180,83,9,0.12)" stroke={severityColor} strokeWidth="1.6" />
      <text x="168" y="74" textAnchor="middle" fontSize="10" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="800">20</text>
      <text x="168" y="87" textAnchor="middle" fontSize="7.5" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="600">min</text>

      <text x="10" y="196" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        cool running water · 20 minutes · never ice
      </text>
    </svg>
  );
}

export function BleedingPressure({ severityColor = T.red }) {
  const p = 'g';
  const sk  = `url(#${p}sk)`;
  const skd = `url(#${p}skd)`;

  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Firm direct pressure on wound">
      <Defs p={p} />

      {/* ── victim's forearm ── */}
      <g filter={`url(#${p}fss)`}>
        <path d="M 20 122 Q 18 107 42 106 L 160 110 Q 182 110 182 124
                 Q 182 140 160 144 L 42 148 Q 18 148 20 136 Z"
          fill={sk} />
        {/* top highlight */}
        <ellipse cx="100" cy="113" rx="74" ry="7" fill="rgba(255,240,205,0.42)" />
        {/* underside ambient shadow */}
        <ellipse cx="100" cy="145" rx="74" ry="5" fill="rgba(100,45,0,0.16)" />
      </g>

      {/* wound glow (beneath gauze) */}
      <ellipse cx="100" cy="128" rx="18" ry="9" fill={`url(#${p}tg)`} />

      {/* ── gauze pad ── */}
      <g className="gauze-press" style={{ transformOrigin: '100px 118px' }}
        filter={`url(#${p}fss)`}>
        <rect x="70" y="104" width="60" height="40" rx="7"
          fill="#F9F9F9" stroke="rgba(185,185,185,0.4)" strokeWidth="0.8" />
        {[112, 120, 128].map(yy => (
          <line key={yy} x1="73" y1={yy} x2="127" y2={yy} stroke="#EBEBEB" strokeWidth="0.65" />
        ))}
        {/* top surface highlight */}
        <rect x="71" y="105" width="58" height="9" rx="5" fill="rgba(255,255,255,0.65)" />
        {/* blood seep through gauze — barely there */}
        <ellipse cx="100" cy="134" rx="11" ry="4" fill={severityColor} opacity="0.14" />
      </g>

      {/* ── pressing hand — realistic overhead view ── */}
      <g className="gauze-press" style={{ transformOrigin: '100px 90px' }}
        filter={`url(#${p}fs)`}>

        {/* Thumb — filled closed path, naturally shaped */}
        <path d="M 74 82 Q 62 78 54 88 Q 47 100 54 110 Q 62 118 72 112
                 Q 74 110 74 102 Z"
          fill={sk} />
        <path d="M 70 88 Q 60 92 55 103"
          fill="none" stroke="rgba(120,60,20,0.18)" strokeWidth="1.1" strokeLinecap="round" />

        {/* 4-finger mass + palm — one unified path */}
        {/* Fingertip silhouette: valleys between fingers are concave dips, not raised bumps */}
        <path d="
          M 74 76 L 74 50
          Q 75 30 82 25
          Q 88 32 94 20
          Q 100 32 106 25
          Q 112 30 118 28
          Q 124 34 126 50
          L 126 76
          L 126 104 Q 126 112 118 113
          L 82 113 Q 74 112 74 104 Z"
          fill={sk} />

        {/* Dorsal overlay — slightly darker on finger backs vs palm */}
        <path d="
          M 74 76 L 74 50
          Q 75 30 82 25
          Q 88 32 94 20
          Q 100 32 106 25
          Q 112 30 118 28
          Q 124 34 126 50
          L 126 76 Z"
          fill={skd} opacity="0.28" />

        {/* Finger groove lines */}
        <line x1="88"  y1="30" x2="88"  y2="72" stroke="rgba(110,55,15,0.20)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="100" y1="28" x2="100" y2="72" stroke="rgba(110,55,15,0.20)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="112" y1="30" x2="112" y2="72" stroke="rgba(110,55,15,0.20)" strokeWidth="1.2" strokeLinecap="round" />

        {/* Knuckle ridge + bumps */}
        <path d="M 74 76 Q 100 80 126 76"
          fill="none" stroke="rgba(140,70,25,0.22)" strokeWidth="1.4" strokeLinecap="round" />
        {[82, 94, 107, 120].map(xk => (
          <ellipse key={xk} cx={xk} cy="75" rx="4.5" ry="2.5" fill="rgba(130,65,20,0.22)" />
        ))}

        {/* Palm crease */}
        <path d="M 80 94 Q 100 98 120 94"
          fill="none" stroke="rgba(120,60,20,0.15)" strokeWidth="1.1" strokeLinecap="round" />

        {/* Specular highlight — top-lit across knuckle ridge */}
        <ellipse cx="100" cy="46" rx="24" ry="9" fill="rgba(255,255,255,0.36)" />
        <ellipse cx="100" cy="92" rx="18" ry="5" fill="rgba(255,245,225,0.28)" />
      </g>

      {/* ── downward pressure arrows ── */}
      <path className="trace-flow" d="M 82 10 L 82 30"
        stroke={severityColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <polygon points="77,28 87,28 82,38" fill={severityColor} />
      <path className="trace-flow" d="M 118 10 L 118 30"
        stroke={severityColor} strokeWidth="2.2" strokeLinecap="round" fill="none"
        style={{ animationDelay: '0.22s' }} />
      <polygon points="113,28 123,28 118,38" fill={severityColor} />

      {/* ── no-peek badge ── */}
      <circle cx="166" cy="40" r="14"
        fill="rgba(220,38,38,0.07)" stroke={severityColor} strokeWidth="1.4" />
      <line x1="157" y1="31" x2="175" y2="49"
        stroke={severityColor} strokeWidth="1.8" strokeLinecap="round" />
      <text x="166" y="65" textAnchor="middle" fontSize="7.5" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="600">no peek</text>

      <text x="100" y="193" textAnchor="middle" fontSize="8" fill={T.ink500}
        fontFamily="Inter,sans-serif">firm pressure · never remove first cloth</text>
    </svg>
  );
}

export function ElectricShock({ severityColor = T.red }) {
  const p = 'h';
  const sk = `url(#${p}sk)`;
  const cl = `url(#${p}cl)`;
  const wd = `url(#${p}wd)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Electric shock — do not touch, cut power first">
      <Defs p={p} />

      {/* socket wall plate */}
      <rect x="8" y="72" width="44" height="56" rx="6"
        fill="#E8EAF0" stroke="#90A0B0" strokeWidth="2" />
      <rect x="10" y="74" width="40" height="16" rx="4" fill="rgba(255,255,255,0.5)" />
      <circle cx="22" cy="96" r="5" fill="#5060A0" opacity="0.7" />
      <circle cx="40" cy="96" r="5" fill="#5060A0" opacity="0.7" />
      <rect x="24" y="106" width="16" height="10" rx="2" fill="#5060A0" opacity="0.5" />

      {/* animated lightning arc */}
      <path className="arc-flicker"
        d="M52 92 L68 80 L58 96 L76 86 L66 104 L84 96"
        fill="none" stroke={severityColor} strokeWidth="4"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* arc glow */}
      <path className="arc-flicker"
        d="M52 92 L68 80 L58 96 L76 86 L66 104 L84 96"
        fill="none" stroke={severityColor} strokeWidth="10" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.18"
        style={{ animationDelay: '0.05s' }} />
      {/* secondary branch */}
      <path className="arc-flicker"
        d="M60 90 L72 82 L66 96"
        fill="none" stroke={severityColor} strokeWidth="2.5" strokeLinecap="round"
        style={{ animationDelay: '0.1s' }} />

      {/* ── child (recoiling from shock) ── */}
      <g className="push-away">
        {/* hair */}
        <path d="M 121 60 Q 126 48 138 50 Q 150 48 155 60 Q 150 52 138 54 Q 126 54 121 60 Z"
          fill="#3D2B1A" />
        {/* head — no stroke */}
        <ellipse cx="138" cy="68" rx="17" ry="18" fill={sk} />
        <Spec cx="130" cy="58" rx={7} ry={4} p={p} />
        {/* wide-open shocked eyes */}
        <ellipse cx="131" cy="66" rx="3.5" ry="4.5" fill="#100800" />
        <ellipse cx="145" cy="66" rx="3.5" ry="4.5" fill="#100800" />
        <ellipse cx="130" cy="64" rx="1.5" ry="1.5" fill="white" opacity="0.8" />
        <ellipse cx="144" cy="64" rx="1.5" ry="1.5" fill="white" opacity="0.8" />
        {/* open O-mouth */}
        <ellipse cx="138" cy="78" rx="4" ry="3.5" fill="#7A3020" opacity="0.8" />
        {/* neck */}
        <path d="M 131 84 L 132 96 Q 138 99 144 96 L 145 84 Z" fill={sk} />
        {/* torso — curved path, not a rect */}
        <path d="M 118 94 Q 116 116 120 142 L 156 142 Q 160 116 158 94
                 Q 150 88 138 88 Q 126 88 118 94 Z" fill={cl} />
        <ellipse cx="138" cy="102" rx="14" ry="7" fill="rgba(255,255,255,0.26)" />
        {/* arms flung back — filled paths */}
        <path d="M 120 102 Q 106 96 98 104 Q 96 110 102 112 Q 110 108 120 108 Z" fill={sk} />
        <path d="M 156 102 Q 170 96 178 104 Q 180 110 174 112 Q 166 108 156 108 Z" fill={sk} />
        {/* legs — tapered filled paths */}
        <path d="M 122 142 Q 120 160 118 176 Q 114 184 124 186 Q 132 184 130 176 L 128 142 Z"
          fill={cl} />
        <path d="M 154 142 Q 156 160 158 176 Q 162 184 152 186 Q 144 184 146 176 L 148 142 Z"
          fill={cl} />
        {/* shoes */}
        <ellipse cx="121" cy="184" rx="10" ry="4" fill="#222" />
        <ellipse cx="155" cy="184" rx="10" ry="4" fill="#222" />
      </g>

      {/* ── dry wooden rescue stick ── */}
      <rect x="78" y="108" width="56" height="9" rx="3"
        fill={wd} stroke="#6B3A1C" strokeWidth="1.3"
        transform="rotate(-8 106 112)" />
      {/* wood grain */}
      <line x1="88" y1="108" x2="92" y2="116" stroke="rgba(100,60,20,0.22)" strokeWidth="1"
        transform="rotate(-8 90 112)" />
      <line x1="104" y1="108" x2="108" y2="116" stroke="rgba(100,60,20,0.22)" strokeWidth="1"
        transform="rotate(-8 106 112)" />
      <text x="84" y="138" fontSize="7.5" fill="#7B4020"
        fontFamily="Inter,sans-serif" fontWeight="700">DRY WOOD ONLY</text>

      {/* cut-power badge */}
      <rect x="8" y="136" width="50" height="26" rx="7"
        fill={severityColor} opacity="0.12" stroke={severityColor} strokeWidth="1.3" />
      <text x="33" y="148" textAnchor="middle" fontSize="8" fill={severityColor}
        fontFamily="Inter,sans-serif" fontWeight="800">CUT POWER</text>
      <text x="33" y="158" textAnchor="middle" fontSize="7" fill={severityColor}
        fontFamily="Inter,sans-serif">FIRST</text>

      <text x="8" y="190" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        cut power first · dry wood only · never metal
      </text>
    </svg>
  );
}

export function PoisoningPill({ severityColor = '#B45309' }) {
  const p = 'i';
  const sk = `url(#${p}sk)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Poisoning — do not induce vomiting">
      <Defs p={p} />

      {/* bottle body with gradient */}
      <rect x="64" y="58" width="72" height="96" rx="10"
        fill="#F0F4F0" stroke="#606860" strokeWidth="2" />
      <rect x="66" y="60" width="66" height="40" rx="8" fill="rgba(255,255,255,0.6)" />
      {/* bottle neck */}
      <rect x="74" y="40" width="52" height="20" rx="5"
        fill="#E8EAE8" stroke="#606860" strokeWidth="1.8" />
      {/* cap */}
      <rect x="78" y="28" width="44" height="14" rx="4"
        fill="#4A5A4A" stroke="#2A3A2A" strokeWidth="1.4" />
      <rect x="80" y="30" width="40" height="6" rx="2" fill="rgba(255,255,255,0.25)" />

      {/* warning label */}
      <rect x="72" y="72" width="56" height="60" rx="4"
        fill={severityColor} opacity="0.12" stroke={severityColor} strokeWidth="1.3" />
      {/* skull */}
      <circle cx="100" cy="94" r="15" fill={severityColor} opacity="0.55" />
      <rect x="90" y="104" width="20" height="11" rx="2" fill={severityColor} opacity="0.55" />
      <circle cx="93" cy="93" r="4.5" fill="#FFF8F0" opacity="0.92" />
      <circle cx="107" cy="93" r="4.5" fill="#FFF8F0" opacity="0.92" />
      <rect x="95" y="106" width="4" height="7" rx="1" fill="#FFF8F0" opacity="0.88" />
      <rect x="101" y="106" width="4" height="7" rx="1" fill="#FFF8F0" opacity="0.88" />
      <text x="100" y="136" textAnchor="middle" fontSize="9"
        fill={severityColor} fontFamily="Inter,sans-serif" fontWeight="800">POISON</text>

      {/* spilled pills (3D ellipses) */}
      {[{ cx: 42, cy: 172, rx: 13, ry: 5, c: '#FFCCEE' },
        { cx: 68, cy: 178, rx: 12, ry: 4.5, c: '#CCE8FF' },
        { cx: 148, cy: 174, rx: 13, ry: 5, c: '#FFCCEE' },
        { cx: 170, cy: 168, rx: 11, ry: 4, c: '#CCE8FF' }].map((pp, i) => (
        <g key={i}>
          <ellipse cx={pp.cx} cy={pp.cy + 2} rx={pp.rx} ry={pp.ry * 0.5}
            fill="rgba(0,0,0,0.1)" />
          <ellipse cx={pp.cx} cy={pp.cy} rx={pp.rx} ry={pp.ry}
            fill={pp.c} stroke="#A0A0A0" strokeWidth="1" />
          <ellipse cx={pp.cx - pp.rx * 0.2} cy={pp.cy - pp.ry * 0.3}
            rx={pp.rx * 0.4} ry={pp.ry * 0.35} fill="rgba(255,255,255,0.5)" />
        </g>
      ))}

      {/* pulsing alert badge */}
      <circle className="cpr-pulse" cx="166" cy="46" r="18"
        fill={severityColor} opacity="0.14" stroke={severityColor} strokeWidth="1.8" />
      <text x="166" y="42" textAnchor="middle" fontSize="14"
        fill={severityColor} fontFamily="Inter,sans-serif" fontWeight="900">!</text>
      <text x="166" y="57" textAnchor="middle" fontSize="7.5"
        fill={severityColor} fontFamily="Inter,sans-serif" fontWeight="600">CALL NOW</text>

      {/* no-vomit icon */}
      <circle cx="28" cy="98" r="19" fill="rgba(220,38,38,0.08)"
        stroke={severityColor} strokeWidth="1.6" />
      <text x="28" y="96" textAnchor="middle" fontSize="12" fill={severityColor}
        fontFamily="Inter,sans-serif">🤢</text>
      <line x1="14" y1="84" x2="42" y2="112" stroke={severityColor}
        strokeWidth="2.5" strokeLinecap="round" />

      <text x="12" y="197" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        never induce vomiting · take container to hospital
      </text>
    </svg>
  );
}

export function FeverThermometer({ severityColor = '#166534' }) {
  const p = 'j';
  const sk = `url(#${p}sk)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Fever — treat the child, not the number">
      <Defs p={p} />

      {/* thermometer glass */}
      <rect x="88" y="22" width="24" height="124" rx="12"
        fill="#EEF4FF" stroke="#8090B0" strokeWidth="1.8" />
      {/* glass shine */}
      <rect x="90" y="24" width="8" height="114" rx="4"
        fill="rgba(255,255,255,0.55)" />
      {/* bulb */}
      <circle cx="100" cy="158" r="21"
        fill={severityColor} stroke="#0D5028" strokeWidth="1.8" />
      <ellipse cx="95" cy="150" rx="7" ry="5" fill="rgba(255,255,255,0.30)" />

      {/* mercury — breath-cycle makes it rise/fall */}
      <rect className="breath-cycle" x="93" y="78" width="14" height="84" rx="5"
        fill={severityColor}
        style={{ transformOrigin: '100px 162px' }} />
      {/* tick marks */}
      {[40, 60, 80, 100, 120, 140].map(yy => (
        <line key={yy} x1="74" y1={yy} x2="88" y2={yy}
          stroke="#8090B0" strokeWidth="1.5" />
      ))}
      <text x="56" y="44" fontSize="8" fill="#4060A0" fontFamily="Inter,sans-serif">40°</text>
      <text x="56" y="84" fontSize="8" fill="#4060A0" fontFamily="Inter,sans-serif">38°</text>
      <text x="56" y="124" fontSize="8" fill="#4060A0" fontFamily="Inter,sans-serif">36°</text>

      {/* heat waves */}
      <path className="heat-rise"
        d="M136 56 Q148 64 136 74 Q124 84 136 94"
        fill="none" stroke={severityColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path className="heat-rise-2"
        d="M152 44 Q166 54 152 64 Q138 74 152 84"
        fill="none" stroke={severityColor} strokeWidth="2" strokeLinecap="round" opacity="0.38" />

      {/* ── child with cool cloth ── */}
      {/* neck */}
      <path d="M 28 108 L 29 120 Q 38 124 47 120 L 48 108 Z" fill={sk} />
      {/* shoulder suggestion */}
      <path d="M 16 120 Q 38 126 60 120" fill="none"
        stroke="#B8CCE0" strokeWidth="10" strokeLinecap="round" />
      {/* head */}
      <ellipse cx="38" cy="88" rx="23" ry="22" fill={sk} />
      <ellipse cx="30" cy="74" rx="16" ry="8" fill="#5C3010" opacity="0.26" />
      <Spec cx="30" cy="78" rx={9} ry={5} p={p} />
      {/* eyes closed (unwell) */}
      <path d="M28 86 Q34 83 40 86" fill="none" stroke="#8C4A20" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 88 Q34 92 40 88" fill="none" stroke="#8C4A20" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      {/* rosy cheeks */}
      <circle cx="26" cy="96" r="7" fill="rgba(220,80,80,0.18)" />
      <circle cx="50" cy="96" r="7" fill="rgba(220,80,80,0.18)" />

      {/* cool cloth on forehead — no stroke */}
      <rect x="18" y="70" width="38" height="12" rx="4" fill="#BFDBFE" />
      <rect x="20" y="72" width="34" height="5" rx="2" fill="rgba(255,255,255,0.55)" />
      <rect className="water-sway" x="22" y="73" width="10" height="7" rx="2"
        fill="rgba(59,130,246,0.22)" />

      <text x="12" y="172" fontSize="9" fill={T.ink500} fontFamily="Inter,sans-serif">
        treat the child, not the number
      </text>
      <text x="16" y="186" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        light clothing · fluids · paracetamol if needed
      </text>
    </svg>
  );
}

export function BiteWound({ severityColor = '#166534' }) {
  const p = 'k';
  const sk = `url(#${p}sk)`;
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 300 }}
      aria-label="Wash animal bite with soap and water">
      <Defs p={p} />

      {/* ── tap ── */}
      <rect x="62" y="16" width="76" height="16" rx="4"
        fill="#C0C8D0" stroke="#8090A0" strokeWidth="1.5" />
      <rect x="64" y="18" width="70" height="7" rx="3" fill="rgba(255,255,255,0.5)" />
      <rect x="96" y="32" width="14" height="12" rx="4"
        fill="#B0B8C0" stroke="#8090A0" strokeWidth="1.3" />
      <rect x="58" y="18" width="20" height="8" rx="3"
        fill="#B0B8C0" stroke="#8090A0" strokeWidth="1.1" />

      {/* ── water stream ── */}
      {[0, 1, 2].map(i => (
        <path key={i} className="water-flow"
          d={`M${99 + i * 3} 44 Q${100 + i * 2} 70 ${99 + i * 3} 96`}
          fill="none" stroke={`url(#${p}wa)`} strokeWidth={3.5 - i * 0.8}
          strokeLinecap="round" strokeDasharray="10 5" opacity={0.85 - i * 0.1}
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}

      {/* ── hand (3D) ── */}
      <g filter={`url(#${p}fss)`}>
        {/* palm */}
        <path
          d="M52 158 Q50 118 70 116 L70 84 Q70 72 80 71 Q90 70 91 82 L91 104 Q99 99 107 108 Q115 99 121 108 Q129 103 134 116 L134 152 Q134 180 92 182 Q52 180 52 158 Z"
          fill={sk} />
        {/* shadow underside */}
        <path d="M54 162 Q58 176 92 180 Q128 176 132 162"
          fill="rgba(140,70,30,0.18)" />
        {/* knuckle highlights */}
        <ellipse cx="70" cy="116" rx="5" ry="3" fill="rgba(255,220,190,0.6)" />
        <ellipse cx="91" cy="104" rx="5" ry="3" fill="rgba(255,220,190,0.6)" />
        {/* bite mark */}
        <ellipse cx="100" cy="140" rx="11" ry="8"
          fill={severityColor} opacity="0.55" />
        {/* tooth indentations */}
        <path d="M93 135 Q96 130 100 135 Q104 130 107 135"
          fill="none" stroke="#FFF8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        {/* palm specular */}
        <Spec cx="80" cy="118" rx={14} ry={7} p={p} />
      </g>

      {/* soap bubbles */}
      <circle className="bubble-rise" cx="88" cy="118" r="5"
        fill="rgba(255,255,255,0.75)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />
      <circle className="bubble-rise-2" cx="104" cy="122" r="3.5"
        fill="rgba(255,255,255,0.75)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />
      <circle className="bubble-rise-3" cx="96" cy="114" r="4"
        fill="rgba(255,255,255,0.75)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />

      {/* bandage sliding over */}
      <g className="slide-cover">
        <rect x="78" y="132" width="44" height="18" rx="4"
          fill="#FFFFFF" stroke="#C0C0C0" strokeWidth="1.5" />
        {/* centre pad */}
        <rect x="92" y="134" width="16" height="14" rx="2"
          fill="rgba(255,180,180,0.55)" />
        {/* stripe lines */}
        {[78, 112].map(xx => (
          <g key={xx}>
            <line x1={xx} y1="136" x2={xx + 12} y2="136" stroke="#DDD" strokeWidth="0.9" />
            <line x1={xx} y1="140" x2={xx + 12} y2="140" stroke="#DDD" strokeWidth="0.9" />
            <line x1={xx} y1="144" x2={xx + 12} y2="144" stroke="#DDD" strokeWidth="0.9" />
          </g>
        ))}
        {/* bandage shine */}
        <rect x="80" y="134" width="36" height="5" rx="2" fill="rgba(255,255,255,0.55)" />
      </g>

      <text x="10" y="196" fontSize="8.5" fill={T.ink500} fontFamily="Inter,sans-serif">
        wash with soap 5 min · cover · see a doctor
      </text>
    </svg>
  );
}

// ─── Mini step illustrations (90×90) ─────────────────────────────

export function MiniHeadTilt() {
  const p = 'm1';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      <ellipse cx="40" cy="38" rx="20" ry="22"
        fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1.2" />
      <Spec cx="33" cy="28" rx={8} ry={5} p={p} />
      <rect x="52" y="44" width="10" height="16" rx="4" fill={`url(#${p}sk)`} />
      {/* chin lift finger */}
      <path d="M32 56 Q40 64 54 60"
        fill="none" stroke={`url(#${p}sk)`} strokeWidth="7" strokeLinecap="round" />
      {/* tilt arrow */}
      <path className="breath-cycle"
        d="M60 34 Q72 24 78 34"
        fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="78,30 84,40 74,38" fill={T.red} />
      <text x="45" y="84" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">tilt · lift chin</text>
    </svg>
  );
}

export function MiniBreathCheck() {
  const p = 'm2';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      {/* head */}
      <ellipse cx="32" cy="36" rx="18" ry="20"
        fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1.2" />
      <Spec cx="26" cy="27" rx={7} ry={4} p={p} />
      {/* ear leaning in */}
      <ellipse cx="70" cy="44" rx="11" ry="14"
        fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1.2"
        transform="rotate(15 70 44)" />
      {/* sound waves */}
      {[1, 2, 3].map(i => (
        <path key={i} className="breath-cycle"
          d={`M42 42 Q${46 + i * 7} ${38 + i} ${46 + i * 7} ${44 + i}`}
          fill="none" stroke={T.forest500} strokeWidth="1.5"
          strokeLinecap="round" opacity={1 - i * 0.25}
          style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <text x="45" y="84" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">look · listen · feel</text>
    </svg>
  );
}

export function MiniFirmBlows() {
  const p = 'm3';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      {/* back area */}
      <rect x="18" y="26" width="46" height="38" rx="10"
        fill={`url(#${p}cl)`} stroke="#5A7A9A" strokeWidth="1.3" />
      <ellipse cx="40" cy="32" rx="16" ry="5" fill="rgba(255,255,255,0.32)" />
      {/* striking hand */}
      <g className="hand-swing" style={{ transformOrigin: '68px 16px' }}
        filter={`url(#${p}fss)`}>
        <path d="M68 16 Q62 28 56 46"
          fill="none" stroke={`url(#${p}sk)`} strokeWidth="14" strokeLinecap="round" />
        <ellipse cx="53" cy="49" rx="9" ry="6"
          fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1" />
      </g>
      <circle className="strike-shock" cx="42" cy="44" r="7"
        fill="none" stroke={T.red} strokeWidth="2" opacity="0.75" />
      <text x="45" y="82" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">5 firm back blows</text>
    </svg>
  );
}

export function MiniWaterCool() {
  const p = 'm4';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      <rect x="26" y="8" width="38" height="12" rx="3"
        fill="#C0C8D0" stroke="#8090A0" strokeWidth="1.3" />
      <rect x="40" y="20" width="10" height="10" rx="3"
        fill="#B0B8C0" stroke="#8090A0" strokeWidth="1.1" />
      <path className="water-flow" d="M45 30 Q44 46 45 60"
        fill="none" stroke={`url(#${p}wa)`}
        strokeWidth="5" strokeLinecap="round" strokeDasharray="10 5" opacity="0.85" />
      <ellipse cx="45" cy="68" rx="18" ry="13"
        fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1.3" />
      <Spec cx="40" cy="62" rx={8} ry={5} p={p} />
      <text x="45" y="86" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">20 minutes</text>
    </svg>
  );
}

export function MiniGauzePress() {
  const p = 'm5';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      <rect x="8" y="52" width="74" height="26" rx="13"
        fill={`url(#${p}sk)`} stroke="#B07040" strokeWidth="1.4" />
      <g className="gauze-press" style={{ transformOrigin: '45px 54px' }}>
        <rect x="24" y="36" width="42" height="24" rx="4"
          fill="#FFFFFF" stroke="#C0C0C0" strokeWidth="1.4" />
        <ellipse cx="44" cy="48" rx="15" ry="4" fill="rgba(255,255,255,0.5)" />
      </g>
      <path className="trace-flow" d="M45 16 L45 38"
        stroke={T.red} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <polygon points="40,36 50,36 45,44" fill={T.red} />
      <text x="45" y="86" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">firm · do not peek</text>
    </svg>
  );
}

export function MiniRecoveryRoll() {
  const p = 'm6';
  return (
    <svg viewBox="0 0 90 90" width={90} height={90}>
      <Defs p={p} />
      <g className="body-flex" style={{ transformOrigin: '44px 44px' }}>
        <ellipse cx="20" cy="44" rx="11" ry="14"
          fill={`url(#${p}sk)`} stroke="#8C4A20" strokeWidth="1.2" />
        <rect x="30" y="36" width="44" height="26" rx="9"
          fill={`url(#${p}cl)`} stroke="#5A7A9A" strokeWidth="1.3" />
        <ellipse cx="52" cy="40" rx="14" ry="5" fill="rgba(255,255,255,0.32)" />
      </g>
      <path d="M54 20 Q76 28 74 46 Q72 62 58 68"
        fill="none" stroke={T.forest500} strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="4 3"
        className="trace-flow" />
      <polygon points="54,64 64,70 58,76" fill={T.forest500} />
      <text x="45" y="86" textAnchor="middle" fontSize="7.5"
        fill={T.ink500} fontFamily="Inter,sans-serif">roll to side</text>
    </svg>
  );
}

// ─── Resolvers ────────────────────────────────────────────────────

export const ILLUSTRATIONS = {
  HandPlacementInfant,
  HandPlacementChild,
  BackBlowInfant,
  HeimlichChild,
  RecoveryPosition,
  BurnCooling,
  BleedingPressure,
  ElectricShock,
  PoisoningPill,
  FeverThermometer,
  BiteWound,
};

export const MINI_ILLUSTRATIONS = {
  MiniHeadTilt,
  MiniBreathCheck,
  MiniFirmBlows,
  MiniWaterCool,
  MiniGauzePress,
  MiniRecoveryRoll,
};
