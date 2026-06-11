/**
 * Choking — Child scenes. Two anchor poses:
 * 1. Child standing, leaning well forward, supported across the chest
 *    (for back blows).
 * 2. Child upright with the rescuer's arms wrapped from behind, fist
 *    just above the navel (Heimlich).
 */
import {
  useSvgId, g, FigureDefs,
  HandOpenPalm, HandTwoFinger,
  TargetGlow, PulseRing, MotionArrow, ContactShadow, Spec,
  SKIN, HAIR, SHIRT,
} from './figures';

/* child head in profile facing LEFT and DOWN a little (leaning) */
function ChildHeadLean({ uid, tilt = 0 }) {
  return (
    <g transform={`rotate(${tilt})`}>
      <circle cx="0" cy="0" r="21" fill={g(uid, 'iskin')} />
      {/* profile: forehead → nose → lips → chin, facing left */}
      <path d="M -14,-14 Q -21,-8 -20,-1 Q -24,1 -21,5 Q -25,8 -20,11 Q -18,16 -12,16 L -4,18 Q 4,18 8,14"
        fill={g(uid, 'iskin')} />
      {/* closed eye, distressed brow */}
      <path d="M -13,-4 Q -9,-1 -5,-4" fill="none" stroke={SKIN.line} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M -14,-9 Q -9,-11 -5,-9" fill="none" stroke={SKIN.line} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      {/* open distressed mouth — they cannot cough */}
      <ellipse cx="-17" cy="8" rx="3" ry="4" fill="#7A3A28" />
      {/* ear */}
      <ellipse cx="6" cy="2" rx="5" ry="6.5" fill={g(uid, 'iskin')} />
      <path d="M 4,-1 Q 8,2 5,6" fill="none" stroke={SKIN.line} strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      {/* hair over the crown and back */}
      <path d="M -16,-15 Q -2,-24 12,-16 Q 20,-10 19,2 Q 20,10 14,15 Q 17,5 12,-4 Q 6,-14 -6,-16 Q -12,-16 -16,-15 Z"
        fill={HAIR} />
      <Spec uid={uid} cx="-4" cy="-10" rx="7" ry="4" opacity="0.45" />
    </g>
  );
}

/* standing child, leaning forward ~40°, side view facing left */
function ChildLeaning({ uid }) {
  const sk = g(uid, 'iskinL');
  return (
    <g>
      <ContactShadow uid={uid} cx={250} cy={264} rx={90} ry={9} />
      {/* far leg */}
      <path d="M 262,210 Q 270,232 276,252 L 268,258 Q 258,256 256,250 Q 254,230 252,212 Z" fill="#D9A672" />
      <path d="M 266,252 Q 278,254 280,260 Q 279,264 270,263 L 260,260 Z" fill="#D9A672" />
      {/* near leg */}
      <path d="M 246,208 Q 248,232 246,252 L 236,256 Q 230,252 232,246 Q 238,226 238,210 Z" fill={sk} />
      {/* shoe/foot */}
      <path d="M 234,250 Q 222,252 220,258 Q 220,263 230,262 L 244,258 Q 246,252 242,250 Z" fill={sk} />
      {/* shorts */}
      <path d="M 234,196 Q 252,190 268,198 Q 272,212 266,222 Q 250,226 238,220 Q 232,208 234,196 Z" fill={SHIRT.deep} />

      {/* torso leaning forward — shoulders well ahead of the hips */}
      <path d="M 238,204 Q 226,196 218,182 Q 206,166 196,160 Q 188,154 182,162 Q 178,170 186,178 Q 204,196 222,210 Q 234,218 244,214 Q 246,208 238,204 Z"
        fill={g(uid, 'shirt')} />
      {/* broader chest mass */}
      <path d="M 188,160 Q 206,156 224,172 Q 240,186 248,202 Q 250,212 240,214 Q 222,212 206,196 Q 192,182 184,170 Q 183,162 188,160 Z"
        fill={g(uid, 'shirt')} />
      <path d="M 192,164 Q 212,164 232,184" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 200,184 Q 216,192 230,202" fill="none" stroke={SHIRT.fold} strokeWidth="1.4" opacity="0.45" />

      {/* near arm hanging straight down (gravity helps) */}
      <path d="M 200,178 Q 196,196 196,212 Q 197,220 204,219 Q 209,216 208,206 Q 208,192 208,182 Z" fill={sk} />
      <path d="M 198,214 Q 194,222 199,226 Q 205,228 207,221 Z" fill={sk} />

      {/* head — down-left, mouth open */}
      <g transform="translate(172,152)">
        <ChildHeadLean uid={uid} tilt={14} />
      </g>
      {/* neck */}
      <path d="M 184,164 Q 190,168 194,166" fill="none" stroke="#6E4520" strokeWidth="3" opacity="0.16" />

      {/* rescuer's supporting hand braced across the chest from the front */}
      <g transform="translate(186,196) rotate(-150) scale(0.95)">
        <HandOpenPalm uid={uid} />
      </g>
    </g>
  );
}

