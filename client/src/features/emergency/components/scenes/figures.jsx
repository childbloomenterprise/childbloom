/**
 * SOS scene figure library — posable pseudo-3D puppets.
 *
 * Conventions:
 * - Scene canvas is 440×320 (compact 440×240), floor line ≈ y 262.
 * - Every scene calls useSvgId() once and threads `uid` through so
 *   gradient/filter ids never collide when two scenes mount together.
 * - Moving parts are drawn around their pivot point at local (0,0),
 *   positioned by an OUTER <g transform=…> and animated by an INNER
 *   <g className="sc-…"> — CSS transforms replace the attribute
 *   transform, so the two must never share an element.
 * - No <text> elements, ever. Labels are HTML outside the svg.
 */
import { useId } from 'react';

export function useSvgId() {
  // React 19 ids contain «» which are unreliable inside url(#…)
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

export const g = (uid, name) => `url(#${uid}-${name})`;

/* ── palette ───────────────────────────────────────────────── */
export const SKIN = { hi: '#FFE9CD', mid: '#F2C49C', deep: '#CE8B55', line: '#A8632E', blush: '#E8927A' };
export const ASKIN = { hi: '#F6D2A9', mid: '#E0A878', deep: '#B5793F', line: '#8E5526' };
export const HAIR = '#412B17';
export const ONESIE = { hi: '#F5F9FD', mid: '#C9DAEA', deep: '#90ACC8', fold: '#7C97B2' };
export const SHIRT = { hi: '#EAF4EE', mid: '#B2D0C1', deep: '#74A08C', fold: '#5E8674' };
export const SLEEVE = { hi: '#8FB7AA', mid: '#54897A', deep: '#36604F' };

/* ── shared defs: gradients + filters (one per scene) ──────── */
export function FigureDefs({ uid }) {
  return (
    <defs>
      {/* infant / child skin — key light top-left */}
      <radialGradient id={`${uid}-iskin`} cx="38%" cy="30%" r="75%">
        <stop offset="0%" stopColor={SKIN.hi} />
        <stop offset="52%" stopColor={SKIN.mid} />
        <stop offset="100%" stopColor={SKIN.deep} />
      </radialGradient>
      {/* limb skin — lit along the top edge */}
      <linearGradient id={`${uid}-iskinL`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SKIN.hi} />
        <stop offset="45%" stopColor={SKIN.mid} />
        <stop offset="100%" stopColor={SKIN.deep} />
      </linearGradient>
      {/* adult skin */}
      <radialGradient id={`${uid}-askin`} cx="38%" cy="28%" r="78%">
        <stop offset="0%" stopColor={ASKIN.hi} />
        <stop offset="50%" stopColor={ASKIN.mid} />
        <stop offset="100%" stopColor={ASKIN.deep} />
      </radialGradient>
      <linearGradient id={`${uid}-askinL`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ASKIN.hi} />
        <stop offset="45%" stopColor={ASKIN.mid} />
        <stop offset="100%" stopColor={ASKIN.deep} />
      </linearGradient>
      {/* onesie cloth */}
      <linearGradient id={`${uid}-onesie`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ONESIE.hi} />
        <stop offset="55%" stopColor={ONESIE.mid} />
        <stop offset="100%" stopColor={ONESIE.deep} />
      </linearGradient>
      {/* child shirt */}
      <linearGradient id={`${uid}-shirt`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SHIRT.hi} />
        <stop offset="55%" stopColor={SHIRT.mid} />
        <stop offset="100%" stopColor={SHIRT.deep} />
      </linearGradient>
      {/* adult sleeve */}
      <linearGradient id={`${uid}-sleeve`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SLEEVE.hi} />
        <stop offset="55%" stopColor={SLEEVE.mid} />
        <stop offset="100%" stopColor={SLEEVE.deep} />
      </linearGradient>
      {/* accent target glow — follows scene accent colour */}
      <radialGradient id={`${uid}-tglow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
        <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.16" />
        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
      </radialGradient>
      {/* specular highlight */}
      <radialGradient id={`${uid}-spec`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      {/* water */}
      <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A5CCF5" />
        <stop offset="100%" stopColor="#2E6FD4" />
      </linearGradient>
      {/* soft blur for contact shadows */}
      <filter id={`${uid}-blur`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id={`${uid}-blur6`} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      {/* lift shadow for hands / props above the body */}
      <filter id={`${uid}-lift`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="1.5" dy="4" stdDeviation="4" floodColor="#2A1408" floodOpacity="0.3" />
      </filter>
      {/* arrowhead for motion arrows */}
      <marker id={`${uid}-ah`} viewBox="0 0 10 10" refX="7.5" refY="5"
        markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="var(--accent)" />
      </marker>
    </defs>
  );
}

/* ── stage helpers ─────────────────────────────────────────── */

export function ContactShadow({ uid, cx, cy, rx, ry, opacity = 0.26 }) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry ?? Math.max(6, rx * 0.16)}
      fill="#33200E" opacity={opacity} filter={g(uid, 'blur')} />
  );
}

export function TargetGlow({ uid, cx, cy, r = 26 }) {
  return (
    <g className="sc-pulse" style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}>
      <circle cx={cx} cy={cy} r={r} fill={g(uid, 'tglow')} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="var(--accent)"
        strokeWidth="1.6" strokeDasharray="4 5" opacity="0.7" />
    </g>
  );
}

export function PulseRing({ cx, cy, r = 20, delay = 0 }) {
  return (
    <circle className="sc-shock" cx={cx} cy={cy} r={r} fill="none"
      stroke="var(--accent)" strokeWidth="2.5"
      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box', animationDelay: `calc(${delay}s * var(--spd))` }} />
  );
}

export function MotionArrow({ uid, d, width = 3.5 }) {
  return (
    <>
      <path className="sc-draw" d={d} fill="none" stroke="var(--accent)"
        strokeWidth={width} strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
    </>
  );
}

export function Spec({ uid, cx, cy, rx = 9, ry = 5, opacity = 0.55 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={g(uid, 'spec')} opacity={opacity} />;
}

/* ════════════════════════ INFANT ════════════════════════ */

/**
 * Infant head in profile, face up (for supine poses).
 * Drawn around local (0,0) = head centre so it can tilt from the neck.
 * Skull r ≈ 30.
 */
export function InfantHeadUp({ uid }) {
  const sk = g(uid, 'iskin');
  return (
    <g>
      {/* skull */}
      <circle cx="0" cy="0" r="30" fill={sk} />
      {/* face profile silhouette — forehead, nose, lips, chin (faces up-right) */}
      <path d="M -12,-27 Q -2,-33 6,-29 Q 10,-31 13,-27 L 17,-23 Q 21,-21 19,-17 Q 23,-15 20,-11 Q 25,-8 21,-3 L 16,8 Q 10,16 0,18"
        fill={sk} />
      {/* closed eye — gentle lash curve */}
      <path d="M -2,-14 Q 3,-10 8,-14" fill="none" stroke={SKIN.line} strokeWidth="1.8" strokeLinecap="round" />
      {/* brow */}
      <path d="M -4,-20 Q 2,-23 8,-20" fill="none" stroke={SKIN.line} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      {/* nostril hint */}
      <circle cx="17" cy="-15" r="1.2" fill={SKIN.line} opacity="0.6" />
      {/* lips */}
      <path d="M 17,-7 Q 20,-5 17,-3" fill="none" stroke="#B4583C" strokeWidth="2" strokeLinecap="round" />
      {/* cheek blush */}
      <ellipse cx="6" cy="-2" rx="5.5" ry="3.5" fill={SKIN.blush} opacity="0.3" />
      {/* ear — on the visible side */}
      <ellipse cx="-4" cy="6" rx="6.5" ry="8.5" fill={g(uid, 'iskin')} />
      <path d="M -6,2 Q -1,5 -5,10" fill="none" stroke={SKIN.line} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      {/* soft baby hair on the crown */}
      <path d="M -30,-4 Q -32,-22 -16,-28 Q -22,-18 -18,-8 Q -26,-10 -30,-4 Z" fill={HAIR} opacity="0.8" />
      <path d="M -19,-27 Q -14,-31 -8,-30" fill="none" stroke={HAIR} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      {/* head sheen */}
      <Spec uid={uid} cx="-10" cy="-16" rx="10" ry="6" opacity="0.5" />
    </g>
  );
}

/**
 * Infant lying on back, side view, head to the LEFT.
 * Occupies roughly x 95…345, floor at y 262.
 *
 * Props:
 *  - chestAnim:  className applied to the torso group (sc-breathe / sc-puff)
 *  - headAnim:   className applied to the head group (sc-tilt)
 *  - footAnim:   className applied to the near foot (sc-tap target)
 *  - x, y:       extra translation
 */
export function InfantSupine({ uid, chestAnim = '', headAnim = '', footAnim = '', x = 0, y = 0 }) {
  const sk = g(uid, 'iskinL');
  const cloth = g(uid, 'onesie');
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow uid={uid} cx={222} cy={264} rx={125} ry={11} />

      {/* far leg — behind, in shadow */}
      <g opacity="0.92">
        <path d="M 262,224 Q 282,204 296,208 Q 306,212 298,224 Q 288,234 280,242 L 268,238 Z" fill="#D9A672" />
        <path d="M 296,236 Q 310,240 314,247 Q 316,252 308,253 Q 296,254 290,248 Z" fill="#D9A672" />
      </g>

      {/* near leg — flexed, foot is the response-check target */}
      <g>
        {/* thigh */}
        <path d="M 258,232 Q 280,210 302,212 Q 314,215 308,228 Q 298,242 282,248 L 264,246 Z" fill={sk} />
        {/* shin */}
        <path d="M 300,222 Q 316,228 320,240 L 312,250 Q 300,244 294,236 Z" fill={sk} />
        {/* knee sheen */}
        <Spec uid={uid} cx="301" cy="219" rx="7" ry="4" opacity="0.45" />
        {/* foot — pivot at the ankle (318, 244) */}
        <g transform="translate(318,244)">
          <g className={footAnim} style={footAnim ? { transformOrigin: '0px 0px' } : undefined}>
            <path d="M -6,-4 Q 8,-10 16,-4 Q 22,1 16,6 Q 6,10 -4,6 Q -8,1 -6,-4 Z" fill={sk} />
            {/* toes */}
            <path d="M 13,-5 Q 17,-3 15,1 M 17,-2 Q 20,0 18,3" fill="none" stroke={SKIN.line} strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
            {/* sole crease */}
            <path d="M -3,4 Q 5,7 12,4" fill="none" stroke={SKIN.line} strokeWidth="1" opacity="0.4" />
          </g>
        </g>
      </g>

      {/* torso — onesie; chest animates for breathing scenes */}
      <g className={chestAnim} style={chestAnim ? { transformOrigin: '205px 250px', transformBox: 'view-box' } : undefined}>
        <path d="M 152,226 Q 158,210 178,204 Q 204,196 232,204 Q 256,210 264,224 Q 270,236 264,246 Q 252,256 222,257 Q 186,258 166,250 Q 152,242 152,226 Z"
          fill={cloth} />
        {/* top-light on the chest */}
        <path d="M 166,214 Q 200,202 240,210 Q 220,206 196,208 Q 178,210 166,214 Z" fill="rgba(255,255,255,0.55)" />
        <ellipse cx="206" cy="209" rx="26" ry="6" fill="rgba(255,255,255,0.35)" />
        {/* cloth folds */}
        <path d="M 176,232 Q 200,228 226,233" fill="none" stroke={ONESIE.fold} strokeWidth="1.6" opacity="0.45" />
        <path d="M 186,244 Q 208,240 232,244" fill="none" stroke={ONESIE.fold} strokeWidth="1.4" opacity="0.35" />
        {/* collar */}
        <path d="M 154,224 Q 160,218 168,216 Q 162,224 162,232 Q 156,230 154,224 Z" fill="rgba(255,255,255,0.6)" />
        {/* hip / nappy bulge */}
        <path d="M 244,212 Q 262,216 266,228 Q 268,240 258,248 Q 250,238 246,228 Z" fill="rgba(255,255,255,0.25)" />
      </g>

      {/* near arm — lying along the side, slightly bent */}
      <path d="M 168,226 Q 158,238 162,250 Q 166,260 178,258 Q 186,256 182,248 Q 176,246 176,238 Q 178,230 172,224 Z" fill={sk} />
      {/* tiny hand, palm up */}
      <path d="M 176,252 Q 186,250 190,255 Q 192,260 184,261 Q 176,262 173,257 Z" fill={sk} />
      <path d="M 184,254 L 188,256 M 182,257 L 187,259" stroke={SKIN.line} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      {/* arm AO against body */}
      <path d="M 170,228 Q 164,238 166,248" fill="none" stroke="#8E5526" strokeWidth="2" opacity="0.25" />

      {/* head — pivot at the neck (152, 226) */}
      <g transform="translate(126,224)">
        <g className={headAnim} style={headAnim ? { transformOrigin: '26px 2px' } : undefined}>
          <InfantHeadUp uid={uid} />
        </g>
      </g>
      {/* neck shadow where head meets onesie */}
      <path d="M 150,216 Q 156,226 152,238" fill="none" stroke="#6E4520" strokeWidth="3" opacity="0.18" filter={g(uid, 'blur')} />
    </g>
  );
}

/* ════════════════════════ CHILD ════════════════════════ */

/**
 * Child head in profile, face up (supine). Local (0,0) = head centre, r ≈ 24.
 */
export function ChildHeadUp({ uid }) {
  const sk = g(uid, 'iskin');
  return (
    <g>
      <circle cx="0" cy="0" r="24" fill={sk} />
      {/* face profile — slightly leaner than infant */}
      <path d="M -10,-21 Q 0,-27 7,-23 Q 12,-24 14,-19 Q 18,-16 15,-12 Q 19,-9 16,-5 Q 20,-2 16,2 L 10,10 Q 4,15 -2,15"
        fill={sk} />
      <path d="M -2,-11 Q 3,-7 8,-11" fill="none" stroke={SKIN.line} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M -4,-16 Q 2,-19 8,-16" fill="none" stroke={SKIN.line} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <circle cx="14" cy="-11" r="1.1" fill={SKIN.line} opacity="0.6" />
      <path d="M 14,-4 Q 17,-2 14,0" fill="none" stroke="#B4583C" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="5" cy="0" rx="4.5" ry="3" fill={SKIN.blush} opacity="0.28" />
      <ellipse cx="-4" cy="6" rx="5.5" ry="7" fill={sk} />
      <path d="M -6,3 Q -2,5.5 -5,9" fill="none" stroke={SKIN.line} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      {/* fuller hair */}
      <path d="M -24,-2 Q -27,-20 -10,-26 Q -2,-29 6,-25 Q -4,-24 -10,-18 Q -16,-12 -14,-2 Q -20,-6 -24,-2 Z" fill={HAIR} opacity="0.9" />
      <Spec uid={uid} cx="-9" cy="-13" rx="8" ry="5" opacity="0.45" />
    </g>
  );
}

/**
 * Child (~4-6y) lying on back, side view, head LEFT.
 * Occupies x 80…390, floor y 262.
 */
export function ChildSupine({ uid, chestAnim = '', headAnim = '', x = 0, y = 0 }) {
  const sk = g(uid, 'iskinL');
  const shirt = g(uid, 'shirt');
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow uid={uid} cx={235} cy={264} rx={155} ry={11} />

      {/* far leg */}
      <g opacity="0.92">
        <path d="M 296,226 Q 330,218 352,226 L 350,236 Q 326,234 300,238 Z" fill="#D9A672" />
        <path d="M 350,228 Q 366,232 372,242 Q 374,248 364,248 L 348,244 Z" fill="#D9A672" />
      </g>

      {/* near leg — nearly straight, slight knee bend */}
      <path d="M 292,234 Q 326,222 350,228 Q 360,232 354,242 Q 330,248 304,250 L 292,246 Z" fill={sk} />
      <path d="M 348,232 Q 368,238 376,248 Q 380,255 370,256 Q 356,256 348,250 Z" fill={sk} />
      {/* foot */}
      <path d="M 370,244 Q 384,242 390,250 Q 392,256 384,258 Q 372,259 366,254 Z" fill={sk} />
      <path d="M 384,247 Q 388,249 386,253" fill="none" stroke={SKIN.line} strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      {/* shorts */}
      <path d="M 282,222 Q 308,216 326,222 L 322,240 Q 304,246 286,244 Z" fill={SHIRT.deep} />
      <path d="M 286,226 Q 304,221 320,226" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />

      {/* torso — t-shirt; chest animates */}
      <g className={chestAnim} style={chestAnim ? { transformOrigin: '215px 248px', transformBox: 'view-box' } : undefined}>
        <path d="M 146,228 Q 152,212 174,206 Q 206,198 244,206 Q 274,212 286,224 Q 292,234 286,242 Q 272,252 234,253 Q 184,254 162,246 Q 146,240 146,228 Z"
          fill={shirt} />
        <path d="M 162,214 Q 204,202 254,212 Q 230,206 200,208 Q 176,210 162,214 Z" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="212" cy="210" rx="30" ry="6" fill="rgba(255,255,255,0.32)" />
        <path d="M 176,232 Q 206,227 240,233" fill="none" stroke={SHIRT.fold} strokeWidth="1.6" opacity="0.45" />
        <path d="M 188,244 Q 214,240 244,244" fill="none" stroke={SHIRT.fold} strokeWidth="1.4" opacity="0.35" />
        {/* collar */}
        <path d="M 148,226 Q 154,219 163,217 Q 157,226 157,234 Q 150,232 148,226 Z" fill="rgba(255,255,255,0.55)" />
        {/* shirt hem over shorts */}
        <path d="M 270,218 Q 284,224 288,234" fill="none" stroke={SHIRT.fold} strokeWidth="1.5" opacity="0.4" />
      </g>

      {/* near arm — along the side */}
      <path d="M 164,228 Q 150,242 156,254 Q 160,262 172,260 Q 180,258 176,250 Q 170,248 170,240 Q 172,232 168,226 Z" fill={sk} />
      {/* hand */}
      <path d="M 170,254 Q 181,251 186,256 Q 188,262 179,263 Q 170,264 167,259 Z" fill={sk} />
      <path d="M 179,256 L 184,258 M 177,259 L 183,261" stroke={SKIN.line} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      {/* short sleeve */}
      <path d="M 160,226 Q 152,234 156,244 Q 162,242 166,236 Q 168,230 166,226 Z" fill={SHIRT.deep} opacity="0.9" />

      {/* head — pivot at neck (146,228) */}
      <g transform="translate(120,228)">
        <g className={headAnim} style={headAnim ? { transformOrigin: '26px 0px' } : undefined}>
          <ChildHeadUp uid={uid} />
        </g>
      </g>
      <path d="M 144,218 Q 150,228 146,240" fill="none" stroke="#6E4520" strokeWidth="3" opacity="0.16" filter={g(uid, 'blur')} />
    </g>
  );
}

/* ════════════════════════ ADULT HANDS ════════════════════════ */

/**
 * Two extended fingers (index+middle) — infant CPR.
 * Local (0,0) = fingertip contact point; hand rises up-right.
 */
export function HandTwoFinger({ uid }) {
  const sk = g(uid, 'askinL');
  return (
    <g filter={g(uid, 'lift')}>
      {/* forearm + sleeve cuff exiting top-right */}
      <path d="M 26,-52 Q 40,-68 58,-76 L 70,-58 Q 52,-50 42,-38 Z" fill={g(uid, 'sleeve')} />
      <path d="M 30,-56 Q 44,-70 60,-77" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
      {/* wrist */}
      <path d="M 18,-38 Q 24,-50 36,-56 L 46,-44 Q 34,-36 28,-28 Z" fill={sk} />

      {/* back of hand */}
      <path d="M -6,-26 Q -4,-38 8,-44 Q 22,-50 32,-42 Q 38,-34 30,-24 Q 22,-16 10,-16 Q -2,-16 -6,-26 Z" fill={g(uid, 'askin')} />
      <Spec uid={uid} cx="12" cy="-36" rx="10" ry="5" opacity="0.4" />

      {/* curled ring+little fingers — two bumps on the right edge */}
      <path d="M 26,-26 Q 36,-26 36,-18 Q 35,-11 27,-12 Q 21,-13 22,-20 Z" fill={sk} />
      <path d="M 30,-16 Q 38,-15 37,-8 Q 35,-3 28,-5 Q 23,-7 25,-13 Z" fill={sk} />
      <path d="M 28,-20 Q 32,-19 33,-15" fill="none" stroke={ASKIN.line} strokeWidth="1" opacity="0.4" />

      {/* thumb tucked across */}
      <path d="M -4,-22 Q -12,-18 -10,-11 Q -8,-5 -1,-8 Q 4,-11 2,-18 Z" fill={sk} />

      {/* extended middle finger (behind) */}
      <path d="M 6,-20 Q 11,-12 10,-2 Q 9.5,3 5.5,3 Q 1.5,3 2,-3 Q 2.5,-12 1,-19 Z" fill={sk} />
      {/* extended index finger (front, lands on 0,0) */}
      <path d="M -3,-19 Q 2,-10 1,0 Q 0.5,5 -3.5,5 Q -7.5,5 -7,-1 Q -6.5,-11 -8,-18 Z" fill={g(uid, 'askin')} />
      {/* knuckle creases */}
      <path d="M -6,-10 Q -3,-9 -1,-10 M 3,-9 Q 6,-8 8,-9" stroke={ASKIN.line} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />
      {/* nails */}
      <ellipse cx="-3" cy="1.5" rx="2.6" ry="1.7" fill="rgba(255,235,215,0.8)" />
      <ellipse cx="6.5" cy="-0.5" rx="2.4" ry="1.6" fill="rgba(255,235,215,0.7)" />
    </g>
  );
}

/**
 * Heel of one hand with second hand stacked — child CPR.
 * Local (0,0) = heel contact point; straight arms rise steeply up-right.
 */
export function HandHeelStacked({ uid }) {
  const sk = g(uid, 'askinL');
  return (
    <g filter={g(uid, 'lift')}>
      {/* one straight locked arm, near-vertical — shoulders over hands */}
      <path d="M 12,-46 Q 18,-78 30,-108 Q 38,-112 50,-106 Q 42,-74 32,-42 Q 22,-38 12,-46 Z" fill={g(uid, 'sleeve')} />
      <path d="M 18,-52 Q 24,-80 34,-106" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" />
      {/* bare forearm from the rolled-up sleeve to the wrist */}
      <path d="M 8,-22 Q 12,-36 18,-48 Q 26,-50 32,-44 Q 26,-32 22,-18 Q 14,-15 8,-22 Z" fill={sk} />

      {/* bottom hand — one clean silhouette: heel planted at (0,0),
          slim fingers sloping up-left, lifted off the chest */}
      <path d="M -11,0 Q -16,-7 -12,-14 L -30,-19 Q -35,-21 -34,-25 Q -32,-28 -27,-27 L -9,-23 Q -3,-28 4,-26 Q 12,-23 13,-14 Q 13,-5 7,-1 Q -2,3 -11,0 Z"
        fill={g(uid, 'askin')} />
      {/* finger separations on the lifted fingers */}
      <path d="M -26,-25 L -12,-21 M -27,-22 L -13,-18" stroke={ASKIN.line} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.45" />

      {/* top hand clasped over the back of the bottom hand */}
      <path d="M -4,-24 Q -3,-36 8,-40 Q 19,-43 25,-35 Q 29,-27 23,-20 Q 16,-13 6,-15 Q -2,-17 -4,-24 Z" fill={sk} />
      {/* its fingers curling over the far side of the bottom hand */}
      <path d="M -2,-26 Q -9,-29 -8,-34 Q -6,-38 -1,-35 Z M 4,-30 Q -2,-34 0,-39 Q 4,-42 7,-37 Z" fill={g(uid, 'askin')} />
      <Spec uid={uid} cx="11" cy="-32" rx="8" ry="4.5" opacity="0.45" />
      {/* crease between stacked hands */}
      <path d="M -2,-21 Q 10,-16 22,-22" fill="none" stroke={ASKIN.line} strokeWidth="1.1" opacity="0.4" />
      {/* heel pressure shading right at the contact point */}
      <ellipse cx="0" cy="-2" rx="10" ry="3.5" fill="#8E5526" opacity="0.28" />
    </g>
  );
}

/**
 * Infant/child lying on their SIDE — the recovery position end state.
 * Side view, facing left (toward the viewer's left). Head on the floor,
 * top leg bent forward over the bottom leg, top arm forward for support.
 * Occupies x 95…340 (infant) / 90…390 (child), floor y 262.
 */
export function FigureSideLying({ uid, variant = 'child', headAnim = '', x = 0, y = 0 }) {
  const inf = variant !== 'child';
  const sk = g(uid, 'iskinL');
  const cloth = g(uid, inf ? 'onesie' : 'shirt');
  const FOLD = inf ? ONESIE.fold : SHIRT.fold;
  const s = inf ? 0.92 : 1; // infant slightly smaller overall
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow uid={uid} cx={225} cy={266} rx={inf ? 125 : 150} ry={11} />

      {/* bottom leg — extended back along the floor */}
      <path d="M 268,234 Q 310,236 342,246 Q 350,250 344,256 Q 312,258 282,252 L 268,246 Z" fill="#D9A672" />
      {/* bottom foot */}
      <path d="M 340,246 Q 354,246 358,253 Q 359,258 351,258 L 338,255 Z" fill="#D9A672" />

      {/* top leg — bent forward at the knee, resting on the floor in front */}
      <path d="M 262,228 Q 290,222 308,232 Q 316,240 306,248 Q 288,254 270,250 L 258,242 Z" fill={sk} />
      <path d="M 302,238 Q 308,252 302,260 Q 296,264 290,258 Q 288,248 292,240 Z" fill={sk} />
      {/* top foot in front */}
      <path d="M 294,256 Q 306,258 308,264 Q 307,268 299,267 Q 290,265 288,260 Z" fill={sk} />
      <Spec uid={uid} cx="288" cy="230" rx="8" ry="4" opacity="0.4" />

      {/* torso on its side — back curved, gentle forward lean */}
      <path d="M 158,222 Q 168,204 196,200 Q 232,196 256,208 Q 272,218 270,234 Q 266,250 244,254 Q 206,258 178,250 Q 158,242 158,222 Z"
        fill={cloth} />
      <path d="M 172,212 Q 206,200 244,210 Q 222,204 196,206 Q 180,208 172,212 Z" fill="rgba(255,255,255,0.5)" />
      <path d="M 182,232 Q 212,228 244,234" fill="none" stroke={FOLD} strokeWidth="1.5" opacity="0.45" />
      <path d="M 190,244 Q 216,241 240,244" fill="none" stroke={FOLD} strokeWidth="1.3" opacity="0.35" />

      {/* bottom arm — forward on the floor in front of the chest */}
      <path d="M 170,232 Q 150,242 136,254 Q 130,260 138,263 Q 152,262 166,254 Q 174,247 176,238 Z" fill={sk} />
      {/* its open hand, palm up */}
      <path d="M 136,254 Q 126,254 122,259 Q 121,264 129,264 Q 138,263 141,259 Z" fill={sk} />

      {/* head — tilted back so the airway stays open */}
      <g transform={`translate(${inf ? 124 : 122},${inf ? 226 : 228}) rotate(-24)`}>
        <g className={headAnim}>
          {inf ? <InfantHeadUp uid={uid} /> : <ChildHeadUp uid={uid} />}
        </g>
      </g>

      {/* top arm — bent forward, hand resting on the floor before the chest */}
      <path d="M 170,226 Q 158,232 150,242 Q 146,250 154,252 Q 163,252 170,245 Q 175,238 176,231 Z" fill={sk} />
      <path d="M 152,246 Q 143,248 140,253 Q 140,258 147,257 Q 155,256 158,251 Z" fill={sk} />

      {/* neck AO */}
      <path d="M 156,216 Q 162,226 158,238" fill="none" stroke="#6E4520" strokeWidth="3" opacity="0.16" filter={g(uid, 'blur')} />
    </g>
  );
}

/**
 * Single finger reaching in to lift the chin (head-tilt scenes, taps).
 * Local (0,0) = fingertip; hand comes from the right, sleeve far back.
 */
export function HandChinLift({ uid, sleeve = true, fingerOnly = false }) {
  const sk = g(uid, 'askinL');
  if (fingerOnly) {
    // Just the extended index finger + a hint of hand — for tight spots
    // (under an infant's chin) where a full hand would smother the figure.
    return (
      <g filter={g(uid, 'lift')}>
        <path d="M 13,-11 Q 4,-9 -2,-3 Q -6,1 -1,4 Q 5,6 12,2 Q 17,-2 16,-8 Z" fill={sk} />
        <path d="M 12,-12 Q 22,-18 32,-16 Q 38,-13 36,-4 Q 33,4 22,5 Q 14,5 11,1 Q 16,-2 16,-8 Z" fill={g(uid, 'askin')} opacity="0.9" />
        <ellipse cx="-1" cy="1" rx="2.8" ry="1.9" fill="rgba(255,235,215,0.8)" />
      </g>
    );
  }
  return (
    <g filter={g(uid, 'lift')}>
      {/* small sleeve cuff far up the wrist, out of the action */}
      {sleeve && <path d="M 52,-30 Q 66,-36 80,-36 L 82,-16 Q 68,-16 58,-10 Z" fill={g(uid, 'sleeve')} />}
      {/* forearm */}
      <path d="M 34,-16 Q 46,-26 60,-28 L 64,-12 Q 50,-8 40,-2 Z" fill={sk} />
      {/* back of hand — generous, clearly a hand */}
      <path d="M 10,-16 Q 20,-26 36,-24 Q 48,-20 44,-7 Q 39,4 24,4 Q 12,4 9,-6 Z" fill={g(uid, 'askin')} />
      {/* extended index finger reaching to (0,0) */}
      <path d="M 13,-11 Q 4,-9 -2,-3 Q -6,1 -1,4 Q 5,6 12,2 Q 17,-2 16,-8 Z" fill={sk} />
      <ellipse cx="-1" cy="1" rx="2.8" ry="1.9" fill="rgba(255,235,215,0.8)" />
      <path d="M 8,-6 Q 11,-5 13,-6" fill="none" stroke={ASKIN.line} strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      {/* curled middle/ring/little fingers under the palm */}
      <path d="M 20,2 Q 16,9 24,11 Q 31,12 32,5 Z" fill={sk} />
      <path d="M 30,3 Q 27,10 35,11 Q 41,11 41,5 Z" fill={sk} />
      <path d="M 38,2 Q 36,8 43,8 Q 47,7 46,2 Z" fill={sk} />
      {/* thumb resting over */}
      <path d="M 14,-14 Q 8,-20 12,-25 Q 17,-28 21,-22 Q 23,-17 20,-13 Z" fill={sk} />
      <Spec uid={uid} cx="28" cy="-15" rx="9" ry="5" opacity="0.45" />
    </g>
  );
}

/**
 * Hand resting on the forehead (airway scenes, paired with chin lift).
 * Local (0,0) = palm contact on the forehead.
 */
export function HandOnForehead({ uid }) {
  const sk = g(uid, 'askinL');
  return (
    <g filter={g(uid, 'lift')}>
      {/* forearm rising vertically, sleeve attached directly */}
      <path d="M -4,-30 Q -2,-50 4,-66 Q 14,-70 24,-64 Q 18,-46 14,-26 Q 4,-22 -4,-30 Z" fill={g(uid, 'sleeve')} />
      <path d="M -2,-12 Q -2,-24 2,-34 Q 10,-36 16,-31 Q 12,-20 12,-10 Q 4,-6 -2,-12 Z" fill={sk} />
      {/* cupped palm conforming to the crown — a smooth crescent band
          hugging the skull curve, fingertips trailing down the far side */}
      <path d="M -34,10 Q -34,-8 -20,-16 Q -4,-24 10,-16 Q 16,-12 16,-4 Q 12,-8 4,-10 Q -10,-13 -20,-6 Q -28,0 -28,12 Q -32,12 -34,10 Z"
        fill={g(uid, 'askin')} />
      {/* visible fingers following the curve */}
      <path d="M -28,12 Q -28,1 -21,-5 Q -14,-10 -4,-9 Q -12,-6 -17,0 Q -22,6 -22,13 Z" fill={sk} />
      <path d="M -22,13 Q -21,4 -15,-1 Q -10,-4 -3,-4 Q -10,1 -13,6 Q -16,10 -16,14 Z" fill={sk} opacity="0.95" />
      {/* thumb on the near side */}
      <path d="M 8,-8 Q 14,-2 13,6 Q 11,11 6,8 Q 2,4 3,-3 Z" fill={sk} />
      <Spec uid={uid} cx="-8" cy="-10" rx="9" ry="4.5" opacity="0.45" />
    </g>
  );
}

/**
 * Adult head in profile leaning down for rescue breaths.
 * Local (0,0) = lips contact point; head rises up-left.
 */
export function AdultHeadBreath({ uid }) {
  const sk = g(uid, 'askin');
  return (
    <g filter={g(uid, 'lift')}>
      {/* neck + shoulder hint exiting top-left */}
      <path d="M -52,-44 Q -38,-58 -20,-62 L -34,-30 Z" fill={g(uid, 'sleeve')} />
      {/* head profile facing down-right, lips at (0,0) */}
      <path d="M -44,-46 Q -28,-58 -12,-52 Q 0,-46 2,-32 Q 3,-24 0,-16 Q 4,-12 2,-8 Q 0,-4 -4,-4 Q -2,-1 -6,1 Q -12,4 -18,0 Q -30,-2 -36,-12 Q -46,-28 -44,-46 Z"
        fill={sk} />
      {/* hair */}
      <path d="M -46,-44 Q -36,-62 -14,-58 Q -4,-55 0,-44 Q -10,-52 -24,-50 Q -38,-48 -40,-34 Q -46,-38 -46,-44 Z" fill={HAIR} />
      {/* closed eye focused down */}
      <path d="M -16,-30 Q -11,-27 -6,-30" fill="none" stroke={ASKIN.line} strokeWidth="1.6" strokeLinecap="round" />
      {/* nose toward the baby's face */}
      <path d="M -4,-22 Q 1,-18 -2,-14" fill="none" stroke={ASKIN.line} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      {/* ear */}
      <ellipse cx="-30" cy="-30" rx="5" ry="7" fill={sk} />
      <Spec uid={uid} cx="-26" cy="-46" rx="9" ry="5" opacity="0.4" />
    </g>
  );
}

/**
 * Open palm, heel leading — back blows. Drawn mid-air, palm facing down-left.
 * Local (0,0) = heel of hand (the striking surface).
 */
export function HandOpenPalm({ uid }) {
  const sk = g(uid, 'askinL');
  return (
    <g filter={g(uid, 'lift')}>
      {/* forearm + sleeve up-right */}
      <path d="M 22,-34 Q 36,-52 54,-62 L 68,-44 Q 50,-36 38,-22 Z" fill={g(uid, 'sleeve')} />
      <path d="M 28,-40 Q 42,-54 58,-62" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 12,-22 Q 18,-32 30,-38 L 42,-26 Q 30,-18 24,-10 Z" fill={sk} />
      {/* palm */}
      <path d="M -10,-2 Q -14,-16 -4,-24 Q 8,-32 20,-26 Q 28,-18 22,-8 Q 14,2 0,4 Q -6,4 -10,-2 Z" fill={g(uid, 'askin')} />
      {/* fingers extended down-left, slightly spread */}
      <path d="M -8,-20 Q -20,-28 -30,-30 Q -35,-30 -33,-25 Q -24,-18 -12,-14 Z" fill={sk} />
      <path d="M -10,-13 Q -24,-18 -34,-17 Q -38,-16 -35,-12 Q -25,-7 -12,-7 Z" fill={sk} />
      <path d="M -10,-6 Q -24,-8 -33,-4 Q -36,-2 -32,1 Q -23,3 -11,0 Z" fill={sk} />
      {/* thumb up */}
      <path d="M 14,-26 Q 16,-36 23,-39 Q 28,-40 27,-34 Q 25,-27 19,-23 Z" fill={sk} />
      <Spec uid={uid} cx="6" cy="-16" rx="9" ry="5" opacity="0.4" />
      {/* heel emphasis — this is what strikes */}
      <ellipse cx="0" cy="-1" rx="9" ry="4" fill="#8E5526" opacity="0.3" />
    </g>
  );
}
