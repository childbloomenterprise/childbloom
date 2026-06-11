/**
 * Choking — Infant scenes. The forearm hold is the visual anchor:
 * baby face-down along the rescuer's forearm, head lower than chest,
 * forearm braced on the thigh.
 */
import {
  useSvgId, g, FigureDefs, InfantHeadUp,
  HandOpenPalm, HandTwoFinger,
  TargetGlow, PulseRing, MotionArrow, ContactShadow, Spec, SKIN, HAIR, ONESIE,
} from './figures';

/* ── the forearm cradle both choking poses build on ──────────
   Geometry: hand cups the jaw at (~145,232), elbow rests on the
   thigh at (~330,206). The baby lies ALONG the arm, body weight
   visibly on it, head lower than the chest. */
function ForearmBase({ uid }) {
  return (
    <g>
      <ContactShadow uid={uid} cx={260} cy={268} rx={130} ry={11} opacity={0.22} />
      {/* kneeling adult's thigh — solid bracing mass at the right */}
      <path d="M 300,216 Q 332,200 372,202 Q 402,206 404,228 Q 404,250 380,258 Q 340,264 310,254 Q 292,246 292,232 Q 293,222 300,216 Z"
        fill={g(uid, 'sleeve')} />
      <path d="M 310,216 Q 348,204 388,210" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 300,240 Q 340,250 380,246" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" strokeLinecap="round" />

      {/* full forearm — a broad band the baby clearly rests on */}
      <path d="M 332,196 Q 250,206 172,226 Q 152,231 148,240 Q 148,252 162,254 Q 252,240 336,224 Q 344,210 332,196 Z"
        fill={g(uid, 'askinL')} />
      {/* top-light along the arm + AO where the baby presses down */}
      <path d="M 326,202 Q 250,210 176,229" fill="none" stroke="rgba(255,240,220,0.65)" strokeWidth="3" strokeLinecap="round" />
      <path d="M 310,212 Q 250,220 190,234" fill="none" stroke="#8E5526" strokeWidth="4" strokeLinecap="round" opacity="0.2" />

      {/* supporting hand — open cup holding the jaw, fingers visible */}
      <path d="M 152,224 Q 136,222 124,230 Q 116,238 122,248 Q 130,256 146,254 Q 160,251 164,240 Q 165,230 152,224 Z"
        fill={g(uid, 'askin')} />
      {/* finger separations wrapping the jaw */}
      <path d="M 128,234 Q 138,238 150,237 M 126,242 Q 137,246 149,244" fill="none"
        stroke="#8E5526" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      {/* thumb up the near side */}
      <path d="M 158,228 Q 166,222 172,224 Q 176,228 171,233 Q 165,237 158,236 Z" fill={g(uid, 'askin')} />
      <Spec uid={uid} cx="140" cy="230" rx="8" ry="4" opacity="0.4" />
    </g>
  );
}

/* infant lying PRONE (face down) along the forearm, head at the left.
   The body follows the arm's slope (head low, hips high) and visibly
   rests its weight on it. */
