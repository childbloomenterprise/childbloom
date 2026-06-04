// "Is this normal?" — elder-advice myth-buster.
//
// Solves the #1 Indian-parent pain: conflicting advice from relatives. Tap a
// common example for an instant audited verdict (free, no AI), or type your own
// (AI, 3 free/week). Color-coded Safe / Caution / Avoid + reason + safer swap.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import api from '../../lib/api';
import { track } from '../../lib/analytics';
import { useSelectedChild } from '../../hooks/useChild';
import { usePremium } from '../../hooks/usePremium';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Display, Eyebrow, Body, Spacer, Button } from '../../components/cb/primitives';
import { MYTH_PRESETS, VERDICTS, getPreset } from './presets';

const MAX_CHARS = 300;

function VerdictCard({ result, t }) {
  const v = VERDICTS[result.verdict] || VERDICTS.caution;
  const label = t(`myths.verdict.${result.verdict}`, result.verdict.toUpperCase());
  return (
    <Card p={20} className="bloom-card-in" style={{ background: v.bg, border: `0.5px solid ${v.tone}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{v.emoji}</span>
        <span style={{
          fontFamily: FONTS.sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: v.tone,
        }}>{label}</span>
      </div>
      {result.advice && (
        <>
          <Spacer h={10} />
          <Body size={14} color={T.ink900} weight={600} lh={1.4}>"{result.advice}"</Body>
        </>
      )}
      <Spacer h={10} />
      <Body size={13} color={T.ink700} lh={1.55}>{result.reason}</Body>
      {result.safer_alternative && (
        <>
          <Spacer h={12} />
          <Eyebrow color={T.brand}>{t('myths.saferLabel', 'Safer instead')}</Eyebrow>
          <Spacer h={3} />
          <Body size={13} color={T.ink700} lh={1.55}>{result.safer_alternative}</Body>
        </>
      )}
    </Card>
  );
}

export default function MythsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const child = useSelectedChild();
  const { isPremium } = usePremium();
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const [advice, setAdvice] = useState('');
  const [result, setResult] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Preset tap → instant audited verdict, no network, always free.
  const handlePreset = (key) => {
    const p = getPreset(key);
    if (!p) return;
    setShowUpgrade(false);
    setResult({
      verdict: p.verdict,
      advice: t(`myths.presets.${key}.advice`, p.advice),
      reason: t(`myths.presets.${key}.reason`, p.reason),
      safer_alternative: t(`myths.presets.${key}.alternative`, p.alternative),
    });
    track('myth_check_run', { verdict: p.verdict, was_preset: true });
  };

  const checkMutation = useMutation({
    mutationFn: async () => {
      // api unwraps response.data → { verdict, reason, safer_alternative }
      return api.post('/api/myth-check', {
        advice: advice.trim(),
        childAgeDays: ageInDays,
        language: i18n.language,
      });
    },
    onSuccess: (data) => {
      setShowUpgrade(false);
      setResult({ ...data, advice: advice.trim() });
      // server fires the authoritative myth_check_run event for free-text
    },
    onError: (err) => {
      if (err?.response?.status === 402 || /free .*checks/i.test(err?.message || '')) {
        setShowUpgrade(true);
      }
    },
  });

  // axios interceptor rejects with a plain Error, losing status — detect 402 via message too.
  const onCheck = () => {
    if (advice.trim().length < 2) return;
    setResult(null);
    setShowUpgrade(false);
    checkMutation.mutate();
  };

  return (
    <div data-theme-root style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingBottom: 40 }}>
      <div style={{ padding: '56px 20px 0' }}>
        <Eyebrow color={T.brand}>{t('myths.eyebrow', 'Is this normal?')}</Eyebrow>
        <Spacer h={6} />
        <Display size={26} italic weight={500}>{t('myths.title', 'Check the advice you were given')}</Display>
        <Spacer h={6} />
        <Body size={13} color={T.ink500} lh={1.5}>
          {t('myths.subtitle', 'Heard something from a relative? Get a calm, evidence-based answer.')}
        </Body>
      </div>

      {/* Free-text input */}
      <div style={{ padding: '20px 16px 0' }}>
        <Card p={16}>
          <textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value.slice(0, MAX_CHARS))}
            placeholder={t('myths.placeholder', 'e.g. My mother-in-law says I should...')}
            rows={3}
            aria-label={t('myths.inputAria', 'What advice did you get?')}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontFamily: FONTS.sans, fontSize: 15, color: T.ink900, background: 'transparent',
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Body size={11} color={T.ink300}>{advice.length}/{MAX_CHARS}</Body>
            <Button
              size="sm"
              onClick={onCheck}
              disabled={checkMutation.isPending || advice.trim().length < 2}
            >
              {checkMutation.isPending ? t('myths.checking', 'Checking…') : t('myths.check', 'Check it')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Upgrade banner on 402 */}
      {showUpgrade && (
        <div style={{ padding: '14px 16px 0' }}>
          <Card p={16} style={{ background: T.brandWash, border: `0.5px solid ${T.brandSoft}40` }}>
            <Body size={13} color={T.ink900} weight={600}>
              {t('myths.upgradeTitle', 'You\'ve used your 3 free checks this week')}
            </Body>
            <Spacer h={4} />
            <Body size={12} color={T.ink500} lh={1.5}>
              {t('myths.upgradeBody', 'Preset examples stay free forever. Upgrade for unlimited free-text checks.')}
            </Body>
            <Spacer h={12} />
            <Button size="sm" onClick={() => navigate('/premium')}>{t('myths.upgradeCta', 'See Premium')}</Button>
          </Card>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ padding: '14px 16px 0' }}>
          <VerdictCard result={result} t={t} />
        </div>
      )}

      {/* Common examples */}
      <div style={{ padding: '24px 16px 0' }}>
        <Eyebrow color={T.ink400}>{t('myths.commonLabel', 'Common ones — tap for an instant answer')}</Eyebrow>
        <Spacer h={12} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MYTH_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              style={{
                padding: '10px 14px', borderRadius: RADIUS.pill,
                border: `0.5px solid ${T.line}`, background: T.surface,
                fontFamily: FONTS.sans, fontSize: 13, color: T.ink700, cursor: 'pointer',
                textAlign: 'left', lineHeight: 1.3, transition: 'transform 0.12s ease',
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = '')}
              onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              {t(`myths.presets.${p.key}.advice`, p.advice)}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '24px 20px 0' }}>
        <Body size={11} color={T.ink400} lh={1.5}>
          {t('myths.disclaimer', 'Dr. Bloom offers general guidance, not a diagnosis. For anything about your child\'s health, your pediatrician is the right person to ask.')}
        </Body>
      </div>
    </div>
  );
}
