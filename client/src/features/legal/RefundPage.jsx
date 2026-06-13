import { Link } from 'react-router-dom';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Display, Eyebrow, Body, Mono, Stack, HRow, Spacer } from '../../components/cb/primitives';
import PageSEO from '../../components/seo/PageSEO';

const SUPPORT_EMAIL = 'childbloomenterprise@gmail.com';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <Body size={16} color={T.brand} weight={700} style={{ marginBottom: 10, fontFamily: FONTS.serif, fontStyle: 'italic' }}>{title}</Body>
      <Stack gap={8}>
        {children}
      </Stack>
    </div>
  );
}

function Bullets({ items }) {
  return (
    <Stack gap={6} style={{ paddingLeft: 16 }}>
      {items.map((item, i) => (
        <HRow key={i} gap={8} align="flex-start">
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand, flexShrink: 0, marginTop: 7 }} />
          <Body size={13} color={T.ink700} lh={1.5}>{item}</Body>
        </HRow>
      ))}
    </Stack>
  );
}

export default function RefundPage() {
  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>
      <PageSEO
        title="Refund & Cancellation Policy — ChildBloom"
        description="ChildBloom's refund and cancellation policy for Premium. Cancel anytime; request a full refund within 7 days of payment by email."
        canonical="/refund"
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' }}>
            <CBLogoMark size={32} color={T.brand} />
            <span style={{ fontFamily: FONTS.serif, fontSize: 20, fontStyle: 'italic', color: T.ink900 }}>ChildBloom</span>
          </Link>
          <Display size={28} italic weight={400} lh={1.1}>Refund &amp; Cancellation Policy</Display>
          <Spacer h={6} />
          <Mono size={12} color={T.ink400}>Last updated: June 2026</Mono>
        </div>

        {/* The promise — pinned up top */}
        <Card p={20} style={{ marginBottom: 16, background: '#EAF3EE', border: `1px solid ${T.brand}` }}>
          <Eyebrow color={T.brand}>In short</Eyebrow>
          <Spacer h={8} />
          <Body size={13} color={T.ink900} lh={1.6}>
            Premium is <strong>₹179/month with no auto-renewal</strong>. You can cancel any time, and if
            you change your mind you can request a <strong>full refund within 7 days</strong> of your
            payment — just email us.
          </Body>
        </Card>

        <Card p={24} style={{ marginBottom: 24 }}>

          <Section title="Subscription terms">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom Premium costs <strong>₹179 per month</strong>. During early access, payment is
              collected <strong>manually via UPI</strong> and Premium is activated after we verify your
              payment proof. There is <strong>no automatic recurring charge</strong> — your Premium
              access simply ends when the paid month expires unless you choose to pay again.
            </Body>
          </Section>

          <Section title="Cancellation">
            <Body size={13} color={T.ink700} lh={1.6}>
              Because billing is manual, there is nothing to cancel — you are never charged automatically.
              To stop using Premium, simply do not renew when your current month ends. Your account stays
              active on the free tier, and your data is never deleted just because Premium lapses.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              If you want to delete your account entirely, you can do so from
              <strong> Settings → Account</strong> at any time.
            </Body>
          </Section>

          <Section title="Refunds">
            <Body size={13} color={T.ink700} lh={1.6}>
              You may request a <strong>full refund within 7 days</strong> of your Premium payment, for
              any reason. We will refund the full amount to your original UPI account.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>Refunds are generally not available:</Body>
            <Bullets items={[
              'More than 7 days after the payment date.',
              'For a renewal you actively chose to make after already using the previous paid period.',
              'Where there is clear evidence of abuse of the refund policy (e.g. repeated pay-and-refund cycles).',
            ]} />
            <Body size={13} color={T.ink700} lh={1.6}>
              These restrictions do not affect any rights you may have under applicable consumer
              protection law.
            </Body>
          </Section>

          <Section title="How to request a refund">
            <Body size={13} color={T.ink700} lh={1.6}>
              Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: T.brand }}>{SUPPORT_EMAIL}</a>
              {' '}from the email address on your ChildBloom account, with:
            </Body>
            <Bullets items={[
              'The date and amount of your payment.',
              'The UPI reference / transaction ID (or a screenshot of the payment).',
            ]} />
            <Body size={13} color={T.ink700} lh={1.6}>
              We aim to acknowledge requests within 2 business days and to process approved refunds within
              <strong> 5–7 business days</strong>. The time for the amount to appear in your account
              depends on your bank or UPI provider.
            </Body>
          </Section>

          <Section title="Questions">
            <Body size={13} color={T.ink700} lh={1.6}>
              For anything about billing, cancellation, or refunds, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: T.brand }}>{SUPPORT_EMAIL}</a>.
              See also our{' '}
              <Link to="/terms" style={{ color: T.brand }}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={{ color: T.brand }}>Privacy Policy</Link>.
            </Body>
          </Section>

        </Card>

        <Mono size={12} color={T.ink300} style={{ textAlign: 'center', display: 'block' }}>
          ChildBloom · {SUPPORT_EMAIL}
        </Mono>

        <Spacer h={24} />
      </div>
    </div>
  );
}
