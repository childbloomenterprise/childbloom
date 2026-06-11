/**
 * Care scenes — the shared visual vocabulary for allergic reaction,
 * drowning, bleeding, electric shock, seizure, burns, head injury,
 * poisoning, heatstroke, fever and bites. Built from props.jsx +
 * figures.jsx; every scene stays inside the 440×320 stage with the
 * action between x 40–400 (the zoomed visible band).
 */
import {
  useSvgId, g, FigureDefs, ChildSupine, FigureSideLying, InfantHeadUp,
  HandOpenPalm, HandChinLift, HandOnForehead,
  TargetGlow, PulseRing, MotionArrow, ContactShadow, Spec, SKIN, HAIR, SHIRT,
} from './figures';
import {
  NoSign, Phone, ClockFace, HospitalIcon, TapStream, Cup, IcePack,
  PillBottle, EpiPen, Tweezers, Thermometer, BlanketOver, Cushion,
  Flame, Sun, FanPaddle, ClingFilm, GauzePad, WoodStick, PlugSocket,
  StingMark, ForearmCloseUp,
} from './props';

/* calm child head — upright profile facing left, eyes open.
   Reused by every close-up care scene. */
export function CalmChildHead({ uid, eyesClosed = false, distress = false }) {
  return (
    <g>
      <circle cx="0" cy="0" r="34" fill={g(uid, 'iskin')} />
      {/* profile: forehead, nose, lips, chin */}
      <path d="M -22,-24 Q -32,-14 -31,-2 Q -36,1 -32,6 Q -38,10 -31,14 Q -30,22 -22,24 L -8,29 Q 4,30 12,24"
        fill={g(uid, 'iskin')} />
      {/* eye */}
      {eyesClosed ? (
        <path d="M -22,-4 Q -16,0 -10,-4" fill="none" stroke={SKIN.line} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <g>
          <path d="M -24,-5 Q -16,-11 -9,-5 Q -16,-1 -24,-5 Z" fill="#fff" stroke={SKIN.line} strokeWidth="1.2" />
          <circle cx="-16" cy="-5.5" r="3.4" fill="#41342A" />
          <circle cx="-15" cy="-6.5" r="1.1" fill="#fff" />
        </g>
      )}
      {/* brow */}
      <path d={distress ? 'M -25,-13 Q -17,-17 -10,-12' : 'M -25,-12 Q -17,-15 -10,-12'}
        fill="none" stroke={SKIN.line} strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      {/* nostril + lips */}
      <circle cx="-29" cy="5" r="1.3" fill={SKIN.line} opacity="0.6" />
      <path d={distress ? 'M -27,15 Q -23,13 -20,15' : 'M -28,14 Q -23,17 -19,14'}
        fill="none" stroke="#B4583C" strokeWidth="2" strokeLinecap="round" />
      {/* cheek */}
      <ellipse cx="-14" cy="9" rx="6" ry="4" fill={SKIN.blush} opacity="0.28" />
      {/* ear */}
      <ellipse cx="10" cy="2" rx="7" ry="9" fill={g(uid, 'iskin')} />
      <path d="M 8,-3 Q 13,1 9,7" fill="none" stroke={SKIN.line} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      {/* hair */}
      <path d="M -26,-22 Q -10,-36 12,-30 Q 28,-24 30,-6 Q 31,6 26,16 Q 28,0 20,-12 Q 10,-24 -8,-24 Q -18,-24 -26,-22 Z"
        fill={HAIR} />
      <Spec uid={uid} cx="-8" cy="-16" rx="10" ry="6" opacity="0.45" />
    </g>
  );
}

/* ── universal: call for help ──────────────────────────────── */
export function SceneCall() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={70} ry={8} />
      <g transform="translate(206,196) scale(1.7)">
        <Phone uid={uid} />
      </g>
      <PulseRing cx={206} cy={150} r={26} />
      <PulseRing cx={206} cy={150} r={26} delay={0.6} />
      <g transform="translate(310,138)">
        <ClockFace uid={uid} />
      </g>
    </>
  );
}

/* ── universal: go to hospital ─────────────────────────────── */
export function SceneHospital() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={250} cy={262} rx={110} ry={9} />
      <g transform="translate(266,212) scale(1.5)">
        <HospitalIcon uid={uid} />
      </g>
      <MotionArrow uid={uid} d="M 88,210 Q 130,196 168,202" width={4} />
      {/* small parent+child silhouette walking in */}
      <g transform="translate(96,222)">
        <circle cx="0" cy="-34" r="11" fill={g(uid, 'askin')} />
        <path d="M -9,-24 Q 0,-30 9,-24 L 11,6 L -11,6 Z" fill={g(uid, 'sleeve')} />
        <circle cx="18" cy="-18" r="8" fill={g(uid, 'iskin')} />
        <path d="M 12,-11 Q 18,-15 24,-11 L 25,8 L 11,8 Z" fill={g(uid, 'shirt')} />
      </g>
    </>
  );
}

/* ── universal: keep them warm (blanket over recovery pose) ── */
export function SceneBlanket({ variant = 'child' }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <FigureSideLying uid={uid} variant={variant} />
      <BlanketOver uid={uid} />
    </>
  );
}

