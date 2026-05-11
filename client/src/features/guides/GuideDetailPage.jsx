import { useParams, useNavigate } from 'react-router-dom';
import CBIcon from '../../components/cb/CBIcon';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, Divider, ChromeBtn,
} from '../../components/cb/primitives';
import { GUIDE_STAGES } from '../../lib/constants';

const STAGE_ICONS = {
  pregnancy:         'heart',
  newborn:           'leaf',
  infant:            'sparkle',
  toddler:           'sun',
  preschool:         'book',
  'early-childhood': 'chart',
};

const GUIDE_CONTENT = {
  pregnancy: {
    sections: [
      { title: 'Nourishing you and your baby', items: ['Eat iron-rich foods like spinach, jaggery, and dates', 'Include protein through dal, paneer, eggs, and fish', 'Take folic acid and iron supplements as prescribed', 'Stay hydrated — aim for 8-10 glasses of water daily', 'Limit caffeine to one cup of tea/coffee per day'] },
      { title: 'Connecting before birth', items: ['Talk and sing to your baby — they can hear from week 18', 'Play soft music or recite shlokas/prayers if culturally meaningful', 'Gentle belly massage with coconut or almond oil', 'Practice prenatal yoga or deep breathing (Pranayama)'] },
      { title: 'What to keep an eye on', items: ['Attend all antenatal checkups on schedule', 'Report any bleeding, severe headache, or swelling immediately', "Monitor baby's kicks from week 28 — aim for 10 kicks in 2 hours", 'Get the Tdap vaccine between weeks 27-36'] },
    ],
  },
  newborn: {
    sections: [
      { title: 'Feeding in the first weeks', items: ['Breastfeed exclusively — no water needed before 6 months', 'Feed on demand, typically 8-12 times per day', 'Burp baby after every feed', 'Watch for a good latch — no pain, audible swallowing'] },
      { title: 'Sleep and comfort', items: ["Newborns sleep 14-17 hours in short stretches", "Always place baby on their back to sleep", "Room-share but don't bed-share for safety", 'Swaddling can help with the startle reflex'] },
      { title: "What you'll notice", items: ['Focuses on faces within 8-12 inches', 'Responds to loud sounds', 'Lifts head briefly during tummy time', "Recognises mother's voice and smell"] },
      { title: 'Health to take care of', items: ['BCG vaccine at birth', 'OPV and Hepatitis B within 24 hours', 'Keep umbilical stump clean and dry', 'First paediatrician visit within 48 hours of discharge'] },
    ],
  },
  infant: {
    sections: [
      { title: 'Feeding from 3-12 months', items: ['Continue breastfeeding alongside solids from 6 months', 'Start with single-ingredient purees: rice cereal, dal water, mashed banana', 'Introduce one new food every 3 days to spot allergies', 'By 9 months, try soft finger foods like idli pieces, roti strips', 'Avoid honey before age 1, and limit salt and sugar'] },
      { title: 'Moving and exploring', items: ['3-4 months: Rolls over, holds head steady', '5-6 months: Sits with support, reaches for objects', '7-8 months: Crawls, transfers objects between hands', '9-12 months: Pulls to stand, cruises along furniture, first steps'] },
      { title: 'Talking and connecting', items: ['Babbles consonant sounds (ba-ba, da-da) by 6 months', 'Responds to own name by 7-9 months', 'Waves bye-bye, plays peek-a-boo', 'Says first meaningful word around 12 months'] },
      { title: 'Vaccinations (IAP schedule)', items: ['6 weeks: DTwP/DTaP, IPV, Hib, Rotavirus, PCV', '10 weeks: Second dose of above', '14 weeks: Third dose of above', '6 months: OPV, Influenza vaccine', '9 months: MMR first dose'] },
    ],
  },
  toddler: {
    sections: [
      { title: 'Language is exploding', items: ['12-18 months: 10-50 words, points at objects', '18-24 months: Two-word phrases ("more milk", "go park")', '2-3 years: Short sentences, 200+ words', 'Read aloud daily — picture books in any language help', 'Narrate daily activities to build vocabulary'] },
      { title: 'What to feed a toddler', items: ['Offer family foods cut into small pieces', 'Include roti, rice, dal, vegetables, curd, and fruits daily', 'Serve whole milk and ghee — toddlers need healthy fats', 'Allow self-feeding even if messy — it builds motor skills', "Don't force-feed; trust their appetite"] },
      { title: 'Big feelings, small person', items: ['Tantrums are normal — stay calm, validate feelings', 'Set simple, consistent limits', 'Praise effort, not just results', 'Encourage play with other children', 'Start simple chores: putting toys away, wiping spills'] },
      { title: 'Health checks coming up', items: ['15-18 months: MMR 2nd dose, Varicella', 'Annual dental checkup from age 1', 'Check vision and hearing if concerns arise', 'Deworm every 6 months as per IAP guidelines'] },
    ],
  },
  preschool: {
    sections: [
      { title: 'Getting ready for school', items: ['Practice holding crayons and pencils (tripod grip by age 4)', 'Learn to recognise own name in writing', 'Count objects up to 10-20', 'Identify basic colours and shapes', 'Practice sitting and focusing for 10-15 minutes'] },
      { title: 'Making friends and feelings', items: ['Takes turns in games and conversations', 'Makes friends and shows empathy', 'Understands rules of simple games', 'Expresses feelings with words instead of hitting', 'Separates from parents without excessive distress'] },
      { title: 'Growing stronger', items: ['Runs, jumps, and climbs confidently', 'Catches a ball, rides a tricycle', 'Draws circles, crosses, and simple figures', 'Dresses and undresses with minimal help', 'Uses toilet independently'] },
      { title: 'Play and learning', items: ['Pretend play develops creativity and language', 'Building blocks boost spatial reasoning', 'Outdoor play for at least 1 hour daily', 'Limit screen time to under 1 hour of quality content', 'Arts and crafts develop fine motor skills'] },
    ],
  },
  'early-childhood': {
    sections: [
      { title: 'Reading and thinking', items: ['Read independently for short periods', 'Write simple words and sentences', 'Understand basic addition and subtraction', 'Follow multi-step instructions', 'Ask "why" questions and engage in discussions'] },
      { title: 'Kindness and character', items: ['Understands right from wrong in familiar situations', 'Shows concern for others who are hurt or sad', 'Can manage frustration with guidance', 'Develops a sense of fairness', 'Enjoys helping with household tasks'] },
      { title: 'Doing things themselves', items: ['Bathes and dresses with minimal help', 'Packs and organises own school bag', 'Follows a morning/bedtime routine', 'Makes simple choices (what to wear, which book)', 'Handles basic safety rules (crossing roads, stranger awareness)'] },
      { title: 'Staying healthy', items: ['Balanced meals with all food groups', 'Encourage drinking water over sugary drinks', 'Ensure 9-11 hours of sleep per night', '1 hour of active play daily', 'Annual health and vision checkup'] },
    ],
  },
};

