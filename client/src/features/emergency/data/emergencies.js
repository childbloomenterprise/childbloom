// Single source of truth for the Emergency / First-Aid section.
// Each entry powers an /emergency/:id detail page (read view, SEO) AND the
// /emergency/:id/guided one-step-at-a-time Guided Action Mode.
//
// ── Protocol fields ───────────────────────────────────────────────
// severity:     'critical' | 'urgent' | 'manageable'
// rhythmCoach:  'infant' | 'child' | null   (null = no live CPR coach)
// illustration: name of an exported component in components/illustrations/index.js
// icon:         a CBIcon name shown in the index card
// source:       audited guideline source, shown in a small footer
// lastReviewed: ISO date the content was last reviewed
//
// ── Step fields ───────────────────────────────────────────────────
// title, body:      detail-page text (kept verbatim — do NOT remove; SEO + read view)
// stepIllustration: optional MINI illustration key
// action:           HUGE short imperative for Guided Action Mode (default → title)
// voice:            spoken line read aloud (default → `${action}. ${body}`)
// seconds:          countdown timer shown for this step (e.g. 3 s hold, 5-min wait)
// autoAdvance:      auto-advance to the next step when the timer hits 0
// metronome:        { bpm, depthCue } → audible+haptic CPR metronome (bpm clamped 100–120)
// reassure:         calming microcopy shown under the step ("You're doing the right thing.")
//
// SAFETY: this content is STATIC and audited. The AI must NEVER generate or
// improvise emergency steps at runtime.

const REASSURE = "You're doing the right thing. Keep going.";

