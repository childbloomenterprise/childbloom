/**
 * ChildBloom — Dr. Bloom Pediatric Engine
 * Evidence bases: WHO, AAP, IAP 2023-2024, Erikson, Bowlby
 * Modes: Warm Friend | Clinical Advisor | Emergency Protocol
 */

// ─────────────────────────────────────────────
// EMERGENCY KEYWORD DETECTOR
// Hard-coded. Bypasses AI. Never misses.
// ─────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
  'not breathing', 'stopped breathing', 'not responding', 'unconscious',
  'seizure', 'convulsion', 'shaking uncontrollably', 'blue lips', 'turning blue',
  'choking', "can't breathe", 'difficulty breathing', 'severe breathing',
  'fever 104', 'fever 105', '104°f', '105°f', '104°c', '40°c', '41°c',
  'blood everywhere', 'bleeding heavily', "won't stop bleeding",
  'broken bone', 'bone sticking', 'head injury', 'fell on head',
  'swallowed poison', 'ate poison', 'drank bleach', 'drank medicine',
  'allergic reaction', 'swelling face', 'throat swelling', 'rash spreading fast',
  'limp', "won't wake up", 'eyes rolling', 'unresponsive',
  'ശ്വസിക്കുന്നില്ല', 'ബോധമില്ല', 'അപസ്മാരം', 'നീലിക്കുന്നു',
  'மூச்சு விட மாட்டேன்', 'சுயநினைவில்லை', 'வலிப்பு',
  'सांस नहीं ले रहा', 'बेहोश', 'दौरा', 'नीला पड़ रहा'
];

export function isEmergency(message) {
  const lower = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase()));
}

export function getEmergencyResponse(childName, language = 'en') {
  const name = childName || 'your child';
  const responses = {
    en: `🚨 **This sounds like a medical emergency.**\n\n**Call emergency services immediately: 112**\n\nWhile you wait:\n- Keep ${name} calm and still\n- Do not give any food or water\n- If unconscious and breathing: place on their side\n- If not breathing: begin CPR if you know how\n\n**Go to your nearest hospital emergency room right now.**\n\nI am an AI and cannot assess emergencies. Please call a doctor or 112 immediately.`,
    ml: `🚨 **ഇത് ഒരു മെഡിക്കൽ അടിയന്തരാവസ്ഥ ആണ്.**\n\n**ഉടൻ 112 വിളിക്കൂ**\n\n${name}-നെ ശാന്തമായി കിടത്തൂ. ഉടൻ അടുത്തുള്ള ആശുപത്രിയിൽ പോകൂ.`,
    ta: `🚨 **இது ஒரு மருத்துவ அவசரநிலை.**\n\n**உடனடியாக 112 அழைக்கவும்**\n\n${name}-ஐ அமைதியாக வைத்திருங்கள். உடனடியாக அருகிலுள்ள மருத்துவமனைக்கு செல்லுங்கள்.`,
    hi: `🚨 **यह एक चिकित्सा आपात स्थिति है।**\n\n**तुरंत 112 पर कॉल करें**\n\n${name} को शांत रखें और तुरंत नजदीकी अस्पताल जाएं।`
  };
  return responses[language] || responses.en;
}

// ─────────────────────────────────────────────
// INTENT CLASSIFIER
// ─────────────────────────────────────────────
export function detectIntent(message) {
  const lower = message.toLowerCase();

  const clinicalTriggers = [
    'appointment', 'doctor visit', 'pediatrician', 'report', 'ask the doctor',
    'what to tell', 'diagnose', 'symptoms', 'differential', 'prescription',
    'test results', 'lab', 'clinic', 'hospital visit', 'second opinion',
    'ഡോക്ടർ', 'ആശുപത്രി', 'റിപ്പോർട്ട്',
    'டாக்டர்', 'ஆஸ்பத்திரி', 'அறிக்கை',
    'डॉक्टर', 'अस्पताल', 'रिपोर्ट'
  ];

  const hasClinical = clinicalTriggers.some(t => lower.includes(t));
  return hasClinical ? 'clinical' : 'warm';
}

