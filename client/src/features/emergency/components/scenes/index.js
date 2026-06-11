/**
 * SOS scene registry — the spine of the animation system.
 *
 * Every guided step in data/emergencies.js carries a `scene:` id that
 * resolves here to { Component, props, captionKey, badges }.
 * - Component renders INSIDE <SceneStage>'s svg (440×320, floor y≈250).
 * - captionKey → emergency.*.json (HTML chips below the stage).
 * - badges → numbered HTML cues overlaid on the frame (never svg text).
 *
 * scenes.test.js enforces: every step scene resolves, every captionKey
 * exists in all 6 locales, and no scene ever renders an svg <text>.
 */
import SceneStage from './SceneStage';
import {
  SceneBreathCheck, SceneLayFlat, ScenePlaceHands, SceneCompress,
  SceneHeadTilt, SceneRescueBreath, SceneCycle302, SceneRecoveryRoll,
} from './shared';
import './scenes.css';

export { SceneStage };

export const SCENES = {
  /* ── infant CPR ── */
  'cpr-infant.check': { Component: SceneBreathCheck, props: { variant: 'infant' }, captionKey: 'sos.scenes.checkInfant' },
  'cpr-infant.flat': { Component: SceneLayFlat, props: { variant: 'infant' }, captionKey: 'sos.scenes.layFlat' },
  'cpr-infant.place': { Component: ScenePlaceHands, props: { variant: 'infant' }, captionKey: 'sos.scenes.placeTwoFinger' },
  'cpr-infant.push': { Component: SceneCompress, props: { variant: 'infant' }, captionKey: 'sos.scenes.pushInfant' },
  'cpr-infant.beat': { Component: SceneCompress, props: { variant: 'infant' }, captionKey: 'sos.scenes.beat30', badges: [{ x: '85%', y: '32%', label: '×30' }] },
  'cpr-infant.airway': { Component: SceneHeadTilt, props: { variant: 'infant' }, captionKey: 'sos.scenes.airway' },
  'cpr-infant.breaths': { Component: SceneRescueBreath, props: { variant: 'infant' }, captionKey: 'sos.scenes.breathsInfant', badges: [{ x: '14%', y: '22%', label: '×2' }] },
  'cpr-infant.cycle': { Component: SceneCycle302, props: { variant: 'infant' }, captionKey: 'sos.scenes.cycle302', badges: [{ x: '20%', y: '24%', label: '30' }, { x: '64%', y: '24%', label: '2' }], zoom: 1 },

  /* ── child CPR ── */
  'cpr-child.check': { Component: SceneBreathCheck, props: { variant: 'child' }, captionKey: 'sos.scenes.checkChild' },
  'cpr-child.flat': { Component: SceneLayFlat, props: { variant: 'child' }, captionKey: 'sos.scenes.layFlat' },
  'cpr-child.place': { Component: ScenePlaceHands, props: { variant: 'child' }, captionKey: 'sos.scenes.placeHeel' },
  'cpr-child.push': { Component: SceneCompress, props: { variant: 'child' }, captionKey: 'sos.scenes.pushChild' },
  'cpr-child.beat': { Component: SceneCompress, props: { variant: 'child' }, captionKey: 'sos.scenes.beat30', badges: [{ x: '85%', y: '32%', label: '×30' }] },
  'cpr-child.airway': { Component: SceneHeadTilt, props: { variant: 'child' }, captionKey: 'sos.scenes.airway' },
  'cpr-child.breaths': { Component: SceneRescueBreath, props: { variant: 'child' }, captionKey: 'sos.scenes.breathsChild', badges: [{ x: '14%', y: '22%', label: '×2' }] },
  'cpr-child.cycle': { Component: SceneCycle302, props: { variant: 'child' }, captionKey: 'sos.scenes.cycle302', badges: [{ x: '20%', y: '24%', label: '30' }, { x: '64%', y: '24%', label: '2' }], zoom: 1 },

  /* ── shared (used by several emergencies) ── */
  'shared.recovery-infant': { Component: SceneRecoveryRoll, props: { variant: 'infant' }, captionKey: 'sos.scenes.recovery' },
  'shared.recovery-child': { Component: SceneRecoveryRoll, props: { variant: 'child' }, captionKey: 'sos.scenes.recovery' },
};

export function getScene(id) {
  return SCENES[id] || null;
}