function InfantProne({ uid }) {
  const sk = g(uid, 'iskinL');
  return (
    <g>
      {/* far leg — straddling the arm, behind it */}
      <path d="M 296,176 Q 316,176 326,188 Q 330,198 320,200 Q 308,198 298,188 Z" fill="#D9A672" />

      {/* torso — back facing up, rising from shoulders to hips */}
      <path d="M 186,188 Q 192,172 216,166 Q 252,158 284,162 Q 304,166 306,180 Q 306,194 290,200 Q 252,210 214,216 Q 192,218 186,206 Q 183,196 186,188 Z"
        fill={g(uid, 'onesie')} />
      {/* light along the spine */}
      <path d="M 200,176 Q 244,164 290,168" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3.5" strokeLinecap="round" />
      {/* cloth folds following the back */}
      <path d="M 206,194 Q 246,184 286,184" fill="none" stroke={ONESIE.fold} strokeWidth="1.5" opacity="0.45" />
      <path d="M 214,206 Q 250,198 284,194" fill="none" stroke={ONESIE.fold} strokeWidth="1.3" opacity="0.35" />
      {/* nappy bulge at the hips */}
      <path d="M 282,164 Q 302,166 306,180 Q 306,192 292,198 Q 286,184 282,170 Z" fill="rgba(255,255,255,0.3)" />

      {/* head — face down-left, jaw resting in the supporting cup hand */}
      <g transform="translate(166,206) rotate(24)">
        <circle cx="0" cy="0" r="26" fill={g(uid, 'iskin')} />
        {/* brow + closed eye on the down-turned face */}
        <path d="M -14,6 Q -8,10 -2,7" fill="none" stroke="#A8632E" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M -16,0 Q -9,3 -3,1" fill="none" stroke="#A8632E" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        {/* small nose + cheek against the hand */}
        <path d="M -18,12 Q -14,16 -9,15" fill="none" stroke="#A8632E" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        <ellipse cx="-6" cy="14" rx="5" ry="3.2" fill="#E8927A" opacity="0.3" />
        {/* ear */}
        <ellipse cx="6" cy="-2" rx="5.5" ry="7.5" fill={g(uid, 'iskin')} />
        <path d="M 4,-6 Q 8,-3 5,2" fill="none" stroke="#A8632E" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        {/* hair over the crown */}
        <path d="M -14,-22 Q 4,-28 18,-16 Q 24,-8 22,2 Q 16,-10 2,-16 Q -8,-20 -14,-22 Z" fill={HAIR} opacity="0.85" />
        <Spec uid={uid} cx="-4" cy="-14" rx="9" ry="5" opacity="0.5" />
      </g>
      {/* neck shadow joining head and onesie */}
      <path d="M 186,194 Q 192,200 190,210" fill="none" stroke="#6E4520" strokeWidth="3" opacity="0.18" />

      {/* near arm — dangling in front of the rescuer's forearm */}
      <path d="M 202,206 Q 196,224 202,238 Q 207,246 213,240 Q 216,232 212,218 Q 209,210 202,206 Z" fill={sk} />
      {/* tiny hand */}
      <path d="M 204,238 Q 200,246 206,250 Q 212,251 213,244 Z" fill={sk} />

      {/* near leg — straddling the arm in front, foot hanging */}
      <path d="M 290,184 Q 310,190 318,204 Q 322,216 312,218 Q 302,214 294,200 Z" fill={sk} />
      <path d="M 308,214 Q 318,220 316,228 Q 311,233 304,228 Q 300,222 304,216 Z" fill={sk} />
      {/* knee crease */}
      <path d="M 300,196 Q 306,200 308,206" fill="none" stroke="#A8632E" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
    </g>
  );
}

/* infant FACE-UP along the forearm (for chest thrusts) — head still
   low at the left, cradled by the same supporting hand */
function InfantSupineForearm({ uid }) {
  const sk = g(uid, 'iskinL');
  return (
    <g>
      {/* far leg behind the arm */}
      <path d="M 294,178 Q 314,178 324,190 Q 328,200 318,202 Q 306,200 296,190 Z" fill="#D9A672" />

      {/* head — face up, resting back into the cup hand */}
      <g transform="translate(164,208) rotate(16) scale(0.92)">
        <InfantHeadUp uid={uid} />
      </g>

      {/* torso face-up along the arm — chest is the high point */}
      <path d="M 188,192 Q 192,176 218,170 Q 254,162 286,166 Q 306,170 307,184 Q 306,198 290,204 Q 252,212 214,218 Q 194,220 188,208 Q 185,198 188,192 Z"
        fill={g(uid, 'onesie')} />
      {/* chest top-light */}
      <ellipse cx="234" cy="176" rx="28" ry="7" fill="rgba(255,255,255,0.5)" />
      <path d="M 208,198 Q 248,188 288,186" fill="none" stroke={ONESIE.fold} strokeWidth="1.4" opacity="0.4" />
      {/* collar near the neck */}
      <path d="M 190,192 Q 196,186 204,184 Q 198,192 198,200 Q 192,198 190,192 Z" fill="rgba(255,255,255,0.55)" />

      {/* near arm resting along the belly */}
      <path d="M 206,204 Q 200,218 208,228 Q 214,232 218,224 Q 220,214 214,206 Z" fill={sk} />
      {/* near leg straddling in front */}
      <path d="M 288,186 Q 308,192 316,206 Q 320,218 310,220 Q 300,216 292,202 Z" fill={sk} />
      <path d="M 306,216 Q 316,222 314,230 Q 309,235 302,230 Q 298,224 302,218 Z" fill={sk} />
    </g>
  );
}

/* ── 1 · lay face-down along the forearm ───────────────────── */
export function SceneForearmHold() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmBase uid={uid} />
      <InfantProne uid={uid} />
      {/* head-lower-than-chest cue: small down arrow beside the head */}
      <MotionArrow uid={uid} d="M 120,168 q -6,12 -2,24" width={3} />
    </>
  );
}