export const EMERGENCIES = [
  // ─────────── CRITICAL ───────────
  {
    id: 'infant-cpr',
    severity: 'critical',
    icon: 'heart-pulse',
    title: 'Infant CPR',
    subtitle: 'Under 1 year — no breathing, no response',
    illustration: 'HandPlacementInfant',
    rhythmCoach: 'infant',
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'If you are alone, shout for help and start CPR for 2 minutes before pausing to call your local emergency number.',
    steps: [
      { scene: 'cpr-infant.check', title: 'Check response and breathing', action: 'Tap the foot and check breathing', body: 'Tap the foot firmly. Look for chest rising. If no normal breathing for 10 seconds, begin CPR immediately.', voice: 'Tap the foot firmly and look for the chest rising. If there is no normal breathing for ten seconds, start CPR now.', stepIllustration: 'MiniBreathCheck', reassure: REASSURE },
      { scene: 'cpr-infant.flat', title: 'Place infant on a firm flat surface', action: 'Lay the baby on a firm flat surface', body: 'Floor or a table. Soft surfaces absorb compressions and reduce effectiveness.' },
      { scene: 'cpr-infant.place', title: 'Place 2 fingers on the centre of the chest', action: 'Place 2 fingers on the centre of the chest', body: 'Just below the nipple line. Use only your index and middle fingers — never the heel of the hand on an infant.' },
      { scene: 'cpr-infant.push', title: 'Push hard and fast — 4 cm deep', action: 'Push hard in the centre of the chest', body: 'About 1.5 inches, roughly one-third of chest depth. Let the chest fully rise between compressions.', reassure: REASSURE },
      { scene: 'cpr-infant.beat', title: '30 compressions at 100–120 per minute', action: 'Give 30 compressions — follow the beat', body: 'Use the rhythm coach to hold pace. Count out loud — it helps you stay steady.', voice: 'Give thirty compressions. Push in time with the beat. Count out loud.', metronome: { bpm: 110, depthCue: 'Push 4 cm — about 1.5 inches' } },
      { scene: 'cpr-infant.airway', title: 'Open the airway', action: 'Tilt the head back gently, lift the chin', body: 'Tilt the head back gently to a neutral position. Lift the chin with one finger. Do not over-extend an infant\'s neck.', stepIllustration: 'MiniHeadTilt' },
      { scene: 'cpr-infant.breaths', title: 'Give 2 small puffs', action: 'Give 2 small puffs of air', body: 'Cover the mouth and nose with your mouth. Puff just enough to see the chest rise — about 1 second per breath.' },
      { scene: 'cpr-infant.cycle', title: 'Continue 30 : 2 cycles', action: 'Keep going — 30 pushes, then 2 puffs', body: 'Do not stop until the infant breathes normally, help arrives, or you are physically unable to continue.', reassure: REASSURE },
    ],
  },
  {
    id: 'child-cpr',
    severity: 'critical',
    icon: 'heart-pulse',
    title: 'Child CPR',
    subtitle: '1 year and older — no breathing, no response',
    illustration: 'HandPlacementChild',
    rhythmCoach: 'child',
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'If you are alone, shout for help and start CPR for 2 minutes before pausing to call your local emergency number.',
    steps: [
      { scene: 'cpr-child.check', title: 'Check response and breathing', action: 'Tap the shoulder, call their name', body: 'Tap the shoulder, call the child\'s name. If no response and no normal breathing for 10 seconds, begin CPR.', voice: 'Tap the shoulder and call the child\'s name. If there is no response and no normal breathing for ten seconds, start CPR.', stepIllustration: 'MiniBreathCheck', reassure: REASSURE },
      { scene: 'cpr-child.flat', title: 'Lay the child flat on their back', action: 'Lay the child flat on their back', body: 'Firm surface, head level with the body.' },
      { scene: 'cpr-child.place', title: 'Place the heel of one hand on the centre of the chest', action: 'Heel of one hand on the centre of the chest', body: 'Lower half of the breastbone. For larger children, use both hands stacked, like adult CPR.' },
      { scene: 'cpr-child.push', title: 'Push hard and fast — 5 cm deep', action: 'Push hard in the centre of the chest', body: 'About 2 inches, roughly one-third of chest depth. Keep arms straight, shoulders directly above hands.', reassure: REASSURE },
      { scene: 'cpr-child.beat', title: '30 compressions at 100–120 per minute', action: 'Give 30 compressions — follow the beat', body: 'Use the rhythm coach to hold pace. Allow full chest recoil between each compression.', voice: 'Give thirty compressions. Push in time with the beat. Let the chest come all the way back up each time.', metronome: { bpm: 110, depthCue: 'Push 5 cm — about 2 inches' } },
      { scene: 'cpr-child.airway', title: 'Open the airway', action: 'Tilt the head back, lift the chin', body: 'Tilt the head back, lift the chin. For older children this can be a more pronounced tilt than for an infant.', stepIllustration: 'MiniHeadTilt' },
      { scene: 'cpr-child.breaths', title: 'Give 2 rescue breaths', action: 'Pinch the nose, give 2 rescue breaths', body: 'Pinch the nose closed, seal your mouth over theirs, breathe in for 1 second per breath. Watch for the chest to rise.' },
      { scene: 'cpr-child.cycle', title: 'Continue 30 : 2 cycles', action: 'Keep going — 30 pushes, then 2 breaths', body: 'Do not stop until the child breathes normally, help arrives, or you are physically unable to continue.', reassure: REASSURE },
    ],
  },
  {
    id: 'choking-infant',
    severity: 'critical',
    icon: 'lungs',
    title: 'Choking — Infant',
    subtitle: 'Under 1 year — cannot cry, cough, or breathe',
    illustration: 'BackBlowInfant',
    rhythmCoach: null,
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'If the infant can still cough or cry, do not interfere — coughing is the body\'s most effective way to clear an airway. Only intervene when they cannot make sound.',
    steps: [
      { scene: 'choking-infant.hold', title: 'Sit and lay the infant face-down on your forearm', action: 'Lay the baby face-down along your forearm', body: 'Support the head and jaw with your hand. Keep the head lower than the chest. Rest your forearm on your thigh for stability.', reassure: REASSURE },
      { scene: 'choking-infant.blows', title: 'Give 5 firm back blows', action: 'Give 5 firm back blows', body: 'Use the heel of your free hand. Strike between the shoulder blades. Each blow should be a separate, deliberate attempt to dislodge the object.', stepIllustration: 'MiniFirmBlows' },
      { scene: 'choking-infant.flip', title: 'Flip the infant face-up', action: 'Turn the baby face-up, head low', body: 'Sandwich them between your forearms; turn together. Keep the head supported and lower than the chest.' },
      { scene: 'choking-infant.thrusts', title: 'Give 5 chest thrusts', action: 'Give 5 chest thrusts', body: 'Two fingers on the centre of the chest, just below the nipple line. Push down sharply about 4 cm deep. Slower and deeper than CPR compressions.' },
      { scene: 'choking-infant.mouth', title: 'Look in the mouth', action: 'Look in the mouth', body: 'Only remove an object if you can clearly see it. Never sweep blindly — that can push it deeper.' },
      { scene: 'choking-infant.cycle', title: 'Repeat back blows and chest thrusts', action: 'Repeat 5 back blows, 5 chest thrusts', body: 'Continue 5 + 5 cycles until the object comes out, the infant cries or breathes, or they go unconscious.', reassure: REASSURE },
      { scene: 'choking-infant.cpr', title: 'If unconscious — start infant CPR', action: 'If they go limp — start Infant CPR', body: 'Move to the Infant CPR guide. After every set of 30 compressions, look in the mouth for the object before giving breaths.' },
    ],
  },
  {
    id: 'choking-child',
    severity: 'critical',
    icon: 'lungs',
    title: 'Choking — Child',
    subtitle: '1 year and older — cannot cough or breathe',
    illustration: 'HeimlichChild',
    rhythmCoach: null,
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'If the child can still cough forcefully, encourage them to keep coughing. Only intervene when they cannot make sound or are turning blue.',
    steps: [
      { scene: 'choking-child.lean', title: 'Stand or kneel behind the child', action: 'Get behind the child, lean them forward', body: 'Support their chest with one hand and lean them forward.', reassure: REASSURE },
      { scene: 'choking-child.blows', title: 'Give 5 firm back blows', action: 'Give 5 firm back blows', body: 'Use the heel of your hand. Strike between the shoulder blades. Each blow should be deliberate and aimed at dislodging the object.' },
      { scene: 'choking-child.fist', title: 'If back blows fail — abdominal thrusts (Heimlich)', action: 'Make a fist just above the navel', body: 'Stand behind the child. Place your fist thumb-side in, just above the navel and below the breastbone. Wrap your other hand over your fist.' },
      { scene: 'choking-child.thrusts', title: 'Give 5 quick inward and upward thrusts', action: 'Give 5 quick in-and-up thrusts', body: 'Pull sharply in and up — like you are trying to lift them off the ground. Each thrust is a separate attempt.' },
      { scene: 'choking-child.cycle', title: 'Alternate 5 back blows and 5 abdominal thrusts', action: 'Alternate 5 back blows, 5 thrusts', body: 'Continue cycling until the object comes out, the child can breathe, or they go unconscious.', reassure: REASSURE },
      { scene: 'choking-child.cpr', title: 'If unconscious — start child CPR', action: 'If they go limp — start Child CPR', body: 'Lower them gently to the floor. Begin Child CPR. Check the mouth for the object before each set of rescue breaths.' },
    ],
  },
  {
    id: 'allergic-reaction',
    severity: 'critical',
    icon: 'shield',
    title: 'Allergic Reaction',
    subtitle: 'Anaphylaxis — swelling, difficulty breathing, collapse',
    illustration: 'RecoveryPosition',
    rhythmCoach: null,
    source: 'IAP · WHO · Resuscitation Council',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Anaphylaxis can kill within minutes. Call your local emergency number the moment you suspect it — do not wait to see if it gets worse.',
    // 10-step guided EpiPen flow (the redesign exemplar). title/body kept for the read view.
    steps: [
      { scene: 'allergic.signs', title: 'Recognise the signs', action: 'Severe allergy? Get the auto-injector', body: 'Swelling of throat or tongue, hoarse voice, difficulty breathing, widespread hives, vomiting, sudden drowsiness or limpness, or pale/blue skin after a trigger — treat as anaphylaxis.', voice: 'If there is swelling, trouble breathing, hives, or collapse after a trigger, treat this as a severe allergy. Get the adrenaline auto-injector now.', reassure: REASSURE },
      { scene: 'allergic.grip', title: 'Hold the leg still and ready the injector', action: 'Hold the leg still, injector in your fist', body: 'Hold the child\'s leg still. Hold the auto-injector in your fist with the orange tip pointing down.' },
      { scene: 'allergic.cap', title: 'Pull off the blue safety cap', action: 'Pull off the blue safety cap', body: 'Remove the safety cap. Remember: blue to the sky, orange to the thigh.' },
      { scene: 'allergic.inject', title: 'Inject into the outer thigh until it clicks', action: 'Press the orange tip into the outer thigh', body: 'Press the orange tip firmly into the middle of the outer thigh until it clicks. Through clothing is OK.', voice: 'Press the orange tip firmly into the middle of the outer thigh until it clicks. Through clothing is fine.' },
      { scene: 'allergic.hold', title: 'Hold in place for 3 seconds', action: 'Hold firmly in place', body: 'Keep the injector pressed hard against the thigh while the dose is delivered.', voice: 'Hold it firmly in place. Three. Two. One.', seconds: 3, autoAdvance: true },
      { scene: 'allergic.rub', title: 'Remove and rub the spot for 10 seconds', action: 'Pull straight out, rub the spot', body: 'Pull the injector straight out. Rub the injection site for about 10 seconds to help absorption.', seconds: 10, autoAdvance: true },
      { scene: 'allergic.call', title: 'Note the time and call emergency services', action: 'Note the time, then call for help', body: 'Note the time of the injection. Call your local emergency number and say: anaphylaxis, adrenaline given. Tell them the time of the dose.', voice: 'Note the time you gave the injection. Call emergency services now and tell them: anaphylaxis, adrenaline given, and the time.', reassure: REASSURE },
      { scene: 'allergic.legs', title: 'Lay the child down, legs raised', action: 'Lay them down, raise the legs', body: 'Lay the child flat and raise their legs to keep blood flowing to the heart. If breathing is hard, let them sit up. Never stand them up — this can be fatal.' },
      { scene: 'allergic.second', title: 'Second dose after 5 minutes if no better', action: 'Wait — second dose at 5 minutes if needed', body: 'If symptoms have not improved and you have a second auto-injector, give it in the other thigh after 5 minutes.', voice: 'If there is no improvement after five minutes and you have a second injector, give it in the other thigh.', seconds: 300 },
      { scene: 'allergic.hospital', title: 'Always go to hospital', action: 'Go to hospital — even if they recover', body: 'Even if the child seems completely fine, symptoms can return hours later (a biphasic reaction). They must be seen by a doctor.', reassure: 'Even if they look better, they must still see a doctor. Stay with them.' },
    ],
  },
  {
    id: 'drowning',
    severity: 'critical',
    icon: 'wave-water',
    title: 'Drowning',
    subtitle: 'Pulled from water — unresponsive or struggling to breathe',
    illustration: 'RecoveryPosition',
    rhythmCoach: null,
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local emergency number even if the child appears recovered. Water in the lungs can cause delayed drowning hours later.',
    steps: [
      { scene: 'drowning.rescue', title: 'Get the child out of the water safely', action: 'Get them out of the water safely', body: 'Do not enter water you cannot handle. Use a pole, rope, or floatation device. Drowning rescuers often become victims themselves.', reassure: REASSURE },
      { scene: 'drowning.check', title: 'Check for breathing', action: 'Lay them flat, check for breathing', body: 'Lay the child flat on their back. Look for chest rising for up to 10 seconds. Do not waste time trying to drain water from the lungs — this is a myth.' },
      { scene: 'shared.breaths-first', title: 'If not breathing — give 5 rescue breaths first', action: 'Not breathing? 5 rescue breaths, then CPR', body: 'Drowning starts as a breathing emergency. Open the airway, give 5 small breaths, then begin CPR (30 compressions : 2 breaths).' },
      { scene: 'shared.recovery-child', title: 'If breathing — recovery position', action: 'Breathing? Roll onto their side', body: 'Roll the child onto their side. Tilt the head back slightly so vomit and water can drain.', stepIllustration: 'MiniRecoveryRoll' },
      { scene: 'drowning.warm', title: 'Keep them warm', action: 'Keep them warm', body: 'Wet clothes cool the body fast. Cover with dry blankets or towels. Do not give food or water — they may vomit.' },
      { scene: 'drowning.hospital', title: 'Go to hospital', action: 'Go to hospital — even if alert', body: 'Even fully alert children must be checked. Pulmonary oedema can develop up to 24 hours after a drowning incident.' },
    ],
  },
  {
    id: 'severe-bleeding',
    severity: 'critical',
    icon: 'droplet',
    title: 'Severe Bleeding',
    subtitle: 'Heavy or pulsing blood loss — wound will not stop',
    illustration: 'BleedingPressure',
    rhythmCoach: null,
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local emergency number for any bleed that pulses, soaks through a cloth in under 5 minutes, or comes from the head, neck, or torso.',
    steps: [
      { scene: 'bleeding.barrier', title: 'Protect yourself', action: 'Protect your hands if you can', body: 'Wear gloves if available. If not, place a barrier (plastic bag, cling film) between your hand and the wound.', reassure: REASSURE },
      { scene: 'bleeding.press', title: 'Apply firm direct pressure', action: 'Press hard on the wound', body: 'Use a clean cloth, gauze, or even a t-shirt. Press firmly on the wound. Do not lift to peek — pressure must stay constant.', stepIllustration: 'MiniGauzePress' },
      { scene: 'bleeding.layer', title: 'Add more cloth on top — never remove the first layer', action: 'Soaked through? Add more cloth on top', body: 'If blood soaks through, place another layer over it. Removing the first cloth pulls off the clot that is forming.' },
      { scene: 'bleeding.raise', title: 'Raise the injured limb', action: 'Raise the injured limb above the heart', body: 'If the wound is on an arm or leg, lift it above the level of the heart. This slows blood flow to the area.' },
      { scene: 'bleeding.notq', title: 'Do not use a tourniquet unless trained', action: 'No tourniquet unless trained', body: 'Tourniquets can cause permanent damage. Direct pressure controls almost all bleeds. Only use one for a catastrophic limb bleed when pressure has failed.' },
      { scene: 'bleeding.warm', title: 'Keep the child warm and still', action: 'Keep them warm and still', body: 'Cover with a blanket. Lay them down with legs slightly raised if they look pale or faint. Do not give food or water.', reassure: REASSURE },
    ],
  },
  {
    id: 'electric-shock',
    severity: 'critical',
    icon: 'bolt',
    title: 'Electric Shock',
    subtitle: 'Contact with mains, frayed wire, or appliance',
    illustration: 'ElectricShock',
    rhythmCoach: null,
    source: 'IAP · WHO · Red Cross',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Even a brief shock can disturb heart rhythm. Call your local emergency number for any shock from a mains source — symptoms can appear hours later.',
    steps: [
      { scene: 'electric.power', title: 'Cut the power before you touch the child', action: 'Cut the power first', body: 'Turn off the mains switch or unplug the appliance. If you cannot, push the child away from the source using a dry wooden stick, broom, or plastic — never anything wet or metal.', reassure: REASSURE },
      { scene: 'electric.notouch', title: 'Do not touch a child still in contact with electricity', action: 'Don\'t touch them while live', body: 'You will become the next casualty. The current passes through anyone connected to the source.' },
      { scene: 'electric.check', title: 'Once safe — check breathing', action: 'Once safe — check breathing', body: 'Look for chest rising for 10 seconds. If not breathing, begin CPR immediately.' },
      { scene: 'shared.recovery-child', title: 'Place in recovery position if breathing', action: 'Breathing? Roll onto their side', body: 'Roll onto their side. Keep the airway open and watch for any change.', stepIllustration: 'MiniRecoveryRoll' },
      { scene: 'electric.burns', title: 'Look for entry and exit burns', action: 'Check for entry and exit burns', body: 'Electricity often burns at the point of contact and where it left the body. These look small but can be deep — cover loosely with a clean cloth.' },
      { scene: 'electric.hospital', title: 'Go to hospital even if the child seems fine', action: 'Go to hospital — even if they seem fine', body: 'Heart rhythm changes from electric shock can develop silently over the next 24 hours.' },
    ],
  },

  // ─────────── URGENT ───────────
  {
    id: 'seizure',
    severity: 'urgent',
    icon: 'brain',
    title: 'Seizure',
    subtitle: 'Convulsions, jerking, loss of consciousness',
    illustration: 'RecoveryPosition',
    rhythmCoach: null,
    source: 'IAP · WHO · Epilepsy guidelines',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Most childhood febrile seizures last under 2 minutes and stop on their own. Call your local emergency number if it is the first seizure ever, lasts more than 5 minutes, or the child has trouble breathing afterwards.',
    steps: [
      { scene: 'seizure.calm', title: 'Stay calm and time it', action: 'Stay calm — note the start time', body: 'Most seizures look terrifying but are over in under 2 minutes. Note the start time.', voice: 'Stay calm. Note the time it started. Most seizures stop on their own within two minutes.', reassure: REASSURE },
      { scene: 'seizure.clear', title: 'Move objects out of the way', action: 'Clear hard objects, cushion the head', body: 'Clear hard or sharp things. Move furniture if you can. Place a folded cushion or jacket under the head.' },
      { scene: 'seizure.norestrain', title: 'Do not restrain the child', action: 'Do NOT hold them down', body: 'Holding limbs can cause injury. Let the seizure run its course.' },
      { scene: 'seizure.nomouth', title: 'Do not put anything in the mouth', action: 'Put NOTHING in the mouth', body: 'They will not swallow their tongue — this is a myth. Putting fingers or objects in risks choking and bites.' },
      { scene: 'shared.recovery-child', title: 'Once jerking stops — recovery position', action: 'When jerking stops — roll onto the side', body: 'Roll onto the side. Tilt the head back so saliva drains. Stay with them until fully alert.', stepIllustration: 'MiniRecoveryRoll', reassure: REASSURE },
      { scene: 'seizure.rest', title: 'Expect tiredness afterwards', action: 'Let them rest afterwards', body: 'It is normal for a child to be confused or sleepy for 30–60 minutes after a seizure (the postictal phase). Let them rest.' },
      { scene: 'seizure.doctor', title: 'Call your doctor', action: 'Call your doctor', body: 'Even if the child seems fully recovered, a first-time seizure or one with fever needs review.' },
    ],
  },
  {
    id: 'burns',
    severity: 'urgent',
    icon: 'flame',
    title: 'Burns and Scalds',
    subtitle: 'Hot liquid, fire, steam, chemicals',
    illustration: 'BurnCooling',
    rhythmCoach: null,
    source: 'IAP · WHO · Burns Association',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local emergency number for: any burn larger than the child\'s palm, any burn on the face, hands, feet, or genitals, any deep burn that looks white or charred, and all chemical or electrical burns.',
    steps: [
      { scene: 'burns.stop', title: 'Stop the burning', action: 'Stop the burning', body: 'Move away from the source. For clothes on fire — stop, drop, and roll, or smother with a thick blanket.', reassure: REASSURE },
      { scene: 'burns.cool', title: 'Cool the burn with running water for 20 minutes', action: 'Cool under running water — 20 minutes', body: 'Cool, not ice-cold. The full 20 minutes matters — it stops the burn from spreading deeper into tissue. Start within 3 hours of the burn for it to be effective.', voice: 'Hold the burn under cool running water. Keep it there for the full twenty minutes — this stops the burn going deeper.', stepIllustration: 'MiniWaterCool', seconds: 1200 },
      { scene: 'burns.remove', title: 'Remove tight clothing and jewellery', action: 'Remove tight clothing and jewellery', body: 'Burned skin swells fast. Remove anything that could constrict — but never pull off clothing that is stuck to the skin.' },
      { scene: 'burns.nono', title: 'Do NOT use ice, butter, oil, or toothpaste', action: 'No ice, butter, oil, or toothpaste', body: 'Ice causes further tissue damage. Home remedies trap heat and increase infection risk. Only cool water.' },
      { scene: 'burns.cling', title: 'Cover loosely', action: 'Cover loosely with cling film', body: 'Use cling film laid over the burn (not wrapped tight) or a clean non-fluffy cloth. Cling film is ideal — it does not stick and lets the doctor see the burn.' },
      { scene: 'burns.warm', title: 'Keep the child warm and give sips of water', action: 'Keep them warm, offer sips of water', body: 'Burns can drop body temperature quickly. Cover the unburned parts with a blanket.' },
    ],
  },
  {
    id: 'head-injury',
    severity: 'urgent',
    icon: 'brain',
    title: 'Head Injury',
    subtitle: 'Fall, knock, or blow to the head',
    illustration: 'RecoveryPosition',
    rhythmCoach: null,
    source: 'IAP · WHO · NICE head-injury guidance',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local emergency number for: any loss of consciousness, repeated vomiting, seizures, clear fluid or blood from ears or nose, drowsiness you cannot wake them from, or unequal pupils.',
    steps: [
      { scene: 'head.still', title: 'Keep the child still', action: 'Keep the child still', body: 'Do not move them if you suspect a neck injury (a fall from height, a hit at speed). Wait for help.', reassure: REASSURE },
      { scene: 'head.signs', title: 'Check for warning signs', action: 'Check for red-flag warning signs', body: 'Loss of consciousness, vomiting more than once, severe headache, confusion, slurred speech, weakness on one side, unequal pupils, fluid from nose or ears.' },
      { scene: 'head.compress', title: 'Apply a cold compress to bumps', action: 'Cold compress on bumps', body: 'A cloth-wrapped ice pack for 10 minutes can reduce swelling on a simple bruise. Do not press hard.' },
      { scene: 'head.watch', title: 'Watch for 24–48 hours', action: 'Watch closely for 24–48 hours', body: 'Some symptoms appear later. Wake the child gently every 2–3 hours during the first night to check they respond normally.' },
      { scene: 'head.nomeds', title: 'No sleep medicines or strong painkillers', action: 'No sleep meds or strong painkillers', body: 'These can mask warning signs. Only paracetamol if needed, and only with your doctor\'s guidance.' },
      { scene: 'head.rest', title: 'Rest, then a slow return to activity', action: 'Rest, then ease back slowly', body: 'Even a mild knock needs at least 24 hours of quiet rest. Avoid screens, sport, and rough play until fully recovered.' },
    ],
  },
  {
    id: 'poisoning',
    severity: 'urgent',
    icon: 'pill',
    title: 'Poisoning',
    subtitle: 'Swallowed medication, chemical, or plant',
    illustration: 'PoisoningPill',
    rhythmCoach: null,
    source: 'IAP · WHO · Poison Control guidance',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local poison helpline or emergency number immediately — even if the child looks fine. Have the container or plant in your hand when you call.',
    steps: [
      { scene: 'poison.novomit', title: 'Do NOT make the child vomit', action: 'Do NOT make them vomit', body: 'Old advice was to induce vomiting. New advice is the opposite — many poisons cause more damage on the way back up than they did going down.', reassure: REASSURE },
      { scene: 'poison.wipe', title: 'Wipe the mouth out with a wet cloth', action: 'Wipe out the mouth with a wet cloth', body: 'Remove any pills or substance still in the mouth. Do not give salt water or syrup of ipecac.' },
      { scene: 'poison.container', title: 'Take the container with you', action: 'Keep the container or plant', body: 'When you call the helpline or go to hospital, bring the bottle, packet, or plant. The exact ingredient changes the treatment.' },
      { scene: 'poison.note', title: 'Note time, amount, and symptoms', action: 'Note time, amount, and symptoms', body: 'How much was swallowed? When? What does the child look like now — drowsy, vomiting, breathing strangely?' },
      { scene: 'poison.skin', title: 'For chemical on the skin', action: 'On the skin? Rinse 20 minutes', body: 'Rinse with running water for 20 minutes. Remove contaminated clothing while rinsing.' },
      { scene: 'poison.eye', title: 'For chemical in the eyes', action: 'In the eyes? Rinse 20 minutes', body: 'Hold the eye open under cool running water for 20 minutes. Then go to hospital.' },
      { scene: 'shared.recovery-child', title: 'Place in recovery position if drowsy', action: 'Drowsy? Roll onto their side', body: 'Lay them on their side so vomit drains away from the lungs. Stay with them until help arrives.', stepIllustration: 'MiniRecoveryRoll' },
    ],
  },
  {
    id: 'heatstroke',
    severity: 'urgent',
    icon: 'sun',
    title: 'Heatstroke / Hypothermia',
    subtitle: 'Body too hot or too cold to function',
    illustration: 'BurnCooling',
    rhythmCoach: null,
    source: 'IAP · WHO',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your local emergency number for: heatstroke (above 40°C, hot dry skin, confusion) or severe hypothermia (uncontrollable shivering or shivering that stops, drowsiness, slow breathing).',
    steps: [
      { scene: 'heat.shade', title: 'For heatstroke — get out of the heat fast', action: 'Too hot? Get out of the heat fast', body: 'Move to shade or air-conditioning. Remove extra clothing.', reassure: REASSURE },
      { scene: 'heat.cool', title: 'Cool the child rapidly', action: 'Cool rapidly — wet skin and fan', body: 'Wet the skin with cool water and fan it. Place cool packs at the neck, armpits, and groin. Do not use ice on bare skin — it can cause shock.' },
      { scene: 'heat.sips', title: 'Give cool fluids if conscious', action: 'Awake? Sip cool fluids', body: 'Small frequent sips of water or oral rehydration solution. No sugary or fizzy drinks.' },
      { scene: 'heat.warm', title: 'For hypothermia — warm slowly and carefully', action: 'Too cold? Warm slowly', body: 'Move out of the cold. Remove wet clothing. Wrap in dry blankets, including a hat. Skin-to-skin contact under blankets warms an infant fastest.' },
      { scene: 'heat.noheat', title: 'Do NOT use direct heat for hypothermia', action: 'No direct heat for the cold', body: 'No hot water, hot pads, or fires close to the skin. Rapid rewarming of cold skin can cause heart rhythm problems.' },
      { scene: 'heat.warmsips', title: 'Warm fluids if alert', action: 'Alert? Sips of a warm drink', body: 'Sips of a warm sweet drink — never alcohol. Stop fluids if drowsy or confused.' },
    ],
  },

  // ─────────── MANAGEABLE ───────────
  {
    id: 'fever',
    severity: 'manageable',
    icon: 'thermometer',
    title: 'Fever',
    subtitle: 'High temperature — when to worry, when to soothe',
    illustration: 'FeverThermometer',
    rhythmCoach: null,
    source: 'IAP · WHO',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your doctor immediately for: any fever in a baby under 3 months, any fever above 40°C (104°F), fever lasting more than 3 days, fever with rash, stiff neck, or trouble breathing.',
    steps: [
      { scene: 'fever.thermo', title: 'Take the temperature accurately', action: 'Take the temperature accurately', body: 'Digital thermometer under the arm for infants, in the mouth for children over 5. Forehead strips are unreliable.', reassure: REASSURE },
      { scene: 'fever.light', title: 'Dress lightly — do not bundle up', action: 'Dress lightly — do not bundle up', body: 'A light layer is enough. Bundling traps heat and makes fever worse. The room should feel comfortable, not hot.' },
      { scene: 'fever.fluids', title: 'Offer fluids often', action: 'Offer fluids often', body: 'Breast milk for infants. Water, milk, or oral rehydration solution for older children. Small sips frequently — not large amounts at once.' },
      { scene: 'fever.comfort', title: 'Paracetamol for discomfort, not the number', action: 'Treat the child, not the thermometer', body: 'If they are happy and playing, you may not need medicine. Follow weight-based dosing on the bottle.' },
      { scene: 'fever.noaspirin', title: 'Never give aspirin to a child', action: 'Never give aspirin', body: 'Aspirin in children can cause Reye\'s syndrome — a rare but life-threatening illness. Use paracetamol or ibuprofen (over 3 months).' },
      { scene: 'fever.sponge', title: 'Lukewarm sponge bath if very uncomfortable', action: 'Lukewarm sponge bath if needed', body: 'Tepid water on a flannel — never cold or icy. If the child shivers, stop. Shivering raises temperature further.' },
      { scene: 'fever.signs', title: 'Watch for warning signs', action: 'Watch for warning signs', body: 'Stiff neck, purple rash that does not fade under pressure, fast breathing, drowsiness, refusal to drink, fewer wet nappies. These need urgent review.' },
    ],
  },
  {
    id: 'bite',
    severity: 'manageable',
    icon: 'bug',
    title: 'Animal or Insect Bite',
    subtitle: 'Dog, cat, bee, wasp, tick, spider',
    illustration: 'BiteWound',
    rhythmCoach: null,
    source: 'IAP · WHO',
    lastReviewed: '2026-05-01',
    callOutFirst: 'Call your doctor for: any animal bite that breaks the skin, any bite to the face or hands, signs of infection, or a known allergy to insect stings. Call your local emergency number for any sign of anaphylaxis.',
    steps: [
      { scene: 'bite.wash', title: 'For animal bites — clean the wound', action: 'Wash the wound — 5 minutes', body: 'Wash thoroughly with soap and running water for 5 minutes. This removes most bacteria and is the single most important step.', reassure: REASSURE, seconds: 300 },
      { scene: 'bite.press', title: 'Stop the bleeding with firm pressure', action: 'Press firmly to stop bleeding', body: 'Use a clean cloth. Most bites bleed less than they look like they should — that is normal.' },
      { scene: 'bite.dress', title: 'Cover with a clean dry dressing', action: 'Cover with a clean dry dressing', body: 'Do not seal a deep bite tightly. Doctors may need to leave it open to drain.' },
      { scene: 'bite.doctor', title: 'Always go to a doctor for animal bites', action: 'See a doctor for animal bites', body: 'Risk of infection (especially cat bites) and rabies/tetanus check. Bring details: what animal, when, vaccinated or stray.' },
      { scene: 'bite.sting', title: 'For bee or wasp stings — remove the sting', action: 'Sting? Scrape it out sideways', body: 'Scrape it out sideways with a fingernail or card. Do not use tweezers — squeezing pumps in more venom.' },
      { scene: 'bite.cool', title: 'Cool the area for 10 minutes', action: 'Cool the area — 10 minutes', body: 'A cloth-wrapped ice pack reduces swelling and pain.', seconds: 600 },
      { scene: 'bite.tick', title: 'For ticks — pull straight out', action: 'Tick? Pull straight out with tweezers', body: 'Use fine tweezers as close to the skin as possible. Steady, even pressure straight up. Do not twist, burn, or coat in petroleum jelly. Save the tick for identification.' },
      { scene: 'bite.allergy', title: 'Watch for allergic reaction', action: 'Watch for a severe allergic reaction', body: 'Swelling beyond the bite site, hives, vomiting, trouble breathing — these are signs of anaphylaxis. Use an EpiPen if prescribed and call your local emergency number.' },
    ],
  },
];

