// MadaDemoPage — self-contained, RTL, Arabic demo of the ChildBloom early-warning flow.
//
// Built for the Mada Innovation Award 2026 submission video (route: /mada-demo).
// Staged + deterministic on purpose: it must record reliably and match
// ARABIC_DEMO_VIDEO_SCRIPT.md exactly. It does NOT touch the live app, auth, or
// the Arabic i18n of the rest of the product — RTL is scoped to the phone frame.
//
// Arabic strings here are the reviewed-PENDING copy from the script appendix;
// a native-Arabic reviewer must confirm before the final recording.

import { useState, useEffect, useRef } from 'react';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Display, Eyebrow, Body, Mono, Stack, HRow, Spacer, Divider, Button } from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';

const STR = {
  appName: 'ChildBloom',
  langPill: 'العربية',
  welcome: 'مرحبًا بك في ChildBloom',
  childName: 'آدم',
  childAge: '١٨ شهرًا',
  viewMilestones: 'عرض مراحل التطوّر',
  milestonesTitle: 'مراحل تطوّر آدم',
  milestonesHint: 'سجّل ما يفعله آدم — لتطمئنّ، ولتلاحظ مبكرًا.',
  statusYes: 'نعم',
  statusNotYet: 'ليس بعد',
  statusUnsure: 'لست متأكّدًا',
  continue: 'متابعة',
  // flag
  flagEyebrow: 'ملاحظة لطيفة',
  flagTitle: 'قد يستحقّ تطوّر لغة آدم بعض المتابعة',
  flagBody: 'بعض الأطفال يصلون إلى هذه المرحلة في وقتٍ لاحق. وبما أنّ الدعم المبكّر مفيدٌ جدًّا، من الجيّد استشارة مختصّ.',
  whatToDo: 'ماذا أفعل الآن؟',
  whatToDoBody: 'تحدّث مع طبيب الأطفال أو أخصائي تطوّر الطفل. الملاحظة المبكّرة قوّة — والدعم المبكّر يساعد الأطفال على الازدهار.',
  askDrBloom: 'اسأل د. بلوم',
  // dr bloom
  drBloomName: 'د. بلوم',
  drBloomSub: 'رفيقك في تطوّر طفلك',
  micHint: 'اضغط للتحدّث',
  listening: 'يستمع…',
  question: 'هل تأخّر النطق عند طفلي في عمر ١٨ شهرًا أمرٌ طبيعي؟',
  disclaimer: 'تشايلد بلوم يقدّم إرشادًا، لا تشخيصًا طبيًّا.',
  restart: 'إعادة التشغيل',
  back: 'السابق',
  next: 'التالي',
};

const ANSWER =
  'في عمر ١٨ شهرًا، يقول كثيرٌ من الأطفال بضع كلمات، لكنّ النطق يتطوّر بوتيرةٍ مختلفة من طفلٍ لآخر.\n\n' +
  'يمكنك دعم لغة آدم بالتحدّث معه كثيرًا، وتسمية الأشياء من حوله، والقراءة له كلّ يوم.\n\n' +
  'وإذا كان لا يقول أيّ كلمات بعد، أو لا يحاول التواصل بالإشارة أو الصوت، فمن الجيّد استشارة طبيب الأطفال أو أخصائي تطوّر الطفل — ليس للقلق، بل لأنّ الدعم المبكّر يُحدث فرقًا كبيرًا.\n\n' +
  'أنا هنا للإرشاد، ولستُ بديلًا عن الطبيب.';

const MILESTONES = [
  { key: 'walks',   label: 'يمشي بمفرده',            preset: 'yes' },
  { key: 'points',  label: 'يشير إلى الأشياء',        preset: 'yes' },
  { key: 'words',   label: 'يقول بضع كلمات مفردة',    preset: null, flag: true },
  { key: 'copies',  label: 'يقلّد التصرّفات والأصوات', preset: 'yes' },
];

const AMBER_BG = '#FBF3E7';

