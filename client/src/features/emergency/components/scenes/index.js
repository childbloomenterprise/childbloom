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
import {
  SceneForearmHold, SceneBackBlows, SceneFlipFaceUp,
  SceneChestThrusts, SceneMouthCheck, SceneCycle55,
} from './chokingInfant';
import {
  SceneChildLean, SceneBackBlowsChild, SceneFistPlace,
  SceneHeimlichThrust, SceneCycle55Child,
} from './chokingChild';
import {
  SceneCall, SceneHospital, SceneBlanket, SceneSips, SceneWaterCool,
  SceneEyeRinse, SceneGauzePressOn, SceneLayerCloth, SceneRaiseLimb,
  SceneNoMeds, SceneNoRemedies, SceneColdCompress, SceneWarningSigns,
  SceneClockNote, SceneEpiGrip, SceneEpiCap, SceneEpiInject, SceneEpiRub,
  SceneAllergySigns, SceneLegsRaised, SceneCutPower, SceneNoTouchLive,
  SceneBurnMarks, SceneSeizureCalm, SceneClearArea, SceneNoRestrain,
  SceneNoMouthObject, SceneRest, SceneWatchOver, SceneNoVomit,
  SceneWipeMouth, SceneKeepContainer, SceneShade, SceneFanCool,
  SceneNoDirectHeat, SceneThermometerCheck, SceneSponge, SceneLightDress,
  SceneDressing, SceneScrapeSting, SceneTickPull, SceneHeadStill,
  SceneComfort, SceneWaterRescue, SceneStopBurning, SceneRemoveTight,
  SceneClingWrap, SceneHandBarrier, SceneNoTourniquet,
} from './careScenes';
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

  /* ── choking — infant ── */
  'choking-infant.hold': { Component: SceneForearmHold, captionKey: 'sos.scenes.forearmHold' },
  'choking-infant.blows': { Component: SceneBackBlows, captionKey: 'sos.scenes.backBlows', badges: [{ x: '78%', y: '20%', label: '×5' }] },
  'choking-infant.flip': { Component: SceneFlipFaceUp, captionKey: 'sos.scenes.flipFaceUp' },
  'choking-infant.thrusts': { Component: SceneChestThrusts, captionKey: 'sos.scenes.chestThrusts', badges: [{ x: '78%', y: '20%', label: '×5' }] },
  'choking-infant.mouth': { Component: SceneMouthCheck, captionKey: 'sos.scenes.mouthCheck' },
  'choking-infant.cycle': { Component: SceneCycle55, captionKey: 'sos.scenes.cycle55', badges: [{ x: '20%', y: '20%', label: '5' }, { x: '66%', y: '20%', label: '5' }], zoom: 1 },
  'choking-infant.cpr': { Component: SceneCompress, props: { variant: 'infant' }, captionKey: 'sos.scenes.goCprInfant' },

  /* ── choking — child ── */
  'choking-child.lean': { Component: SceneChildLean, captionKey: 'sos.scenes.childLean' },
  'choking-child.blows': { Component: SceneBackBlowsChild, captionKey: 'sos.scenes.backBlows', badges: [{ x: '76%', y: '18%', label: '×5' }] },
  'choking-child.fist': { Component: SceneFistPlace, captionKey: 'sos.scenes.fistNavel' },
  'choking-child.thrusts': { Component: SceneHeimlichThrust, captionKey: 'sos.scenes.heimlich', badges: [{ x: '76%', y: '18%', label: '×5' }] },
  'choking-child.cycle': { Component: SceneCycle55Child, captionKey: 'sos.scenes.cycle55', badges: [{ x: '20%', y: '20%', label: '5' }, { x: '66%', y: '20%', label: '5' }], zoom: 1 },
  'choking-child.cpr': { Component: SceneCompress, props: { variant: 'child' }, captionKey: 'sos.scenes.goCprChild' },

  /* ── allergic reaction (anaphylaxis + auto-injector) ── */
  'allergic.signs': { Component: SceneAllergySigns, captionKey: 'sos.scenes.allergySigns' },
  'allergic.grip': { Component: SceneEpiGrip, captionKey: 'sos.scenes.epiGrip' },
  'allergic.cap': { Component: SceneEpiCap, captionKey: 'sos.scenes.epiCap' },
  'allergic.inject': { Component: SceneEpiInject, captionKey: 'sos.scenes.epiInject' },
  'allergic.hold': { Component: SceneEpiInject, props: { hold: true }, captionKey: 'sos.scenes.epiHold' },
  'allergic.rub': { Component: SceneEpiRub, captionKey: 'sos.scenes.epiRub' },
  'allergic.call': { Component: SceneCall, captionKey: 'sos.scenes.callHelp' },
  'allergic.legs': { Component: SceneLegsRaised, captionKey: 'sos.scenes.legsRaised' },
  'allergic.second': { Component: SceneEpiInject, captionKey: 'sos.scenes.epiSecond' },
  'allergic.hospital': { Component: SceneHospital, captionKey: 'sos.scenes.goHospital' },

  /* ── drowning ── */
  'drowning.rescue': { Component: SceneWaterRescue, captionKey: 'sos.scenes.waterRescue' },
  'drowning.check': { Component: SceneBreathCheck, props: { variant: 'child' }, captionKey: 'sos.scenes.checkChild' },
  'drowning.breaths': { Component: SceneRescueBreath, props: { variant: 'child' }, captionKey: 'sos.scenes.breaths5', badges: [{ x: '14%', y: '22%', label: '×5' }] },
  'drowning.warm': { Component: SceneBlanket, captionKey: 'sos.scenes.keepWarm' },
  'drowning.hospital': { Component: SceneHospital, captionKey: 'sos.scenes.goHospital' },

  /* ── severe bleeding ── */
  'bleeding.barrier': { Component: SceneHandBarrier, captionKey: 'sos.scenes.handBarrier' },
  'bleeding.press': { Component: SceneGauzePressOn, captionKey: 'sos.scenes.pressWound' },
  'bleeding.layer': { Component: SceneLayerCloth, captionKey: 'sos.scenes.layerCloth' },
  'bleeding.raise': { Component: SceneRaiseLimb, captionKey: 'sos.scenes.raiseLimb' },
  'bleeding.notq': { Component: SceneNoTourniquet, captionKey: 'sos.scenes.noTourniquet' },
  'bleeding.warm': { Component: SceneBlanket, captionKey: 'sos.scenes.keepWarm' },

  /* ── electric shock ── */
  'electric.power': { Component: SceneCutPower, captionKey: 'sos.scenes.cutPower' },
  'electric.notouch': { Component: SceneNoTouchLive, captionKey: 'sos.scenes.noTouchLive' },
  'electric.check': { Component: SceneBreathCheck, props: { variant: 'child' }, captionKey: 'sos.scenes.checkChild' },
  'electric.burns': { Component: SceneBurnMarks, captionKey: 'sos.scenes.burnMarks' },
  'electric.hospital': { Component: SceneHospital, captionKey: 'sos.scenes.goHospital' },

  /* ── seizure ── */
  'seizure.calm': { Component: SceneSeizureCalm, captionKey: 'sos.scenes.seizureCalm' },
  'seizure.clear': { Component: SceneClearArea, captionKey: 'sos.scenes.clearArea' },
  'seizure.norestrain': { Component: SceneNoRestrain, captionKey: 'sos.scenes.noRestrain' },
  'seizure.nomouth': { Component: SceneNoMouthObject, captionKey: 'sos.scenes.noMouth' },
  'seizure.rest': { Component: SceneRest, captionKey: 'sos.scenes.restAfter' },
  'seizure.doctor': { Component: SceneCall, captionKey: 'sos.scenes.callDoctor' },

  /* ── burns and scalds ── */
  'burns.stop': { Component: SceneStopBurning, captionKey: 'sos.scenes.stopBurning' },
  'burns.cool': { Component: SceneWaterCool, captionKey: 'sos.scenes.coolWater' },
  'burns.remove': { Component: SceneRemoveTight, captionKey: 'sos.scenes.removeTight' },
  'burns.nono': { Component: SceneNoRemedies, captionKey: 'sos.scenes.noRemedies' },
  'burns.cling': { Component: SceneClingWrap, captionKey: 'sos.scenes.clingFilm' },
  'burns.warm': { Component: SceneSips, captionKey: 'sos.scenes.keepWarmSips' },

  /* ── head injury ── */
  'head.still': { Component: SceneHeadStill, captionKey: 'sos.scenes.headStill' },
  'head.signs': { Component: SceneWarningSigns, captionKey: 'sos.scenes.warningSigns' },
  'head.compress': { Component: SceneColdCompress, captionKey: 'sos.scenes.coldCompress' },
  'head.watch': { Component: SceneWatchOver, captionKey: 'sos.scenes.watchOver' },
  'head.nomeds': { Component: SceneNoMeds, captionKey: 'sos.scenes.noMeds' },
  'head.rest': { Component: SceneRest, captionKey: 'sos.scenes.restAfter' },

  /* ── poisoning ── */
  'poison.novomit': { Component: SceneNoVomit, captionKey: 'sos.scenes.noVomit' },
  'poison.wipe': { Component: SceneWipeMouth, captionKey: 'sos.scenes.wipeMouth' },
  'poison.container': { Component: SceneKeepContainer, captionKey: 'sos.scenes.keepContainer' },
  'poison.note': { Component: SceneClockNote, captionKey: 'sos.scenes.noteTime' },
  'poison.skin': { Component: SceneWaterCool, props: { mark: 'chem' }, captionKey: 'sos.scenes.rinseSkin' },
  'poison.eye': { Component: SceneEyeRinse, captionKey: 'sos.scenes.rinseEye' },

  /* ── heatstroke / hypothermia ── */
  'heat.shade': { Component: SceneShade, captionKey: 'sos.scenes.getShade' },
  'heat.cool': { Component: SceneFanCool, captionKey: 'sos.scenes.fanCool' },
  'heat.sips': { Component: SceneSips, captionKey: 'sos.scenes.coolSips' },
  'heat.warm': { Component: SceneBlanket, captionKey: 'sos.scenes.warmSlowly' },
  'heat.noheat': { Component: SceneNoDirectHeat, captionKey: 'sos.scenes.noDirectHeat' },
  'heat.warmsips': { Component: SceneSips, props: { warm: true }, captionKey: 'sos.scenes.warmSips' },

  /* ── fever ── */
  'fever.thermo': { Component: SceneThermometerCheck, captionKey: 'sos.scenes.takeTemp' },
  'fever.light': { Component: SceneLightDress, captionKey: 'sos.scenes.dressLight' },
  'fever.fluids': { Component: SceneSips, captionKey: 'sos.scenes.offerFluids' },
  'fever.comfort': { Component: SceneComfort, captionKey: 'sos.scenes.treatChild' },
  'fever.noaspirin': { Component: SceneNoMeds, captionKey: 'sos.scenes.noAspirin' },
  'fever.sponge': { Component: SceneSponge, captionKey: 'sos.scenes.spongeBath' },
  'fever.signs': { Component: SceneWarningSigns, captionKey: 'sos.scenes.warningSigns' },

  /* ── bites and stings ── */
  'bite.wash': { Component: SceneWaterCool, props: { mark: 'wound' }, captionKey: 'sos.scenes.washWound' },
  'bite.press': { Component: SceneGauzePressOn, captionKey: 'sos.scenes.pressWound' },
  'bite.dress': { Component: SceneDressing, captionKey: 'sos.scenes.coverDressing' },
  'bite.doctor': { Component: SceneHospital, captionKey: 'sos.scenes.goHospital' },
  'bite.sting': { Component: SceneScrapeSting, captionKey: 'sos.scenes.scrapeSting' },
  'bite.cool': { Component: SceneColdCompress, captionKey: 'sos.scenes.coolArea' },
  'bite.tick': { Component: SceneTickPull, captionKey: 'sos.scenes.tickPull' },
  'bite.allergy': { Component: SceneAllergySigns, captionKey: 'sos.scenes.watchAllergy' },

  /* ── shared (used by several emergencies) ── */
  'shared.recovery-infant': { Component: SceneRecoveryRoll, props: { variant: 'infant' }, captionKey: 'sos.scenes.recovery' },
  'shared.recovery-child': { Component: SceneRecoveryRoll, props: { variant: 'child' }, captionKey: 'sos.scenes.recovery' },
  'shared.breaths-first': { Component: SceneRescueBreath, props: { variant: 'child' }, captionKey: 'sos.scenes.breaths5', badges: [{ x: '14%', y: '22%', label: '×5' }] },
};

export function getScene(id) {
  return SCENES[id] || null;
}