export default function GuideDetailPage() {
  const { stage } = useParams();
  const navigate = useNavigate();

  const stageInfo = GUIDE_STAGES.find(s => s.slug === stage);
  const content = GUIDE_CONTENT[stage];
  const icon = STAGE_ICONS[stage] || 'book';

  if (!stageInfo || !content) {
    return (
      <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', fontFamily: FONTS.sans }}>
        <Stack gap={16} align="center">
          <Body size={14} color={T.ink300}>Guide not found.</Body>
          <Button variant="primary" onClick={() => navigate('/guides')}>Back to guides</Button>
        </Stack>
      </div>
    );
  }

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans }}>

      {/* Back header */}
      <div style={{ paddingTop: 16, padding: '16px 12px 0' }}>
        <button onClick={() => navigate('/guides')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: T.brand, fontSize: 14, fontWeight: 600, padding: '6px 8px', fontFamily: FONTS.sans }}>
          <CBIcon name="chevron-left" size={18} stroke={2.2} />
          Development Guides
        </button>
      </div>

      {/* Title block */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: RADIUS.md, background: T.brandWash, color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CBIcon name={icon} size={24} stroke={1.7} />
        </div>
        <div>
          <Eyebrow color={T.brand}>{stageInfo.ageRange}</Eyebrow>
          <Spacer h={3} />
          <Display size={30} italic weight={600} lh={1.08}>{stageInfo.title}</Display>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <Body size={14} color={T.ink500} lh={1.5}>{stageInfo.description}</Body>
      </div>

      {/* Content sections */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.sections.map(section => (
          <Card key={section.title} p={16}>
            <Body size={13} color={T.brand} weight={700} style={{ marginBottom: 12 }}>{section.title}</Body>
            <Stack gap={9}>
              {section.items.map((item, i) => (
                <HRow key={i} gap={10} align="flex-start">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.brandSoft, flexShrink: 0, marginTop: 6 }} />
                  <Body size={13} color={T.ink700} lh={1.5}>{item}</Body>
                </HRow>
              ))}
            </Stack>
          </Card>
        ))}
      </div>

      <Spacer h={16} />

      {/* Disclaimer */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ background: T.surfaceDim, border: `1px solid ${T.line}`, borderRadius: RADIUS.md, padding: '12px 14px', textAlign: 'center' }}>
          <Body size={11} color={T.ink300} lh={1.5}>
            Based on WHO and IAP (Indian Academy of Pediatrics) guidelines.
            Every child develops at their own pace — your paediatrician knows your child best.
          </Body>
        </div>
      </div>
    </div>
  );
}
