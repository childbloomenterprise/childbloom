// "Is this normal?" — myth-buster preset bank.
//
// The 10 most common pieces of Indian family/elder baby advice, each with an
// AUDITED, evidence-based verdict (IAP/AAP/WHO). These are served instantly,
// client-side, with NO AI call — so they're always free and never rate-limited.
// The free-text box (api/myth-check.js) handles anything not listed here.
//
// verdict: 'safe' | 'caution' | 'avoid'
// i18nKey maps to retention.<lang>.json → myths.presets.<key> for translated copy.
// The English `reason` / `alternative` here are the source of truth and the
// fallback if a translation is missing.

export const VERDICTS = {
  safe:    { tone: '#1E7A55', bg: 'rgba(30,122,85,0.10)',  emoji: '✅' },
  caution: { tone: '#B45309', bg: 'rgba(180,83,9,0.10)',   emoji: '⚠️' },
  avoid:   { tone: '#C0392B', bg: 'rgba(192,57,43,0.10)',  emoji: '❌' },
};

export const MYTH_PRESETS = [
  {
    key: 'kajal',
    advice: 'Put kajal/kohl on the baby\'s eyes',
    verdict: 'avoid',
    reason: 'Traditional kajal often contains lead, which is toxic to a baby\'s developing brain, and it can block the tear ducts and cause eye infections.',
    alternative: 'Skip the kajal. If you love the ritual, a tiny kajal dot behind the ear or on the foot — away from the eyes — keeps the custom without the risk.',
  },
  {
    key: 'honey',
    advice: 'Give honey to a baby under 1 year',
    verdict: 'avoid',
    reason: 'Honey can carry spores that cause infant botulism, a serious illness, in babies under 12 months whose gut can\'t yet handle them.',
    alternative: 'Wait until after the first birthday. For a fussy or constipated baby, ask your doctor — never use honey as a remedy before 12 months.',
  },
  {
    key: 'headShaving',
    advice: 'Shave the baby\'s head to make hair grow thicker',
    verdict: 'caution',
    reason: 'Shaving (mundan) is a personal/cultural choice and doesn\'t change how thick or fast hair grows — that\'s set by genetics. The blade and a nicked scalp are the only real risks.',
    alternative: 'If you do a mundan for tradition, use a clean blade and a gentle hand. Expecting thicker hair from it, though, is a myth.',
  },
  {
    key: 'gripeWater',
    advice: 'Give gripe water for colic and gas',
    verdict: 'caution',
    reason: 'Gripe water isn\'t regulated, has no strong evidence for colic, and some brands contain alcohol, sugar or sodium bicarbonate that a young baby doesn\'t need.',
    alternative: 'For gas, try paced feeding, burping mid-feed, and gentle tummy/bicycle-leg massage. If colic is severe, see your pediatrician.',
  },
  {
    key: 'turmeric',
    advice: 'Apply raw turmeric or ubtan on the baby\'s skin',
    verdict: 'caution',
    reason: 'A newborn\'s skin is thin and easily irritated; raw turmeric and some ubtan ingredients can cause rashes or allergic reactions.',
    alternative: 'Plain warm water and a mild baby cleanser are enough. Patch-test anything herbal first, and stop at any redness.',
  },
  {
    key: 'teethingBangle',
    advice: 'Use an amber/teething bangle or necklace for teething pain',
    verdict: 'avoid',
    reason: 'There\'s no evidence these relieve teething pain, and a cord or beads around a baby are a real choking and strangulation hazard.',
    alternative: 'Offer a clean chilled (not frozen) teether or a clean finger to gum. Never tie anything around a baby\'s neck.',
  },
  {
    key: 'cowMilk',
    advice: 'Give cow\'s milk as the main drink before 1 year',
    verdict: 'avoid',
    reason: 'Cow\'s milk before 12 months is hard on the kidneys, low in iron, and can cause tiny gut bleeds and iron-deficiency anaemia.',
    alternative: 'Breastmilk or formula stays the main milk until the first birthday. Small amounts of curd/paneer in food after 6 months are fine.',
  },
  {
    key: 'oilInEars',
    advice: 'Put oil in the baby\'s ears or nose',
    verdict: 'avoid',
    reason: 'Oil in the ears can trap wax, irritate the canal and hide an infection; oil in the nose can be breathed into the lungs.',
    alternative: 'Leave ears and nose alone — they clean themselves. For a blocked nose, saline drops and a gentle wipe are enough.',
  },
  {
    key: 'earlySolids',
    advice: 'Start solid foods before 6 months',
    verdict: 'avoid',
    reason: 'Before about 6 months a baby\'s gut and swallowing aren\'t ready; early solids raise the risk of choking, infections and displacing nutrient-rich milk.',
    alternative: 'Exclusive breastfeeding (or formula) until 6 months, then start with ragi, dal water and mashed foods — one new food every few days.',
  },
  {
    key: 'earlyWater',
    advice: 'Give water to a baby under 6 months',
    verdict: 'avoid',
    reason: 'Extra water before 6 months can fill a tiny tummy, reduce milk intake, and in excess dangerously dilute the baby\'s sodium.',
    alternative: 'Breastmilk and formula are ~88% water and give all the hydration needed — even in hot weather. Start water with solids around 6 months.',
  },
];

export function getPreset(key) {
  return MYTH_PRESETS.find((p) => p.key === key) || null;
}