/* ── universal: small frequent sips ────────────────────────── */
export function SceneSips({ warm = false }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={210} cy={262} rx={80} ry={8} />
      <g transform="translate(228,192) scale(1.35)">
        <CalmChildHead uid={uid} />
      </g>
      {/* cup raised to the lips */}
      <g transform="translate(176,226) rotate(-14)">
        <Cup uid={uid} />
      </g>
      {warm && (
        <g>
          <path className="sc-rise" d="M 168,196 q 4,-7 0,-13" fill="none" stroke="#C9A36A" strokeWidth="2.5" strokeLinecap="round" />
          <path className="sc-rise" style={{ animationDelay: 'calc(0.5s * var(--spd))' }}
            d="M 178,194 q 4,-7 0,-12" fill="none" stroke="#C9A36A" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </>
  );
}

/* ── water: cool under a running tap (burns / bites / chemicals) ── */
export function SceneWaterCool({ mark = 'burn' }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <g transform="translate(232,96)">
        <TapStream uid={uid} length={120} />
      </g>
      <ForearmCloseUp uid={uid} mark={
        mark === 'burn'
          ? <ellipse cx="246" cy="204" rx="14" ry="8" fill="#E06A4A" opacity="0.75" />
          : <circle cx="246" cy="205" r="7" fill="#B43A2E" opacity="0.8" />
      } />
      {/* water sheeting off the arm */}
      <path className="sc-flow" d="M 236,214 q -4,18 -10,30 M 258,212 q 0,18 -4,32" fill="none"
        stroke="#7FB1E8" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" opacity="0.7" />
    </>
  );
}

/* ── water: rinse the eye ──────────────────────────────────── */
export function SceneEyeRinse() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={80} ry={8} />
      {/* head tilted back so water runs across the eye */}
      <g transform="translate(228,206) rotate(-28) scale(1.3)">
        <CalmChildHead uid={uid} eyesClosed />
      </g>
      <g transform="translate(150,88) scale(0.85)">
        <TapStream uid={uid} length={95} />
      </g>
      {/* gentle hand holding the eyelid area */}
      <g transform="translate(196,182) rotate(-30) scale(0.8)">
        <HandChinLift uid={uid} fingerOnly />
      </g>
    </>
  );
}

/* ── wounds: press a gauze pad firmly ──────────────────────── */
export function SceneGauzePressOn() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} mark={<circle cx="226" cy="210" r="8" fill="#B43A2E" opacity="0.8" />} />
      <g transform="translate(226,208)">
        <GauzePad uid={uid} />
      </g>
      <TargetGlow uid={uid} cx={226} cy={208} r={26} />
      {/* pressing hand — firm and steady, not lifting to peek */}
      <g transform="translate(226,200) rotate(-148)">
        <g className="sc-hold-press" style={{ transformOrigin: '0px 0px' }}>
          <HandOpenPalm uid={uid} />
        </g>
      </g>
    </>
  );
}

/* ── wounds: soaked through? add layers on top ─────────────── */
export function SceneLayerCloth() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} />
      {/* first pad — stays put, slightly soaked */}
      <g transform="translate(226,208)">
        <GauzePad uid={uid} />
        <circle cx="0" cy="0" r="7" fill="#B43A2E" opacity="0.45" />
      </g>
      {/* second pad arriving on top */}
      <g className="sc-phase-b">
        <g transform="translate(232,196) rotate(-8)">
          <GauzePad uid={uid} />
        </g>
      </g>
      <MotionArrow uid={uid} d="M 282,142 Q 258,158 240,180" width={3} />
      {/* never lift the first layer */}
      <NoSign x={330} y={170} r={22} />
      <path d="M 318,182 Q 308,194 302,204" fill="none" stroke="#C42B1C" strokeWidth="2"
        strokeDasharray="4 4" opacity="0.6" />
    </>
  );
}

/* ── wounds: raise the limb above the heart ────────────────── */
export function SceneRaiseLimb() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} />
      {/* raised arm overlay — lifted high with a supporting hand */}
      <path d="M 196,214 Q 216,176 240,148 Q 248,140 254,148 Q 258,156 250,164 Q 230,190 214,220 Z"
        fill={g(uid, 'iskinL')} />
      <path d="M 244,150 Q 254,140 262,142 Q 268,146 263,154 Q 256,160 248,158 Z" fill={g(uid, 'iskin')} />
      <g transform="translate(262,166) rotate(40) scale(0.9)">
        <HandChinLift uid={uid} sleeve={false} />
      </g>
      <MotionArrow uid={uid} d="M 286,196 Q 290,168 278,144" width={3.5} />
      {/* heart-level reference line */}
      <path d="M 96,206 H 360" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 7" opacity="0.5" />
    </>
  );
}

/* ── universal prohibition scenes ──────────────────────────── */
export function SceneNoMeds({ kind = 'pills' }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={70} ry={8} />
      <g transform="translate(214,196) scale(1.6)">
        <PillBottle uid={uid} warn={kind === 'poison'} />
      </g>
      <NoSign x={214} y={192} r={58} />
    </>
  );
}

export function SceneNoRemedies() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={110} ry={8} />
      {/* ice cube */}
      <g transform="translate(136,206)">
        <rect x="-20" y="-20" width="40" height="40" rx="6" fill="#BFE0F2" stroke="#8FB9D6" strokeWidth="2" />
        <path d="M -10,-10 L 2,2 M 2,-12 L 10,-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* butter block */}
      <g transform="translate(224,212)">
        <path d="M -24,-10 L 14,-10 L 24,-2 L 24,12 L -14,12 L -24,4 Z" fill="#F2D88A" stroke="#D8B85A" strokeWidth="1.5" />
        <path d="M -24,-10 L -14,-2 L 24,-2 M -14,-2 L -14,12" fill="none" stroke="#D8B85A" strokeWidth="1.5" />
      </g>
      {/* toothpaste tube */}
      <g transform="translate(308,206) rotate(-18)">
        <path d="M -22,-8 L 14,-10 L 16,10 L -22,8 Q -26,0 -22,-8 Z" fill="#D8E8F5" stroke="#9FB2C4" strokeWidth="1.5" />
        <rect x="14" y="-7" width="8" height="13" rx="2" fill="#7A95AE" />
        <path d="M -16,-2 L 6,-3" stroke="#C42B1C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <NoSign x={222} y={200} r={86} />
    </>
  );
}