export const SEVERITY = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    tint: 'rgba(220,38,38,0.10)',
    border: 'rgba(220,38,38,0.25)',
    badgeBg: 'rgba(220,38,38,0.12)',
  },
  urgent: {
    label: 'Urgent',
    color: '#B45309',
    tint: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.25)',
    badgeBg: 'rgba(217,119,6,0.12)',
  },
  manageable: {
    label: 'Manageable',
    color: '#166534',
    tint: 'rgba(22,101,52,0.07)',
    border: 'rgba(22,101,52,0.20)',
    badgeBg: 'rgba(22,101,52,0.10)',
  },
};

export function getEmergency(id) {
  return EMERGENCIES.find(e => e.id === id) || null;
}

// Resolves a step into the fields Guided Action Mode renders, applying the
// documented fallbacks so every step always has an `action`, `detail`, and
// `voice` even if the optional guided fields were omitted. Pure — unit-tested.
export function resolveStep(step) {
  if (!step) return { action: '', detail: '', voice: '' };
  const action = step.action || step.title || '';
  const detail = step.body || '';
  const voice = step.voice || [action, detail].filter(Boolean).join('. ');
  return {
    ...step,
    action,
    detail,
    voice,
    reassure: step.reassure || null,
    seconds: step.seconds || null,
    metronome: step.metronome || null,
    autoAdvance: !!step.autoAdvance,
  };
}