/* child upright + adult arms wrapped from behind, fist above the navel */
function HeimlichWrap({ uid, thrust = false }) {
  const sk = g(uid, 'iskinL');
  const anim = thrust ? 'sc-thrust' : 'sc-bob';
  return (
    <g>
      <ContactShadow uid={uid} cx={236} cy={264} rx={80} ry={9} />
      {/* legs */}
      <path d="M 246,212 Q 250,234 252,254 L 242,258 Q 236,254 238,248 Q 240,228 238,214 Z" fill="#D9A672" />
      <path d="M 228,212 Q 226,234 224,254 L 212,256 Q 207,251 211,246 Q 218,228 218,212 Z" fill={sk} />
      <path d="M 210,250 Q 200,252 198,258 Q 199,263 208,262 L 222,258 Q 223,252 219,250 Z" fill={sk} />
      <path d="M 240,254 Q 252,256 254,261 Q 253,265 244,264 L 234,261 Z" fill="#D9A672" />
      {/* shorts */}
      <path d="M 214,192 Q 234,186 250,194 Q 254,208 248,218 Q 230,224 218,216 Q 212,204 214,192 Z" fill={SHIRT.deep} />

      {/* torso upright */}
      <path d="M 214,196 Q 208,168 212,148 Q 216,134 234,132 Q 250,132 254,146 Q 258,168 252,196 Q 234,204 214,196 Z"
        fill={g(uid, 'shirt')} />
      <path d="M 218,142 Q 234,136 250,144" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />

      {/* head — distressed, facing left */}
      <g transform="translate(224,116)">
        <ChildHeadLean uid={uid} tilt={4} />
      </g>

      {/* child's near arm hanging */}
      <path d="M 214,150 Q 206,168 204,186 Q 205,194 212,193 Q 217,190 217,180 Q 218,164 220,154 Z" fill={sk} />

      {/* ── adult arms wrapping from behind (right side) ── */}
      <g className={anim}>
        {/* upper wrap arm — sleeve sweeping around the waist */}
        <path d="M 404,148 Q 330,150 268,172 Q 240,182 226,188 L 232,204 Q 252,198 280,190 Q 344,172 406,170 Z"
          fill={g(uid, 'sleeve')} />
        <path d="M 396,154 Q 330,156 272,176" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" />
        {/* fist — thumb side against the belly, just above the navel */}
        <g transform="translate(216,190)">
          <path d="M -8,-10 Q 2,-16 12,-12 Q 20,-8 18,2 Q 15,10 4,11 Q -6,11 -9,2 Q -11,-5 -8,-10 Z" fill={g(uid, 'askin')} />
          {/* knuckle bumps */}
          <path d="M -4,-9 Q -1,-12 2,-9 M 4,-10 Q 7,-13 10,-9" fill="none" stroke="#8E5526" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <Spec uid={uid} cx="4" cy="-4" rx="6" ry="3.5" opacity="0.4" />
        </g>
        {/* second hand clasped over the fist */}
        <path d="M 222,196 Q 232,190 242,194 Q 250,198 247,208 Q 243,216 232,215 Q 222,213 220,205 Q 219,200 222,196 Z"
          fill={g(uid, 'askinL')} />
        <path d="M 226,198 Q 232,195 238,198" fill="none" stroke="#8E5526" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
      </g>

      {/* navel reference dot below the fist */}
      <circle cx="214" cy="206" r="2.6" fill="var(--accent)" opacity="0.8" />
    </g>
  );
}

/* ── 1 · get behind them, lean them forward ────────────────── */
export function SceneChildLean() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildLeaning uid={uid} />
      {/* lean-forward direction */}
      <MotionArrow uid={uid} d="M 268,150 Q 244,138 218,140" width={3.5} />
    </>
  );
}

/* ── 2 · five firm back blows ──────────────────────────────── */
export function SceneBackBlowsChild() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildLeaning uid={uid} />
      <TargetGlow uid={uid} cx={222} cy={176} r={18} />
      <PulseRing cx={222} cy={174} r={15} />
      {/* striking hand between the shoulder blades */}
      <g transform="translate(224,168) rotate(10)">
        <g className="sc-ghost sc-swing" aria-hidden="true"><HandOpenPalm uid={uid} /></g>
      </g>
      <g transform="translate(224,168) rotate(10)">
        <g className="sc-swing"><HandOpenPalm uid={uid} /></g>
      </g>
    </>
  );
}

/* ── 3 · fist just above the navel ─────────────────────────── */
export function SceneFistPlace() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <HeimlichWrap uid={uid} />
      <TargetGlow uid={uid} cx={216} cy={192} r={18} />
    </>
  );
}

/* ── 4 · five quick inward-and-upward thrusts ──────────────── */
export function SceneHeimlichThrust() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <HeimlichWrap uid={uid} thrust />
      {/* in-and-up direction */}
      <MotionArrow uid={uid} d="M 184,214 Q 178,196 188,180" width={4} />
      <PulseRing cx={216} cy={190} r={16} />
    </>
  );
}

/* ── 5 · alternate 5 + 5 ───────────────────────────────────── */
export function SceneCycle55Child() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      {/* phase A: back blows */}
      <g className="sc-phase-a">
        <g transform="translate(-46,40) scale(0.72)">
          <ChildLeaning uid={uid} />
          <g transform="translate(224,168) rotate(10)">
            <g className="sc-swing"><HandOpenPalm uid={uid} /></g>
          </g>
        </g>
      </g>
      {/* phase B: abdominal thrusts */}
      <g className="sc-phase-b">
        <g transform="translate(126,40) scale(0.72)">
          <HeimlichWrap uid={uid} thrust />
        </g>
      </g>
      {/* cycle arrows */}
      <g opacity="0.9">
        <path d="M 196,84 a 26,20 0 0 1 50,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
        <path d="M 246,104 a 26,20 0 0 1 -50,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
      </g>
    </>
  );
}
