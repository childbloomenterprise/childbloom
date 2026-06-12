# SOS Animation System — Handoff (for the new "Motion" 3D-animation skill)

Context for continuing the ChildBloom SOS emergency-animation work in VS Code.
Paste the relevant parts as your opening prompt to the new agent.

---

## What this is

ChildBloom (React 19 + Vite + Vercel + Supabase) has an SOS emergency first-aid
feature: `/emergency/:topic/guided` walks a panicked parent through step-by-step
first aid for 16 emergencies (infant/child CPR, choking, allergic reaction,
drowning, bleeding, electric shock, seizure, burns, head injury, poisoning,
heatstroke, fever, bites).

The old animations were crude "blob people" SVGs + dead Lottie JSONs. This
session replaced them with a **hand-crafted pseudo-3D SVG scene system** —
one unique animated scene per step (**103 scenes**), realistic figures
(real hands with fingers, rounded limbs, layered shading), captions in 6
languages, fully offline, instant load. NO three.js, NO Lottie.

All work is committed + pushed to `origin/main` (auto-deploys to Vercel).

---

## File map — `Code Base/client/src/features/emergency/`

```
components/scenes/
  SceneStage.jsx     Stage wrapper: viewBox 0 0 440 320, warm backdrop +
                     perspective floor + vignette, HTML caption chips BELOW
                     the svg, numbered badge overlays, slow-mo toggle, `zoom`
                     prop (default 1.22, zooms about action centre 220,256).
  figures.jsx        Puppet library + engine. Exports:
                     - useSvgId()  → React 19 useId() sanitised for url(#…)
                     - g(uid,name) → `url(#${uid}-${name})`
                     - FigureDefs  → all gradients/filters (skin, cloth, water,
                       shadows, arrowhead marker)
                     - palette consts: SKIN, ASKIN, HAIR, ONESIE, SHIRT, SLEEVE
                     - figures: InfantSupine, ChildSupine, FigureSideLying,
                       InfantHeadUp, ChildHeadUp, AdultHeadBreath
                     - hands: HandTwoFinger, HandHeelStacked, HandChinLift
                       (has fingerOnly + sleeve props), HandOnForehead,
                       HandOpenPalm
                     - helpers: TargetGlow, PulseRing, MotionArrow,
                       ContactShadow, Spec
  shared.jsx         Parameterized CPR + recovery scenes (variant:'infant'|'child'):
                     SceneBreathCheck, SceneLayFlat, ScenePlaceHands,
                     SceneCompress, SceneHeadTilt, SceneRescueBreath,
                     SceneCycle302, SceneRecoveryRoll
  chokingInfant.jsx  Forearm-hold back-blows / chest-thrusts / mouth-check
  chokingChild.jsx   Standing lean / back blows / Heimlich wrap
  careScenes.jsx     The other 12 emergencies + CalmChildHead, Thigh, EpiFist,
                     EpiPen sequence, water-cool, recovery/blanket, prohibitions
  props.jsx          22 reusable objects: TapStream, EpiPen, Phone, ClockFace,
                     HospitalIcon, Thermometer, Tweezers, IcePack, PillBottle,
                     Cushion, Flame, Sun, FanPaddle, ClingFilm, GauzePad,
                     WoodStick, PlugSocket, StingMark, BlanketOver,
                     ForearmCloseUp (the wound/sting/film canvas), etc.
  scenes.css         ALL keyframes. Every duration = calc(Ns * var(--spd)),
                     --spd is 1 normal / 2.6 slow. Transform+opacity only.
  index.js           SCENES registry — the spine. Each entry:
                     { Component, props?, captionKey, badges?, zoom? }
                     keyed by scene id ('cpr-infant.push', 'bleeding.press', …).
                     getScene(id) resolves it.

data/emergencies.js  16 emergencies, ~100 steps. Each step has `scene:'xxx'`.
                     resolveStep() spreads it through unchanged.
GuidedActionMode.jsx Renders <SceneStage caption={t(scene.captionKey)} …>
                       <scene.Component {...scene.props}/></SceneStage>.
                     framer-motion AnimatePresence slide transitions, 560px
                     centred column, mute/TTS, metronome, countdown timer.
EmergencyTopicPage.jsx + components/EmergencyStepGuide.jsx
                     STILL use the OLD components/illustrations/index.jsx blob
                     art (hero + accordion minis). NOT yet cut over.
components/CPRRhythmCoach.jsx
                     Live CPR metronome demonstrator. STILL old inline SVGs
                     (InfantCPRDemo/ChildCPRDemo) driven by an rAF `pressDepth`
                     prop synced to the metronome. NOT yet restyled.
components/illustrations/index.jsx
                     OLD blob art. Still imported by TopicPage/StepGuide/Guided
                     fallback. To be deleted in the final phase.

i18n/locales/emergency.{en,hi,ml,pa,ta,te}.json
                     Captions under sos.scenes.* (~75 keys × 6 languages).
```

## Tooling (use this to review art without a browser)

```bash
cd "Code Base/client"
node scripts/run-scene-previews.mjs   # renders all 103 scenes → client/scene-previews/*.png
npx vitest run src/features/emergency # 22 tests must pass
npm run build                         # must stay green
```
The PNG previewer (esbuild bundle + @resvg/resvg-js) bakes the accent colour
and shows the **static 0% key pose** (no CSS animation). It's the fast way to
eyeball every scene. To see motion, run the dev server and open a guided flow.

## Hard rules baked into the system (don't break these)

1. **No `<text>` inside scene SVGs — ever.** Captions are HTML chips below the
   stage (i18n, wrapping). A test fails if a scene emits `<text>`.
2. **Reduced motion**: global CSS (index.css:~991) freezes all animations to
   their 0% frame → every scene's static pose MUST be the teaching pose.
3. **Gradient/filter IDs** come from `useSvgId()` per scene instance — never
   hard-code ids (two instances can mount together on the topic page).
4. **Animate transform/opacity only.** Never animate filter params or paint.
5. Captions: every registry `captionKey` must exist in ALL 6 locale files
   (test enforces this).

## Commits this session (all on main)

- `f474bf7` Phase 0 — delete dead Lottie (lottie-react + 11 JSONs)
- `8107d00` Phase 1 — scene engine + infant/child CPR scenes
- `e1ac304` Phase 2 — GuidedActionMode layout polish (560px column, transitions)
- `f072199` Phase 3 — all 16 emergencies, 103 scenes, captions ×6
- `ffa629b` realism — anatomical forearm + thigh + EpiPen fist (killed the
  "sausage with a pea" limbs)
- `8975d75` realism — quilted blanket + real hand on raised limb
- `6ef4552` realism — eye-rinse water aligned onto the eye

## What's LEFT (next agent's TODO)

- **Phase 4 — TopicPage/StepGuide cutover**: add `heroScene:` per emergency in
  emergencies.js; swap `ILLUSTRATIONS`/`MINI_ILLUSTRATIONS` for `getScene()` +
  `<SceneStage>` in EmergencyTopicPage.jsx and EmergencyStepGuide.jsx; i18n the
  hard-coded "Done"/"Next step" strings there.
- **Phase 5 — CPRRhythmCoach restyle**: replace InfantCPRDemo/ChildCPRDemo
  internals with figures.jsx puppets driven by the existing `pressDepth` rAF
  prop (keep the metronome-sync mechanism). Move its in-SVG `<text>` to HTML.
- **Phase 6 — deletion sweep**: delete components/illustrations/index.jsx;
  remove `illustration:`/`stepIllustration:` keys + the GuidedActionMode
  fallback branch; make the registry test strict (every step MUST have a
  `scene`); delete dead keyframes in index.css (~601-772) — grep each class
  first; check `severity-glow`/`breath-cycle` aren't still used.
- **Realism polish** still possible on a few scenes (raised-arm slightly thick,
  choking-child rescuer hand a bit blobby) — use the PNG previewer to iterate.

## Known pre-existing issue (out of scope, flag to Vaish)

Step `voice`/`body` text in emergencies.js is **English-only** — the TTS speaks
English even when the UI language is Hindi/Tamil/etc. Worth a separate task.

---

## For the new "Motion" 3D-animation skill

The current system is **2D pseudo-3D SVG** (chosen over three.js for instant
offline load on a panicking parent's phone). If "Motion" introduces true 3D or a
richer animation engine, the cleanest integration is to keep the **SCENES
registry contract** (`{ Component, props, captionKey, badges, zoom }` keyed by
scene id) so Motion scenes can be dropped in per-step without touching
GuidedActionMode or the data layer. Whatever Motion renders, it must still:
offline-first, instant first paint, reduced-motion safe, no network at runtime,
captions stay as HTML (not baked into the visual). Decide explicitly whether
Motion replaces the SVG scenes or augments specific high-value ones (e.g. CPR).