function StatusPicker({ value, onChange }) {
  const opts = [
    { id: 'yes', label: STR.statusYes },
    { id: 'notyet', label: STR.statusNotYet },
    { id: 'unsure', label: STR.statusUnsure },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
      {opts.map(o => {
        const sel = value === o.id;
        const warn = o.id === 'notyet';
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={sel}
            onClick={() => onChange(o.id)}
            style={{
              padding: '9px 4px', borderRadius: 11, minHeight: 42,
              border: sel ? `1.5px solid ${warn ? T.warn : T.brand}` : `0.5px solid ${T.line}`,
              background: sel ? (warn ? AMBER_BG : T.brandWash) : T.surface,
              color: sel ? (warn ? T.warn : T.brand) : T.ink700,
              fontFamily: FONTS.sans, fontSize: 13, fontWeight: sel ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.14s ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PhoneHeader({ onBack }) {
  return (
    <HRow justify="space-between" style={{ padding: '14px 16px 10px' }}>
      <HRow gap={8}>
        {onBack && (
          <button onClick={onBack} aria-label={STR.back}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.ink500, display: 'flex', padding: 0 }}>
            <CBIcon name="chevron-right" size={22} stroke={1.8} />
          </button>
        )}
        <HRow gap={7}>
          <CBLogoMark size={22} color={T.brand} />
          <span style={{ fontFamily: FONTS.serif, fontSize: 16, fontStyle: 'italic', color: T.ink900 }}>{STR.appName}</span>
        </HRow>
      </HRow>
      <span style={{
        fontFamily: FONTS.sans, fontSize: 11, fontWeight: 600, color: T.brand,
        background: T.brandWash, borderRadius: 999, padding: '4px 10px',
      }}>{STR.langPill}</span>
    </HRow>
  );
}

// ── Step screens ───────────────────────────────────────────────

function HomeScreen({ onNext }) {
  return (
    <Stack gap={16} style={{ padding: '6px 16px 16px' }}>
      <Eyebrow color={T.brand}>{STR.welcome}</Eyebrow>
      <Card p={18} tone="warm">
        <HRow gap={14}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: T.brandTint,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONTS.serif, fontSize: 24, color: T.brand }}>آ</span>
          </div>
          <div>
            <Display size={22} italic>{STR.childName}</Display>
            <Body size={13} color={T.ink500}>{STR.childAge}</Body>
          </div>
        </HRow>
      </Card>
      <Body size={13} color={T.ink500} style={{ textAlign: 'center' }}>{STR.milestonesHint}</Body>
      <Button full size="lg" trailingIcon="chevron-left" onClick={onNext}>{STR.viewMilestones}</Button>
    </Stack>
  );
}

function MilestonesScreen({ statuses, setStatuses, onNext }) {
  const flagged = statuses.words === 'notyet';
  return (
    <Stack gap={12} style={{ padding: '6px 16px 16px' }}>
      <Display size={20} italic>{STR.milestonesTitle}</Display>
      <Body size={12.5} color={T.ink500}>{STR.milestonesHint}</Body>
      <Spacer h={2} />
      {MILESTONES.map(m => (
        <Card key={m.key} p={14} style={m.flag ? { boxShadow: `0 0 0 1.5px ${T.brandWash}, var(--shadow-md)` } : undefined}>
          <Body size={14.5} weight={600} color={T.ink900}>{m.label}</Body>
          <StatusPicker
            value={statuses[m.key]}
            onChange={(v) => setStatuses(s => ({ ...s, [m.key]: v }))}
          />
        </Card>
      ))}
      <Spacer h={2} />
      <Button full size="lg" disabled={!statuses.words} trailingIcon="chevron-left" onClick={onNext}>
        {STR.continue}
      </Button>
      {flagged && (
        <Body size={11.5} color={T.warn} style={{ textAlign: 'center' }}>•</Body>
      )}
    </Stack>
  );
}

function FlagScreen({ onAsk }) {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={14} style={{ padding: '6px 16px 16px' }}>
      <Card p={18} style={{ background: AMBER_BG, boxShadow: `0 0 0 1px ${T.warn}33, var(--shadow-md)` }}>
        <HRow gap={8} align="center">
          <CBIcon name="info" size={18} stroke={1.9} style={{ color: T.warn }} />
          <Eyebrow color={T.warn}>{STR.flagEyebrow}</Eyebrow>
        </HRow>
        <Spacer h={10} />
        <Body size={16} weight={700} color={T.ink900} lh={1.4}>{STR.flagTitle}</Body>
        <Spacer h={8} />
        <Body size={13.5} color={T.ink700} lh={1.6}>{STR.flagBody}</Body>
      </Card>

      <Card p={0} onClick={() => setOpen(o => !o)}>
        <HRow justify="space-between" style={{ padding: 16 }}>
          <Body size={14} weight={600} color={T.brand}>{STR.whatToDo}</Body>
          <CBIcon name={open ? 'chevron-down' : 'chevron-left'} size={18} stroke={1.8} style={{ color: T.brand }} />
        </HRow>
        {open && (
          <div style={{ padding: '0 16px 16px' }}>
            <Divider style={{ marginBottom: 12 }} />
            <Body size={13.5} color={T.ink700} lh={1.6}>{STR.whatToDoBody}</Body>
          </div>
        )}
      </Card>

      <Button full size="lg" icon="chat" onClick={onAsk}>{STR.askDrBloom}</Button>
    </Stack>
  );
}

function DrBloomScreen() {
  const [listening, setListening] = useState(false);
  const [asked, setAsked] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const timer = useRef(null);

  function handleMic() {
    if (asked) return;
    setListening(true);
    setTimeout(() => { setListening(false); setAsked(true); }, 1300);
  }

  useEffect(() => {
    if (!asked) return;
    setRevealed(0);
    timer.current = setInterval(() => {
      setRevealed(r => {
        if (r >= ANSWER.length) { clearInterval(timer.current); return r; }
        return r + 2;
      });
    }, 26);
    return () => clearInterval(timer.current);
  }, [asked]);

  const done = revealed >= ANSWER.length;

  return (
    <Stack gap={0} style={{ padding: '6px 16px 12px', minHeight: 420 }}>
      <HRow gap={10} style={{ paddingBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999, background: T.brandTint,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CBIcon name="bloom" size={22} stroke={1.7} style={{ color: T.brand }} />
        </div>
        <div>
          <Body size={15} weight={700} color={T.ink900}>{STR.drBloomName}</Body>
          <Body size={12} color={T.ink400}>{STR.drBloomSub}</Body>
        </div>
      </HRow>
      <Divider />
      <Spacer h={14} />

      <Stack gap={12} style={{ flex: 1 }}>
        {asked && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: T.brand, color: '#fff', borderRadius: '18px 18px 18px 6px',
              padding: '11px 14px', fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.5,
            }}>{STR.question}</div>
          </div>
        )}

        {asked && (
          <div style={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
            <div style={{
              background: T.surfaceDim, color: T.ink900, borderRadius: '18px 18px 6px 18px',
              padding: '12px 15px', fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {ANSWER.slice(0, revealed)}
              {!done && <span style={{ opacity: 0.5 }}>▍</span>}
            </div>
          </div>
        )}
      </Stack>

      <Spacer h={12} />
      {!asked && (
        <Stack gap={10} align="center" style={{ paddingBottom: 6 }}>
          <button
            onClick={handleMic}
            aria-label={STR.micHint}
            style={{
              width: 66, height: 66, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: listening ? T.brand : T.brandWash, color: listening ? '#fff' : T.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: listening ? `0 0 0 8px ${T.brand}22` : 'none',
              transition: 'all 0.2s ease', animation: listening ? 'cb-pulse-dot 1.1s ease-in-out infinite' : 'none',
            }}>
            <CBIcon name="mic" size={28} stroke={1.7} />
          </button>
          <Body size={12.5} color={listening ? T.brand : T.ink400}>{listening ? STR.listening : STR.micHint}</Body>
        </Stack>
      )}

      <Spacer h={8} />
      <HRow gap={6} justify="center" style={{ opacity: 0.7 }}>
        <CBIcon name="shield" size={12} stroke={1.8} style={{ color: T.ink400 }} />
        <Mono size={10.5} color={T.ink400}>{STR.disclaimer}</Mono>
      </HRow>
    </Stack>
  );
}

// ── Page shell ─────────────────────────────────────────────────

export default function MadaDemoPage() {
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState({ walks: 'yes', points: 'yes', words: null, copies: 'yes' });

  const screens = [
    <HomeScreen key="home" onNext={() => setStep(1)} />,
    <MilestonesScreen key="ms" statuses={statuses} setStatuses={setStatuses} onNext={() => setStep(2)} />,
    <FlagScreen key="flag" onAsk={() => setStep(3)} />,
    <DrBloomScreen key="dr" />,
  ];

  return (
    <div style={{
      minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px', gap: 16,
    }}>
      {/* Phone frame — RTL scoped here only */}
      <div
        dir="rtl"
        lang="ar"
        style={{
          width: '100%', maxWidth: 390, background: T.surface,
          borderRadius: 36, overflow: 'hidden', position: 'relative',
          boxShadow: '0 24px 70px rgba(11,23,20,0.20), 0 0 0 1px rgba(11,23,20,0.05)',
          border: `7px solid ${T.ink900}`, minHeight: 680,
        }}
      >
        <div style={{ background: T.bg, minHeight: 666 }}>
          <PhoneHeader onBack={step > 0 ? () => setStep(s => Math.max(0, s - 1)) : null} />
          <div key={step} style={{ animation: 'fade-in 0.35s ease' }}>
            {screens[step]}
          </div>
        </div>
      </div>

      {/* Recording controls — LTR, outside the app frame */}
      <div dir="ltr" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
          {STR.back}
        </Button>
        <Mono size={11} color={T.ink400}>{step + 1} / {screens.length}</Mono>
        {step < screens.length - 1 ? (
          <Button size="sm" onClick={() => setStep(s => Math.min(screens.length - 1, s + 1))}>{STR.next}</Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => { setStep(0); setStatuses({ walks: 'yes', points: 'yes', words: null, copies: 'yes' }); }}>
            {STR.restart}
          </Button>
        )}
      </div>
      <Mono size={10} color={T.ink300}>ChildBloom · Mada Innovation Award demo · العربية / RTL</Mono>
    </div>
  );
}