/* ── cold compress on a bump ───────────────────────────────── */
export function SceneColdCompress() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={216} cy={262} rx={80} ry={8} />
      <g transform="translate(224,196) scale(1.35)">
        <CalmChildHead uid={uid} />
      </g>
      {/* small bump on the forehead */}
      <ellipse cx="190" cy="160" rx="9" ry="6" fill="#E08A6A" opacity="0.7" />
      {/* cloth-wrapped cold pack held gently against it */}
      <g transform="translate(186,148)">
        <g className="sc-hold-press"><IcePack uid={uid} /></g>
      </g>
      <g transform="translate(206,124) rotate(120) scale(0.9)">
        <HandChinLift uid={uid} sleeve={false} />
      </g>
    </>
  );
}

/* ── warning signs to watch for ────────────────────────────── */
export function SceneWarningSigns() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={80} ry={8} />
      <g transform="translate(220,200) scale(1.3)">
        <CalmChildHead uid={uid} eyesClosed distress />
      </g>
      {/* amber alert triangles pulsing around the head */}
      {[[128, 130], [306, 138], [330, 222]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`} className="sc-pulse"
          style={{ animationDelay: `calc(${i * 0.4}s * var(--spd))` }}>
          <path d="M 0,-16 L 15,11 L -15,11 Z" fill="#E8A33D" stroke="#B9762A" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="-2.2" y="-7" width="4.4" height="9" rx="2" fill="#fff" />
          <circle cx="0" cy="6" r="2.2" fill="#fff" />
        </g>
      ))}
    </>
  );
}

/* ── note the time ─────────────────────────────────────────── */
export function SceneClockNote() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={80} ry={8} />
      <g transform="translate(196,188) scale(2.1)">
        <ClockFace uid={uid} />
      </g>
      {/* pencil jotting */}
      <g transform="translate(308,212) rotate(40)">
        <rect x="-6" y="-44" width="12" height="56" rx="3" fill="#E8B86A" />
        <path d="M -6,12 L 0,26 L 6,12 Z" fill="#F2D8B8" />
        <path d="M -2,20 L 0,26 L 2,20 Z" fill="#41342A" />
      </g>
    </>
  );
}

/* ── EpiPen sequence ───────────────────────────────────────────
   A seated child's outer thigh, knee to the left, hip off-frame
   right. Rounded, with the shorts hem near the hip. Injection
   target sits mid-thigh around (224,222). */
function Thigh({ uid }) {
  const sk = g(uid, 'iskinL');
  return (
    <g>
      <ellipse cx="230" cy="262" rx="158" ry="13" fill="#33200E" opacity="0.18" filter={g(uid, 'blur6')} />

      {/* thigh mass — knee narrows at the left, hip widens right */}
      <path d="M 96,238
               Q 96,222 118,214 Q 150,202 196,200 Q 280,198 348,206
               Q 384,212 388,236 Q 388,256 352,262 Q 280,268 196,266
               Q 150,264 118,256 Q 96,250 96,238 Z" fill={sk} />
      {/* top ridge highlight — the roll of the cylinder */}
      <path d="M 120,220 Q 180,206 264,206 Q 332,208 372,220"
        fill="none" stroke="rgba(255,243,224,0.7)" strokeWidth="11" strokeLinecap="round" opacity="0.8" />
      <path d="M 132,214 Q 200,202 280,203" fill="none" stroke="rgba(255,250,238,0.5)" strokeWidth="3.5" strokeLinecap="round" />
      {/* underside form-shadow */}
      <path d="M 124,256 Q 200,264 300,262 Q 348,260 376,250"
        fill="none" stroke="#9C5B28" strokeWidth="11" strokeLinecap="round" opacity="0.2" />
      {/* knee cap hint at the left */}
      <ellipse cx="124" cy="234" rx="20" ry="22" fill="rgba(255,238,218,0.25)" />
      <ellipse cx="120" cy="228" rx="9" ry="7" fill="rgba(255,245,228,0.4)" />

      {/* shorts hem draping over the hip (right) */}
      <path d="M 330,200 Q 366,204 388,216 L 392,256 Q 372,266 344,266 Q 356,244 350,222 Q 344,208 330,200 Z"
        fill={SHIRT.deep} />
      <path d="M 338,210 Q 360,212 378,222" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 334,202 Q 348,224 344,250" fill="none" stroke={SHIRT.fold} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      <Spec uid={uid} cx="210" cy="212" rx="20" ry="7" opacity="0.4" />
    </g>
  );
}

/* A clenched fist gripping a vertical pen barrel, forearm rising
   off-frame above. Local (0,0) = centre of the grip; barrel runs
   vertically through x=0. The forearm is what makes it read as a
   real arm rather than a floating ball. */
function EpiFist({ uid }) {
  const sk = g(uid, 'askin');
  return (
    <g filter={g(uid, 'lift')}>
      {/* forearm rising straight up out of the frame */}
      <path d="M -20,-18 Q -22,-60 -18,-96 L 22,-96 Q 26,-58 22,-18 Z" fill={g(uid, 'askinL')} />
      <path d="M -12,-30 Q -14,-64 -11,-92" fill="none" stroke="rgba(255,243,224,0.55)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 14,-26 Q 16,-60 13,-90" fill="none" stroke="#9C5B28" strokeWidth="3" strokeLinecap="round" opacity="0.25" />

      {/* back of the clenched hand */}
      <path d="M -20,-20 Q -22,2 -10,16 Q 2,26 16,18 Q 24,8 22,-12 Q 20,-24 8,-26 Q -10,-28 -20,-20 Z" fill={sk} />
      {/* knuckle row across the top */}
      <g>
        {[-12, -3, 6, 15].map((x, i) => (
          <ellipse key={i} cx={x} cy={-16 + (i === 0 || i === 3 ? 3 : 0)} rx="5" ry="4.5" fill={sk} />
        ))}
        {[-12, -3, 6, 15].map((x, i) => (
          <ellipse key={'h' + i} cx={x - 1} cy={-18 + (i === 0 || i === 3 ? 3 : 0)} rx="2.4" ry="1.8" fill="rgba(255,243,224,0.6)" />
        ))}
      </g>
      {/* fingers curling around the FRONT (left) of the barrel — stacked ridges */}
      {[-8, 1, 10].map((y, i) => (
        <path key={i} d={`M -18,${y} q -8,1 -10,3 q -1,2 1,4 q 3,2 9,1 Z`} fill={g(uid, 'askinL')} />
      ))}
      {/* thumb wrapping the near side */}
      <path d="M 18,-8 Q 28,-6 28,6 Q 27,16 18,16 Q 12,14 13,4 Q 14,-6 18,-8 Z" fill={sk} />
      <path d="M 20,-2 Q 24,2 21,8" fill="none" stroke="#8E5526" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <Spec uid={uid} cx="2" cy="-8" rx="8" ry="4.5" opacity="0.4" />
    </g>
  );
}

export function SceneEpiGrip() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <Thigh uid={uid} />
      {/* pen held above the thigh, orange tip down, fist gripping it */}
      <g transform="translate(224,150)">
        <EpiPen uid={uid} cap />
        <g transform="translate(0,-14)"><EpiFist uid={uid} /></g>
      </g>
      <TargetGlow uid={uid} cx={224} cy={222} r={24} />
    </>
  );
}

export function SceneEpiCap() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={70} ry={8} />
      <g transform="translate(216,204) scale(1.7)">
        <EpiPen uid={uid} />
      </g>
      {/* blue cap lifting away */}
      <g className="sc-bob">
        <rect x="198" y="84" width="36" height="27" rx="10" fill="#3D6BB5" />
      </g>
      <MotionArrow uid={uid} d="M 250,126 Q 256,106 252,88" width={3.5} />
    </>
  );
}

export function SceneEpiInject({ hold = false }) {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <Thigh uid={uid} />
      <TargetGlow uid={uid} cx={224} cy={220} r={22} />
      <PulseRing cx={224} cy={218} r={18} />
      <g transform="translate(224,152)">
        <g className={hold ? 'sc-hold-press' : 'sc-inject'}>
          <EpiPen uid={uid} />
          <g transform="translate(0,-14)"><EpiFist uid={uid} /></g>
        </g>
      </g>
    </>
  );
}

export function SceneEpiRub() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <Thigh uid={uid} />
      {/* injection point */}
      <circle cx="224" cy="222" r="5" fill="#E08A6A" opacity="0.7" />
      {/* rubbing hand — small circles */}
      <g transform="translate(224,214) rotate(-150)">
        <g className="sc-rub" style={{ transformOrigin: '0px 0px' }}>
          <HandOpenPalm uid={uid} />
        </g>
      </g>
      <path d="M 196,196 a 28,18 0 1 1 56,4" fill="none" stroke="var(--accent)"
        strokeWidth="2" strokeDasharray="4 5" opacity="0.6" />
    </>
  );
}

/* anaphylaxis signs — hives + swelling, urgent but not terrifying */
export function SceneAllergySigns() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={80} ry={8} />
      <g transform="translate(220,200) scale(1.35)">
        <CalmChildHead uid={uid} distress />
      </g>
      {/* hive patches on the cheek and neck */}
      {[[196, 212, 7], [212, 228, 5], [184, 232, 6], [238, 244, 5]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E0732B" opacity="0.45" className="sc-pulse"
          style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box', animationDelay: `calc(${i * 0.3}s * var(--spd))` }} />
      ))}
      {/* swollen lips cue — exaggerated lip outline */}
      <path d="M 178,222 Q 186,228 194,223" fill="none" stroke="#C9684A" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      {/* amber warning */}
      <g transform="translate(320,140)" className="sc-pulse">
        <path d="M 0,-18 L 17,13 L -17,13 Z" fill="#E8A33D" stroke="#B9762A" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="-2.4" y="-8" width="4.8" height="10" rx="2" fill="#fff" />
        <circle cx="0" cy="7" r="2.4" fill="#fff" />
      </g>
    </>
  );
}

/* lay them down, raise the legs */
export function SceneLegsRaised() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} x={-30} />
      {/* cushions under the ankles */}
      <g transform="translate(330,238)">
        <Cushion uid={uid} />
      </g>
      <g transform="translate(338,222)">
        <Cushion uid={uid} />
      </g>
      <MotionArrow uid={uid} d="M 354,200 q 6,-16 -2,-30" width={3.5} />
    </>
  );
}

/* ── electric shock ────────────────────────────────────────── */
export function SceneCutPower() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={260} rx={90} ry={8} />
      <g transform="translate(180,180) scale(1.5)">
        <PlugSocket uid={uid} live />
      </g>
      {/* big OFF switch being pressed */}
      <g transform="translate(300,150)">
        <rect x="-26" y="-34" width="52" height="68" rx="8" fill="#E9EFF5" stroke="#9FB2C4" strokeWidth="2" />
        <rect x="-14" y="-22" width="28" height="44" rx="5" fill="#C42B1C" />
        <rect x="-14" y="0" width="28" height="22" rx="5" fill="#8E1F14" />
      </g>
      <g transform="translate(312,108) rotate(165)">
        <g className="sc-hold-press"><HandChinLift uid={uid} /></g>
      </g>
      <MotionArrow uid={uid} d="M 352,120 q 8,18 0,34" width={3.5} />
    </>
  );
}

export function SceneNoTouchLive() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} x={-24} />
      {/* live cable near the child */}
      <g transform="translate(330,210)">
        <path d="M 60,-60 Q 20,-30 0,0" fill="none" stroke="#4A5564" strokeWidth="5" strokeLinecap="round" />
        <g className="sc-flicker">
          <path d="M -8,2 L -16,10 L -10,11 L -18,22" fill="none" stroke="#F5C242" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 8,4 L 15,12 L 9,13 L 16,24" fill="none" stroke="#F5C242" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* push away with a dry wooden stick — never your hands */}
      <g transform="translate(196,118) rotate(28)">
        <WoodStick uid={uid} length={150} />
      </g>
      <NoSign x={120} y={130} r={26} />
      {/* hand reaching crossed out */}
      <g transform="translate(120,148) rotate(60) scale(0.7)" opacity="0.75">
        <HandChinLift uid={uid} sleeve={false} />
      </g>
    </>
  );
}

/* check for entry/exit burn marks */
export function SceneBurnMarks() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} mark={
        <g>
          <ellipse cx="200" cy="216" rx="10" ry="6" fill="#C9684A" opacity="0.75" />
          <ellipse cx="282" cy="198" rx="8" ry="5" fill="#C9684A" opacity="0.65" />
        </g>
      } />
      {/* dashed inspection rings on both marks */}
      <circle cx="200" cy="216" r="18" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="4 5" className="sc-pulse"
        style={{ transformOrigin: '200px 216px', transformBox: 'view-box' }} />
      <circle cx="282" cy="198" r="16" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="4 5" className="sc-pulse"
        style={{ transformOrigin: '282px 198px', transformBox: 'view-box', animationDelay: 'calc(0.5s * var(--spd))' }} />
      {/* loose gauze arriving */}
      <g transform="translate(318,150) rotate(10)">
        <GauzePad uid={uid} />
      </g>
    </>
  );
}

/* ── seizure ───────────────────────────────────────────────── */
export function SceneSeizureCalm() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <g className="sc-jitter">
        <ChildSupine uid={uid} />
      </g>
      <g transform="translate(330,128) scale(1.2)">
        <ClockFace uid={uid} />
      </g>
    </>
  );
}

export function SceneClearArea() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <g className="sc-jitter">
        <ChildSupine uid={uid} />
      </g>
      {/* cushion sliding under the head */}
      <g transform="translate(116,252)">
        <Cushion uid={uid} />
      </g>
      {/* hard object moved away */}
      <g transform="translate(366,210)">
        <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#B9956A" />
        <path d="M -10,-10 H 10 M -10,0 H 10" stroke="rgba(80,50,20,0.3)" strokeWidth="2" />
      </g>
      <MotionArrow uid={uid} d="M 352,180 Q 372,170 390,174" width={3.5} />
    </>
  );
}

export function SceneNoRestrain() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <g className="sc-jitter">
        <ChildSupine uid={uid} />
      </g>
      {/* hands hovering — present but NOT holding */}
      <g transform="translate(196,150) rotate(-160) scale(0.9)" opacity="0.9">
        <HandOpenPalm uid={uid} />
      </g>
      <g transform="translate(296,144) rotate(-150) scale(0.85)" opacity="0.9">
        <HandOpenPalm uid={uid} />
      </g>
      <NoSign x={246} y={120} r={26} />
    </>
  );
}

export function SceneNoMouthObject() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={210} cy={262} rx={80} ry={8} />
      <g transform="translate(228,198) scale(1.35)">
        <CalmChildHead uid={uid} eyesClosed />
      </g>
      {/* spoon approaching the mouth — crossed out */}
      <g transform="translate(132,222) rotate(-24)">
        <rect x="-4" y="-2" width="44" height="7" rx="3.5" fill="#B7C4D0" />
        <ellipse cx="-12" cy="1" rx="12" ry="8" fill="#B7C4D0" />
      </g>
      <NoSign x={134} y={218} r={34} />
    </>
  );
}

export function SceneRest() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <FigureSideLying uid={uid} variant="child" />
      <BlanketOver uid={uid} />
      {/* crescent moon + drifting stars */}
      <g transform="translate(348,108)">
        <path d="M 0,-22 A 22,22 0 1 0 14,16 A 17,17 0 1 1 0,-22 Z" fill="#E8C63D" opacity="0.9" />
      </g>
      <g className="sc-float" style={{ animationDelay: 'calc(0.4s * var(--spd))' }}>
        <path d="M 300,128 l 2.6,5.4 5.8,0.8 -4.2,4.1 1,5.8 -5.2,-2.8 -5.2,2.8 1,-5.8 -4.2,-4.1 5.8,-0.8 Z" fill="#E8C63D" opacity="0.8" />
      </g>
      <g className="sc-float" style={{ animationDelay: 'calc(1.1s * var(--spd))' }}>
        <path d="M 268,108 l 1.8,3.8 4,0.6 -2.9,2.8 0.7,4 -3.6,-1.9 -3.6,1.9 0.7,-4 -2.9,-2.8 4,-0.6 Z" fill="#E8C63D" opacity="0.7" />
      </g>
    </>
  );
}

/* watch them for 24–48 hours */
export function SceneWatchOver() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <g transform="translate(30,46) scale(0.82)">
        <FigureSideLying uid={uid} variant="child" />
        <BlanketOver uid={uid} />
      </g>
      <g transform="translate(330,112) scale(1.15)">
        <ClockFace uid={uid} />
      </g>
      {/* watching eye */}
      <g transform="translate(110,108)">
        <path d="M -20,0 Q 0,-16 20,0 Q 0,16 -20,0 Z" fill="#fff" stroke="#6B5640" strokeWidth="2" />
        <circle cx="0" cy="0" r="6.5" fill="#41597A" />
        <circle cx="2" cy="-2" r="2.2" fill="#fff" />
      </g>
    </>
  );
}

/* ── poisoning ─────────────────────────────────────────────── */
export function SceneNoVomit() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={80} ry={8} />
      <g transform="translate(232,198) scale(1.35)">
        <CalmChildHead uid={uid} distress />
      </g>
      {/* outward arrow from the mouth — crossed out */}
      <path d="M 188,222 Q 160,226 138,238" fill="none" stroke="#7E8A96" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 6" />
      <NoSign x={148} y={232} r={32} />
    </>
  );
}

export function SceneWipeMouth() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={80} ry={8} />
      <g transform="translate(232,198) scale(1.35)">
        <CalmChildHead uid={uid} />
      </g>
      {/* damp cloth wiping the mouth */}
      <g transform="translate(186,224)">
        <g className="sc-wipe">
          <path d="M -16,-10 Q 0,-16 16,-10 Q 20,0 14,8 Q 0,14 -14,8 Q -20,0 -16,-10 Z" fill="#D8E8F5" stroke="#9FB2C4" strokeWidth="1.5" />
          <path d="M -8,-6 Q 0,-9 8,-6 M -9,2 Q 0,5 9,2" fill="none" stroke="#B5CADC" strokeWidth="1.5" />
        </g>
      </g>
      <g transform="translate(206,254) rotate(-130) scale(0.85)">
        <HandChinLift uid={uid} sleeve={false} />
      </g>
    </>
  );
}

export function SceneKeepContainer() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={90} ry={8} />
      <g transform="translate(170,202) scale(1.5)">
        <PillBottle uid={uid} warn />
      </g>
      {/* take it with you → hospital */}
      <MotionArrow uid={uid} d="M 228,196 Q 258,186 286,192" width={3.5} />
      <g transform="translate(330,206) scale(0.95)">
        <HospitalIcon uid={uid} />
      </g>
    </>
  );
}

/* ── heatstroke / fever ────────────────────────────────────── */
export function SceneShade() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={100} ry={8} />
      <g transform="translate(116,116) scale(1.3)">
        <Sun uid={uid} />
      </g>
      <MotionArrow uid={uid} d="M 168,170 Q 216,186 262,180" width={4} />
      {/* shaded shelter */}
      <g transform="translate(322,190)">
        <path d="M -52,6 Q 0,-34 52,6 Z" fill="#7E9A76" />
        <rect x="-5" y="6" width="10" height="52" rx="4" fill="#8A6A42" />
        <ellipse cx="0" cy="62" rx="48" ry="9" fill="#5A4632" opacity="0.25" />
      </g>
    </>
  );
}

export function SceneFanCool() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} />
      {/* water droplets on the skin */}
      {[[206, 196], [232, 192], [258, 196]].map(([x, y], i) => (
        <path key={i} d={`M ${x},${y} q -4,7 0,10 q 5,3 7,-3 q 1,-5 -7,-7 Z`} fill="#7FB1E8" opacity="0.8" />
      ))}
      {/* fanning */}
      <g transform="translate(232,124)">
        <g className="sc-fan"><FanPaddle uid={uid} /></g>
      </g>
      {/* moving air */}
      <path className="sc-air" d="M 180,150 q -16,8 -18,20" fill="none" stroke="#9FC4E8" strokeWidth="3" strokeLinecap="round" />
      <path className="sc-air" style={{ animationDelay: 'calc(0.5s * var(--spd))' }}
        d="M 286,148 q 16,8 18,20" fill="none" stroke="#9FC4E8" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

export function SceneNoDirectHeat() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={262} rx={90} ry={8} />
      {/* heater glyph */}
      <g transform="translate(206,200)">
        <rect x="-44" y="-30" width="88" height="60" rx="8" fill="#E9EFF5" stroke="#9FB2C4" strokeWidth="2" />
        {[-26, -8, 10, 28].map((x) => (
          <rect key={x} x={x - 4} y="-20" width="8" height="40" rx="4" fill="#E0732B" opacity="0.8" />
        ))}
      </g>
      <g transform="translate(206,148)">
        <g className="sc-rise"><Flame uid={uid} /></g>
      </g>
      <NoSign x={206} y={192} r={66} />
    </>
  );
}

export function SceneThermometerCheck() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={250} cy={262} rx={84} ry={8} />
      {/* child's head, resting */}
      <g transform="translate(268,196) scale(1.25)">
        <CalmChildHead uid={uid} eyesClosed />
      </g>
      {/* a parent's hand holds the thermometer up to read it */}
      <g transform="translate(150,212) rotate(-24) scale(1.5)">
        <Thermometer uid={uid} />
      </g>
      <g transform="translate(118,250) rotate(-150) scale(0.9)">
        <HandChinLift uid={uid} />
      </g>
      {/* focus on the reading */}
      <TargetGlow uid={uid} cx={150} cy={166} r={18} />
    </>
  );
}

export function SceneSponge() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={216} cy={262} rx={80} ry={8} />
      <g transform="translate(226,200) scale(1.35)">
        <CalmChildHead uid={uid} eyesClosed />
      </g>
      {/* lukewarm flannel dabbing the forehead */}
      <g transform="translate(188,154)">
        <g className="sc-wipe">
          <path d="M -18,-10 Q 0,-16 18,-10 Q 22,0 16,8 Q 0,14 -16,8 Q -22,0 -18,-10 Z" fill="#F2D8B8" stroke="#D8B88A" strokeWidth="1.5" />
        </g>
      </g>
      {/* gentle water drops */}
      <path className="sc-float" d="M 170,176 q -2,5 1,8" fill="none" stroke="#7FB1E8" strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

export function SceneLightDress() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={260} rx={100} ry={8} />
      {/* light single layer tee */}
      <g transform="translate(150,196)">
        <path d="M -38,-26 L -16,-40 Q 0,-46 16,-40 L 38,-26 L 28,-6 L 18,-12 L 18,38 L -18,38 L -18,-12 L -28,-6 Z"
          fill={g(uid, 'shirt')} />
        <path d="M -12,-36 Q 0,-30 12,-36" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
      </g>
      {/* heavy bundle crossed out */}
      <g transform="translate(316,198)">
        <path d="M -34,4 Q -38,-16 -18,-22 Q 0,-28 18,-22 Q 38,-16 34,4 Q 30,22 0,24 Q -30,22 -34,4 Z" fill="#C9885A" />
        <path d="M -24,-8 Q 0,-16 24,-8 M -26,6 Q 0,0 26,6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
        <NoSign x={0} y={0} r={44} />
      </g>
    </>
  );
}

/* ── bites & stings ────────────────────────────────────────── */
export function SceneDressing() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} />
      {/* bandage band wrapped around the forearm */}
      <g transform="translate(226,210) rotate(-12)">
        <rect x="-26" y="-26" width="52" height="50" rx="10" fill="#FFFDF8" stroke="#D8CDBA" strokeWidth="2" />
        <path d="M -26,-12 H 26 M -26,2 H 26 M -26,16 H 26" stroke="#E4DBC8" strokeWidth="2" />
      </g>
      <MotionArrow uid={uid} d="M 282,150 Q 258,162 244,180" width={3} />
    </>
  );
}

export function SceneScrapeSting() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} mark={<g transform="translate(238,204)"><StingMark uid={uid} /></g>} />
      {/* card scraping sideways — never tweezers on a sting */}
      <g transform="translate(282,180) rotate(-30)">
        <g className="sc-wipe">
          <rect x="-24" y="-16" width="48" height="32" rx="5" fill="#7A95AE" />
          <path d="M -16,-6 H 8" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <MotionArrow uid={uid} d="M 300,222 Q 270,232 240,228" width={3} />
    </>
  );
}

export function SceneTickPull() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} mark={
        <g transform="translate(238,206)">
          <ellipse cx="0" cy="0" rx="5" ry="6.5" fill="#3E2E1E" />
          <path d="M -4,-3 Q -8,-5 -10,-3 M 4,-3 Q 8,-5 10,-3 M -4,2 Q -8,4 -10,2 M 4,2 Q 8,4 10,2"
            fill="none" stroke="#3E2E1E" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      } />
      {/* fine tweezers gripping at skin level, pulling straight up */}
      <g transform="translate(238,196)">
        <g className="sc-bob"><Tweezers uid={uid} /></g>
      </g>
      <MotionArrow uid={uid} d="M 270,178 q 2,-20 -2,-34" width={3.5} />
    </>
  );
}

/* put a barrier between your hand and the wound */
export function SceneHandBarrier() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={220} cy={258} rx={90} ry={8} />
      {/* hand with a plastic-bag barrier pulled over it */}
      <g transform="translate(208,210) rotate(-150) scale(1.3)">
        <HandOpenPalm uid={uid} />
      </g>
      {/* translucent bag outline over the hand */}
      <path d="M 142,162 Q 200,138 264,160 Q 282,186 268,216 Q 210,238 156,220 Q 132,192 142,162 Z"
        fill="rgba(190,215,235,0.3)" stroke="rgba(150,180,205,0.85)" strokeWidth="2" strokeDasharray="2 0" />
      <path d="M 152,170 Q 204,152 256,168" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* glove alternative at the side */}
      <g transform="translate(338,196) rotate(8)" opacity="0.9">
        <path d="M -14,28 L -14,-6 Q -14,-14 -8,-14 L -8,-26 Q -8,-30 -4,-30 Q 0,-30 0,-26 L 0,-14 L 4,-14 L 4,-24 Q 4,-28 8,-28 Q 12,-28 12,-24 L 12,-12 Q 16,-10 16,-2 L 16,28 Q 2,34 -14,28 Z"
          fill="#8FD0E8" opacity="0.85" />
      </g>
    </>
  );
}

/* tourniquets cause damage — pressure only */
export function SceneNoTourniquet() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} />
      {/* tight twisted band — crossed out */}
      <g transform="translate(196,218) rotate(-14)">
        <rect x="-8" y="-26" width="16" height="52" rx="7" fill="#C9684A" />
        <path d="M -8,-14 Q 0,-10 8,-14 M -8,0 Q 0,4 8,0 M -8,14 Q 0,18 8,14" fill="none" stroke="rgba(90,30,20,0.4)" strokeWidth="2" />
      </g>
      <NoSign x={196} y={214} r={40} />
      {/* the right answer: keep pressing the gauze */}
      <g transform="translate(282,200)">
        <GauzePad uid={uid} />
      </g>
      <g transform="translate(282,194) rotate(-148) scale(0.8)">
        <g className="sc-hold-press" style={{ transformOrigin: '0px 0px' }}>
          <HandOpenPalm uid={uid} />
        </g>
      </g>
    </>
  );
}

/* ── head injury ───────────────────────────────────────────── */
export function SceneHeadStill() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} />
      {/* two steady hands either side of the head — keep it still */}
      <g transform="translate(102,206) rotate(-30) scale(0.85)">
        <HandOnForehead uid={uid} />
      </g>
      <g transform="translate(142,184) rotate(20) scale(0.85)">
        <HandOnForehead uid={uid} />
      </g>
      {/* stillness — calm dashed halo, nothing moves */}
      <circle cx="120" cy="226" r="40" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 7" opacity="0.5" />
    </>
  );
}

/* fever comfort — treat the child, not the number */
export function SceneComfort() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ContactShadow uid={uid} cx={210} cy={262} rx={80} ry={8} />
      <g transform="translate(206,196) scale(1.3)">
        <CalmChildHead uid={uid} />
      </g>
      {/* happily playing — bouncing ball */}
      <g className="sc-bob">
        <circle cx="316" cy="216" r="20" fill="#E8896A" />
        <path d="M 296,216 Q 316,200 336,216 M 316,196 Q 312,216 316,236" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
      </g>
      {/* thermometer set aside, small */}
      <g transform="translate(112,232) rotate(64) scale(0.8)" opacity="0.7">
        <Thermometer uid={uid} />
      </g>
    </>
  );
}

/* ── drowning: reach with a pole, never swim out ───────────── */
export function SceneWaterRescue() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      {/* water */}
      <path d="M 150,224 Q 240,212 400,220 L 400,290 L 140,290 Z" fill={g(uid, 'water')} opacity="0.55" />
      <path className="sc-flow" d="M 160,228 Q 250,218 392,226" fill="none" stroke="#7FB1E8" strokeWidth="3" strokeDasharray="14 10" opacity="0.8" />
      {/* pool edge the rescuer stays on */}
      <path d="M 40,236 L 152,228 L 156,290 L 40,290 Z" fill="#C9AE8C" />
      {/* child in the water — head + reaching arm */}
      <g transform="translate(312,212) scale(0.75)">
        <InfantHeadUp uid={uid} />
      </g>
      <path d="M 286,210 Q 270,200 256,198" fill="none" stroke={g(uid, 'iskinL')} strokeWidth="10" strokeLinecap="round" />
      {/* rescuer kneeling on the edge holding out a pole */}
      <g transform="translate(96,182)">
        <circle cx="0" cy="-26" r="14" fill={g(uid, 'askin')} />
        <path d="M -8,-32 Q 0,-44 12,-34 Q 14,-22 6,-16 Q 10,-30 -2,-34 Z" fill={HAIR} />
        <path d="M -12,-14 Q 0,-20 12,-14 L 18,28 Q 0,36 -16,28 Z" fill={g(uid, 'sleeve')} />
      </g>
      <g transform="translate(112,178) rotate(12)">
        <WoodStick uid={uid} length={170} />
      </g>
      {/* never jump in */}
      <NoSign x={196} y={120} r={24} />
      <path className="sc-float" d="M 196,134 q -3,6 0,10" fill="none" stroke="#5E97D1" strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

/* stop-drop-roll / smother flames */
export function SceneStopBurning() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ChildSupine uid={uid} x={-20} />
      {/* small flame at the clothing edge */}
      <g transform="translate(300,206) scale(0.8)">
        <Flame uid={uid} />
      </g>
      {/* thick blanket smothering it */}
      <g className="sc-phase-b">
        <path d="M 230,170 Q 290,150 350,172 Q 366,186 356,202 Q 300,222 244,210 Q 222,196 230,170 Z"
          fill="#C9885A" />
        <path d="M 246,182 Q 296,168 340,184" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <MotionArrow uid={uid} d="M 330,140 Q 316,154 306,170" width={3.5} />
    </>
  );
}

/* remove tight things before swelling starts */
export function SceneRemoveTight() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} />
      {/* bracelet sliding off toward the hand */}
      <g className="sc-bob" transform="translate(316,200) rotate(78)">
        <ellipse cx="0" cy="0" rx="20" ry="7" fill="none" stroke="#E8C63D" strokeWidth="5" />
      </g>
      <MotionArrow uid={uid} d="M 330,168 Q 352,162 372,168" width={3.5} />
      {/* swelling hint near the burn */}
      <ellipse cx="206" cy="214" rx="13" ry="7" fill="#E08A6A" opacity="0.5" />
    </>
  );
}

/* cover the burn loosely with cling film */
export function SceneClingWrap() {
  const uid = useSvgId();
  return (
    <>
      <FigureDefs uid={uid} />
      <ForearmCloseUp uid={uid} mark={<ellipse cx="226" cy="208" rx="13" ry="7" fill="#E06A4A" opacity="0.7" />} />
      {/* film laid loosely over — translucent */}
      <path d="M 178,184 Q 228,172 282,182 L 290,222 Q 234,238 172,226 Z"
        fill="rgba(190,215,235,0.35)" stroke="rgba(150,180,205,0.8)" strokeWidth="1.5" />
      <g transform="translate(312,150) rotate(14) scale(0.9)">
        <ClingFilm uid={uid} />
      </g>
      <MotionArrow uid={uid} d="M 300,176 Q 280,180 262,188" width={3} />
    </>
  );
}