/* ── 2 · five firm back blows ──────────────────────────────── */
export function SceneBackBlows() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmBase uid={uid} />
      <InfantProne uid={uid} />
      <TargetGlow uid={uid} cx={232} cy={178} r={20} />
      <PulseRing cx={232} cy={176} r={16} />
      {/* striking hand arcs down between the shoulder blades */}
      <g transform="translate(232,170) rotate(-6)">
        <g className="sc-ghost sc-swing" aria-hidden="true"><HandOpenPalm uid={uid} /></g>
      </g>
      <g transform="translate(232,170) rotate(-6)">
        <g className="sc-swing"><HandOpenPalm uid={uid} /></g>
      </g>
    </>
  );
}

/* ── 3 · turn face-up, keep the head low ───────────────────── */
export function SceneFlipFaceUp() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmBase uid={uid} />
      {/* phase A: prone — fades to phase B: face-up */}
      <g className="sc-phase-a"><InfantProne uid={uid} /></g>
      <g className="sc-phase-b"><InfantSupineForearm uid={uid} /></g>
      {/* flip direction */}
      <MotionArrow uid={uid} d="M 200,150 a 40,30 0 0 1 60,-2" width={3.5} />
    </>
  );
}

/* ── 4 · five chest thrusts ────────────────────────────────── */
export function SceneChestThrusts() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmBase uid={uid} />
      <InfantSupineForearm uid={uid} />
      <TargetGlow uid={uid} cx={234} cy={182} r={20} />
      <ellipse className="sc-dent-deep" cx={234} cy={184} rx="12" ry="4" fill="#8E5526" opacity="0.5" />
      {/* slower, deeper two-finger press */}
      <g transform="translate(234,178) rotate(6)">
        <g className="sc-press-deep"><HandTwoFinger uid={uid} /></g>
      </g>
    </>
  );
}

/* ── 5 · look in the mouth (never sweep blindly) ───────────── */
export function SceneMouthCheck() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={266} rx={95} ry={10} />
      {/* big face-up head — the focus of this step */}
      <g transform="translate(206,216) scale(1.55)">
        <InfantHeadUp uid={uid} />
      </g>
      {/* clearly opened mouth with the object just visible inside */}
      <g transform="translate(233,204) rotate(-24)">
        <ellipse cx="0" cy="0" rx="8" ry="11" fill="#7A3A28" stroke="#5A2A1C" strokeWidth="1.5" />
        <ellipse cx="0" cy="4" rx="5" ry="4" fill="#A85844" />
        {/* the visible object — only remove what you can see */}
        <circle cx="0" cy="-4" r="3.6" fill="#C23B2E" />
        <circle cx="-1" cy="-5" r="1.2" fill="rgba(255,255,255,0.55)" />
      </g>
      {/* looking — dashed focus ring around the open mouth */}
      <circle cx="230" cy="201" r="24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 6" className="sc-pulse"
        style={{ transformOrigin: '230px 201px', transformBox: 'view-box' }} />
      {/* drawn eye glyph: look first */}
      <g transform="translate(308,124)">
        <path d="M -18,0 Q 0,-14 18,0 Q 0,14 -18,0 Z" fill="#fff" stroke="#6B5640" strokeWidth="2" />
        <circle cx="0" cy="0" r="6" fill="#41597A" />
        <circle cx="2" cy="-2" r="2" fill="#fff" />
      </g>
      <MotionArrow uid={uid} d="M 296,140 Q 272,160 250,180" width={2.6} />
    </>
  );
}

/* ── 6 · repeat 5 back blows + 5 thrusts ───────────────────── */
export function SceneCycle55() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      {/* phase A: back blows (left, smaller) */}
      <g className="sc-phase-a">
        <g transform="translate(-66,30) scale(0.72)">
          <ForearmBase uid={uid} />
          <InfantProne uid={uid} />
          <g transform="translate(226,182) rotate(-6)">
            <g className="sc-swing"><HandOpenPalm uid={uid} /></g>
          </g>
        </g>
      </g>
      {/* phase B: chest thrusts (right) */}
      <g className="sc-phase-b">
        <g transform="translate(160,30) scale(0.72)">
          <ForearmBase uid={uid} />
          <InfantSupineForearm uid={uid} />
          <g transform="translate(228,188) rotate(6)">
            <g className="sc-press-deep"><HandTwoFinger uid={uid} /></g>
          </g>
        </g>
      </g>
      {/* continuous cycle arrows */}
      <g opacity="0.9">
        <path d="M 194,78 a 26,20 0 0 1 50,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
        <path d="M 244,98 a 26,20 0 0 1 -50,0" fill="none" stroke="var(--accent)"
          strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${uid}-ah)`} />
      </g>
    </>
  );
}
