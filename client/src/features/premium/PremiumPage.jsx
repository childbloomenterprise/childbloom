import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { usePremium } from '../../hooks/usePremium';
import { track } from '../../lib/analytics';
import {
  PREMIUM_PRICE_INR,
  PREMIUM_BENEFITS,
  buildUpiUrl,
  buildProofEmailUrl,
} from '../../lib/premiumConfig';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Display, Eyebrow, Body, Spacer, Stack, HRow, Divider, BloomFlower,
} from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';

export default function PremiumPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { isPremium, premiumUntil } = usePremium();

  useEffect(() => { track('premium_page_viewed'); }, []);

  const email = user?.email;
  const upiUrl = buildUpiUrl();
  const proofUrl = buildProofEmailUrl(email);

  if (isPremium) {
    return (
      <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 64 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
          <Display size={26} italic weight={400}>You're Premium</Display>
          <Spacer h={8} />
          <Body size={14} color={T.ink500}>
            Thank you for supporting ChildBloom.
            {premiumUntil && (
              <> Active until{' '}
                <strong style={{ color: T.ink900 }}>
                  {premiumUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>.
              </>
            )}
          </Body>
          <Spacer h={24} />
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px', borderRadius: 999, border: 'none',
              background: T.brand, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: FONTS.sans, paddingTop: 52 }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 16px 40px' }}>

        {/* Header */}
        <div style={{ padding: '4px 4px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, borderRadius: 999, border: 'none',
              background: T.surfaceDim, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink500 }}
          >
            <CBIcon name="chevron-left" size={18} stroke={1.8} />
          </button>
          <Display size={22} italic weight={400}>Premium</Display>
        </div>

        {/* Price hero */}
        <Card p={20} tone="warm" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.2, pointerEvents: 'none' }}>
            <BloomFlower size={160} />
          </div>
          <Eyebrow color={T.gold}>ChildBloom Premium</Eyebrow>
          <Spacer h={8} />
          <div style={{ fontFamily: FONTS.serif, fontSize: 42, color: T.ink900, fontStyle: 'italic', lineHeight: 1 }}>
            ₹{PREMIUM_PRICE_INR}
          </div>
          <Body size={13} color={T.ink400}>per month · cancel anytime</Body>
          <Spacer h={4} />
          <Body size={12} color={T.ink400}>Everything unlocked for your child.</Body>
        </Card>

        <Spacer h={16} />

        {/* Benefits */}
        <Card p={16}>
          {PREMIUM_BENEFITS.map((b, i) => (
            <div key={b}>
              <HRow gap={10} align="center" style={{ padding: '10px 0' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 999, background: T.brandTint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CBIcon name="check" size={14} stroke={2.5} style={{ color: T.brand }} />
                </div>
                <Body size={14} color={T.ink900}>{b}</Body>
              </HRow>
              {i < PREMIUM_BENEFITS.length - 1 && <Divider />}
            </div>
          ))}
        </Card>

        <Spacer h={20} />

        {/* Step 1 */}
        <Body size={12} color={T.ink400} style={{ marginBottom: 8, paddingLeft: 4 }}>STEP 1 — PAY</Body>
        <Card p={18}>
          <Body size={14} weight={600} color={T.ink900}>Pay ₹{PREMIUM_PRICE_INR} via UPI</Body>
          <Spacer h={4} />
          <Body size={13} color={T.ink500}>
            UPI ID: <strong style={{ color: T.ink900, userSelect: 'all' }}>vaibhavvarunmr@okicici</strong>
          </Body>
          <Spacer h={14} />
          <a
            href={upiUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 999, textDecoration: 'none',
              background: T.brand, color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: FONTS.sans, boxShadow: '0 3px 12px rgba(15,61,46,0.30)',
            }}
          >
            <CBIcon name="smartphone" size={18} stroke={1.8} />
            Open UPI app (GPay / PhonePe)
          </a>
          <Spacer h={8} />
          <Body size={11} color={T.ink400} style={{ textAlign: 'center' }}>
            Tap to open your UPI app with amount pre-filled
          </Body>
        </Card>

        <Spacer h={16} />

        {/* Step 2 */}
        <Body size={12} color={T.ink400} style={{ marginBottom: 8, paddingLeft: 4 }}>STEP 2 — SEND PROOF</Body>
        <Card p={18}>
          <Body size={14} weight={600} color={T.ink900}>Email us your payment screenshot</Body>
          <Spacer h={4} />
          <Body size={13} color={T.ink500}>
            After paying, email the screenshot to{' '}
            <strong style={{ color: T.ink900 }}>childbloomenterprise@gmail.com</strong>.
            We activate Premium within a few hours.
          </Body>
          <Spacer h={14} />
          <a
            href={proofUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 999, textDecoration: 'none',
              background: '#1D9E75', color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: FONTS.sans,
            }}
          >
            <CBIcon name="mail" size={18} stroke={1.8} />
            I've paid — email proof
          </a>
        </Card>

        <Spacer h={16} />
        <Body size={11} color={T.ink300} style={{ textAlign: 'center', padding: '0 16px' }}>
          Manual activation during early access. No auto-renewal — Premium expires unless you renew.
        </Body>
        <Spacer h={8} />
        <div style={{ textAlign: 'center', fontSize: 11 }}>
          <a
            onClick={() => navigate('/refund')}
            style={{ color: T.ink400, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Refund &amp; cancellation policy
          </a>
          <span style={{ color: T.ink300 }}>{'  ·  '}</span>
          <a
            onClick={() => navigate('/terms')}
            style={{ color: T.ink400, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Terms
          </a>
        </div>

      </div>
    </div>
  );
}