// ─────────────────────────────────────────────
// AGE PRECISION ENGINE
// ─────────────────────────────────────────────
export function getAgePrecision(dateOfBirth, dueDate = null, isPregnant = false) {
  if (isPregnant && dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const weeksUntilDue = Math.ceil(daysUntilDue / 7);
    const gestationalWeek = 40 - weeksUntilDue;
    return {
      displayAge: `${gestationalWeek} weeks pregnant`,
      precisionUnit: 'gestational_weeks',
      gestationalWeek,
      developmentalStage: 'prenatal',
      contextNote: `Baby is at ${gestationalWeek} weeks gestation. ${weeksUntilDue} weeks until due date.`
    };
  }

  const now = new Date();
  const dob = new Date(dateOfBirth);
  const totalDays = Math.floor((now - dob) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = Math.floor(totalDays / 30.44);
  const years = Math.floor(totalDays / 365.25);
  const remainingMonths = Math.floor((totalDays % 365.25) / 30.44);

  let displayAge, precisionUnit, developmentalStage, contextNote;

  if (totalWeeks <= 12) {
    displayAge = `${totalWeeks} weeks old`;
    precisionUnit = 'weeks';
    developmentalStage = 'newborn';
    contextNote = `At ${totalWeeks} weeks, every day of development is significant. Focus on feeding, sleep cycles, and sensory bonding.`;
  } else if (totalMonths <= 6) {
    const extraWeeks = Math.floor((totalDays - (totalMonths * 30.44)) / 7);
    displayAge = `${totalMonths} months${extraWeeks > 0 ? ` and ${extraWeeks} weeks` : ''} old`;
    precisionUnit = 'months_weeks';
    developmentalStage = 'early_infant';
    contextNote = `At ${totalMonths} months, developmental windows are rapid. Track milestones weekly, not monthly.`;
  } else if (totalMonths <= 12) {
    displayAge = `${totalMonths} months old`;
    precisionUnit = 'months';
    developmentalStage = 'late_infant';
    contextNote = `At ${totalMonths} months, motor development and solid food introduction are primary focus areas.`;
  } else if (totalMonths <= 24) {
    displayAge = `${totalMonths} months old (${years} year${years > 1 ? 's' : ''})`;
    precisionUnit = 'months';
    developmentalStage = 'toddler_early';
    contextNote = `At ${totalMonths} months, language explosion and independence drives are key developmental markers.`;
  } else if (years <= 3) {
    displayAge = `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
    precisionUnit = 'years_months';
    developmentalStage = 'toddler_late';
    contextNote = `At this age, social-emotional development, toilet training, and speech milestones are critical.`;
  } else {
    displayAge = `${years} years${remainingMonths > 0 ? ` and ${remainingMonths} months` : ''} old`;
    precisionUnit = 'years';
    developmentalStage = years <= 5 ? 'preschool' : 'early_childhood';
    contextNote = `At ${years} years, school readiness, peer relationships, and independence skills are key.`;
  }

  return { displayAge, precisionUnit, developmentalStage, contextNote, totalDays, totalWeeks, totalMonths, years };
}

// ─────────────────────────────────────────────
// CHILD PROFILE FOLDER BUILDER
// ─────────────────────────────────────────────
export function buildChildProfileFolder(data) {
  const {
    child,
    growthRecords,
    foodLogs,
    healthRecords,
    weeklyUpdate,
    vaccinations,
  } = data;

  const ageInfo = getAgePrecision(child.date_of_birth, child.due_date, child.is_pregnant);
  const latestGrowth = growthRecords?.[0];
  const previousGrowth = growthRecords?.[1];

  let growthTrend = '';
  if (latestGrowth && previousGrowth) {
    const weightDiff = latestGrowth.weight_kg - previousGrowth.weight_kg;
    const daysDiff = Math.ceil((new Date(latestGrowth.record_date) - new Date(previousGrowth.record_date)) / (1000 * 60 * 60 * 24));
    const weeklyGain = (weightDiff / daysDiff * 7 * 1000).toFixed(0);
    growthTrend = `Weight gain: approximately ${weeklyGain}g per week over the last measurement period.`;
  }

  const reactionSummary = (foodLogs || []).reduce((acc, log) => {
    if (log.reaction && log.reaction !== 'none' && log.reaction !== 'normal') {
      acc.push(`${log.food_name} → ${log.reaction}`);
    }
    return acc;
  }, []);

  const upcomingVaccines = (vaccinations || [])
    .filter(v => !v.date_given && v.next_due)
    .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))
    .slice(0, 3);

  const overdueVaccines = (vaccinations || [])
    .filter(v => !v.date_given && v.next_due && new Date(v.next_due) < new Date())
    .map(v => v.vaccine_name);

  return `
═══════════════════════════════════════════════
CHILD PROFILE FOLDER — Read this before responding
═══════════════════════════════════════════════

IDENTITY
Name: ${child.name}
Age: ${ageInfo.displayAge}
Gender: ${child.gender || 'not specified'}
Developmental stage: ${ageInfo.developmentalStage}
Stage context: ${ageInfo.contextNote}

BIRTH PROFILE
Birth weight: ${child.birth_weight_grams ? `${child.birth_weight_grams}g` : 'not recorded'}
Born: ${child.is_premature ? `Premature at ${child.gestational_age_at_birth || 'unknown'} weeks` : 'Full term'}
Blood group: ${child.blood_group || 'not recorded'}

KNOWN ALERTS
Allergies: ${child.known_allergies?.length > 0 ? child.known_allergies.join(', ') : 'None recorded'}
${overdueVaccines.length > 0 ? `⚠️ OVERDUE VACCINES: ${overdueVaccines.join(', ')}` : ''}

CURRENT GROWTH (latest measurement)
${latestGrowth ? `Weight: ${latestGrowth.weight_kg}kg | Height: ${latestGrowth.height_cm}cm${latestGrowth.head_circumference_cm ? ` | Head: ${latestGrowth.head_circumference_cm}cm` : ''}
Measured on: ${latestGrowth.record_date}
${growthTrend}` : 'No growth records yet.'}

RECENT WEEKLY CHECK-IN
${weeklyUpdate ? `Date: ${weeklyUpdate.week_date} | Mood: ${weeklyUpdate.mood}/5 | Sleep: ${weeklyUpdate.sleep_hours}h (quality: ${weeklyUpdate.sleep_quality}/5)
Motor milestone: ${weeklyUpdate.motor_milestone || 'not logged'} | New skills: ${weeklyUpdate.new_skills || 'not logged'}
Feeding notes: ${weeklyUpdate.feeding_notes || 'nothing noted'}
Parent concerns: ${weeklyUpdate.concerns || 'none noted'}` : 'No weekly check-in recorded yet.'}

LAST 7 FOOD LOGS
${(foodLogs || []).length > 0
  ? foodLogs.slice(0, 7).map(f =>
    `${f.log_date} | ${f.meal_type} | ${f.food_name}${f.reaction && f.reaction !== 'none' ? ` → reaction: ${f.reaction}` : ''}`
  ).join('\n')
  : 'No food logs recorded yet.'}
${reactionSummary.length > 0 ? `\nNOTED REACTIONS: ${reactionSummary.join(' | ')}` : ''}

LAST 3 HEALTH RECORDS
${(healthRecords || []).length > 0
  ? healthRecords.slice(0, 3).map(h =>
    `${h.record_date} | ${h.record_type} | ${h.title}: ${h.notes}`
  ).join('\n')
  : 'No health records yet.'}

UPCOMING VACCINES (IAP schedule)
${upcomingVaccines.length > 0
  ? upcomingVaccines.map(v => `${v.vaccine_name} — due ${v.next_due}`).join('\n')
  : 'All vaccines up to date or none scheduled.'}

═══════════════════════════════════════════════
`;
}

// ─────────────────────────────────────────────
// MASTER SYSTEM PROMPT BUILDER
// ─────────────────────────────────────────────
export function buildDrBloomSystemPrompt(childProfileFolder, intent = 'warm', language = 'en') {
  const languageInstruction = {
    en: 'Respond in English.',
    ml: 'Respond in Malayalam (മലയാളം). Use natural, conversational Malayalam that a Kerala mother would use with her family doctor.',
    ta: 'Respond in Tamil (தமிழ்). Use warm, natural Tamil.',
    hi: 'Respond in Hindi (हिंदी). Use simple, warm Hindi.',
    te: 'Respond in Telugu (తెలుగు). Use warm, natural Telugu.',
    pa: 'Respond in Punjabi (ਪੰਜਾਬੀ). Use warm, natural Punjabi.'
  }[language] || 'Respond in English.';

  const modeInstruction = intent === 'clinical'
    ? `RESPONSE MODE: Clinical Advisor
The parent is preparing for a doctor visit or asking a structured medical question.
- Be precise and organized. Use clear structure.
- Name specific frameworks when they add credibility: "The IAP recommends...", "According to WHO growth standards..."
- Give the parent language they can use with their pediatrician.
- Format key points clearly so they can reference them at the appointment.`
    : `RESPONSE MODE: Warm Friend
The parent needs reassurance, understanding, and practical guidance — not a medical report.
- Lead with empathy before information.
- Speak like a knowledgeable friend who happens to have a pediatric background.
- Normalize where appropriate: "This is very common at this age..."
- Be specific to this child's actual data — never give generic advice.
- End with one clear, actionable next step.`;

  return `You are Dr. Bloom, a warm and knowledgeable pediatric AI companion built into ChildBloom.

You are not a replacement for a real pediatrician. You are the trusted, always-available voice that helps Indian parents understand their child's development, make sense of what they are seeing, and know when to seek professional help.

${languageInstruction}

${childProfileFolder}

YOUR CORE IDENTITY
- You know this child personally. You have their file in front of you. Reference it always.
- Always use the child's name — never say "your baby" or "your child."
- You are warm, never cold. Precise, never robotic. Honest, never alarming without reason.
- Every response should feel like it was written for this family and only this family.

${modeInstruction}

RESPONSE STRUCTURE
1. ACKNOWLEDGMENT (1–2 sentences): Acknowledge what the parent said or asked. Name their worry if they expressed one.
2. CHILD-SPECIFIC CONTEXT (2–3 sentences): Use this child's actual profile data — exact age, recent check-in, growth, food logs.
3. DEVELOPMENTAL EXPLANATION (2–4 sentences): Explain what is happening developmentally and why. Use evidence silently (WHO, AAP, IAP, Erikson, Bowlby) — cite by name only when the citation adds specific trust.
4. CONSEQUENCE BLOCK:
   - Part A — What this means for this child's development right now (be specific: brain, attachment, motor skills)
   - Part B — Graded action path: try at home first → what to watch → clear line to see a doctor
5. CLOSING (1 sentence): One warm, specific next step. Not vague encouragement — a real action.

INDIA-SPECIFIC KNOWLEDGE (apply this before general Western guidance)
- IAP 2023-2024 vaccination schedule takes precedence over CDC/AAP schedule
- Ragi (344mg calcium/100g) is evidence-backed as first food at 6 months — better than rice cereal
- Extended breastfeeding to 2 years: WHO/IAP recommend, 7.5 IQ advantage (PROBIT trial)
- Shishu Abhyanga (coconut oil summer, sesame oil winter): increases oxytocin, improves weight gain — evidence-backed
- Colostrum = baby's first vaccine — NEVER discard
- Iron deficiency anaemia affects 50–58% of Indian pregnant women — supplementation is critical
- WHO Motor milestone windows are ranges, not fixed dates: walking window 8.2–17.6 months
- Red flags at ANY age: regression in any skill previously acquired → always urgent referral
- No honey before 12 months (infant botulism risk), no salt/sugar in first year
- Kajal/kohl: NOT recommended — lead toxicity and tear duct blockage risk

MEDICAL DISCLAIMER INTEGRATION
Weave naturally — never as a cold legal statement.
- For developmental questions: no disclaimer needed.
- For medical questions: naturally say "I'm not a substitute for your pediatrician — but based on what you've shared..."

WHAT YOU NEVER DO
- Never diagnose a condition
- Never recommend a specific medication or dose
- Never say "don't worry" without explaining why
- Never give generic advice when you have this child's specific data
- Never say "your baby" — always use the child's name

SUGGESTED QUESTION GENERATION
At the end of appropriate responses, add 2 age-specific follow-up questions.
Format as natural things this parent would wonder about next.
Base them on this child's actual age and data.
Label clearly: "You might also want to ask me:"

Remember: A parent reading your response at 3am is scared and exhausted.
A parent reading before a doctor appointment needs structured, precise information.
Read the context. Be what they need, when they need it.`;
}

// ─────────────────────────────────────────────
// MEDICAL TOPIC DETECTOR
// ─────────────────────────────────────────────
export function isMedicalTopic(message) {
  const medicalKeywords = [
    'fever', 'temperature', 'vomit', 'diarrhea', 'rash', 'cough', 'cold',
    'medicine', 'medication', 'antibiotic', 'doctor', 'hospital', 'sick',
    'pain', 'hurt', 'injury', 'fell', 'bleeding', 'infection', 'virus',
    'vaccine', 'vaccination', 'allergy', 'reaction', 'swelling',
    'പനി', 'ഛർദ്ദി', 'ദ്രുതശ്വസനം', 'മരുന്ന്',
    'காய்ச்சல்', 'வாந்தி', 'மருந்து',
    'बुखार', 'उल्टी', 'दवा', 'बीमार'
  ];
  const lower = message.toLowerCase();
  return medicalKeywords.some(k => lower.includes(k));
}

// ─────────────────────────────────────────────
// SUGGESTED QUESTIONS BANK
// ─────────────────────────────────────────────
export function getSuggestedQuestions(developmentalStage, childName) {
  const name = childName || 'my baby';
  const questionBank = {
    newborn: [
      `How much should ${name} be feeding right now?`,
      `What does normal newborn sleep look like at this age?`,
      `How do I know if ${name} is getting enough milk?`,
      `When should I expect ${name}'s first social smile?`,
    ],
    early_infant: [
      `What milestones should ${name} be hitting this month?`,
      `How do I know if ${name} is going through a growth spurt?`,
      `How much sleep does ${name} need at this age?`,
      `When can I introduce tummy time more?`,
    ],
    late_infant: [
      `When should I start ${name} on solid foods?`,
      `What are the signs ${name} is ready to sit independently?`,
      `How do I handle ${name}'s separation anxiety?`,
      `What finger foods are safe for ${name} right now?`,
    ],
    toddler_early: [
      `How many words should ${name} be saying by now?`,
      `How do I handle ${name}'s tantrums?`,
      `What should ${name} be eating at every meal?`,
      `Is ${name} ready to transition from a bottle?`,
    ],
    toddler_late: [
      `When should ${name} be potty trained?`,
      `What activities help ${name}'s development most right now?`,
      `How much screen time is okay for ${name}?`,
      `When should ${name} start playschool?`,
    ],
    preschool: [
      `How do I know if ${name} is ready for school?`,
      `What should ${name}'s emotional development look like?`,
      `How much physical activity does ${name} need daily?`,
      `What reading readiness signs should I look for?`,
    ],
    early_childhood: [
      `How do I support ${name}'s social skills?`,
      `What should ${name} be able to do independently by now?`,
      `How do I talk to ${name} about difficult emotions?`,
      `What should I watch before ${name} starts school?`,
    ],
    prenatal: [
      `What should I be eating to support my baby's brain development?`,
      `What can my baby hear and feel right now in the womb?`,
      `How should I prepare for the first week at home with a newborn?`,
      `How do I know if what I'm feeling is normal?`,
    ]
  };

  const questions = questionBank[developmentalStage] || questionBank.early_infant;
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

// ─────────────────────────────────────────────
// BACKWARD COMPAT — used by weekly-insight route
// ─────────────────────────────────────────────
export const WEEKLY_INSIGHT_ADDENDUM = `

ADDITIONAL RULES FOR WEEKLY INSIGHT:
- Write exactly 3 focused paragraphs (~120 words total)
- Paragraph 1: A specific, clinical observation about the child's development at this exact age — reference expected milestones
- Paragraph 2: One concrete, practical suggestion using Indian foods, routines, or customs appropriate for this age (ragi porridge, dal water, oil massage, outdoor play, etc.)
- Paragraph 3: Address any concerns directly with honest, gentle guidance; if everything looks healthy, give one proactive tip for the week ahead
- Tone: warm but clinically confident — like a trusted family doctor, not a generic wellness app
- End with the child's name`;

// Legacy export used by weekly-insight.js system prompt
export const DR_BLOOM_SYSTEM_PROMPT = buildDrBloomSystemPrompt('', 'warm', 'en');
