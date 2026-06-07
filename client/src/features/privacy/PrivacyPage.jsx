import { Link } from 'react-router-dom';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Display, Eyebrow, Body, Mono, Stack, HRow, Spacer } from '../../components/cb/primitives';
import PageSEO from '../../components/seo/PageSEO';

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

export default function PrivacyPage() {
  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>
      <PageSEO
        title="Privacy Policy — ChildBloom"
        description="ChildBloom's privacy policy. Learn how we collect, use, and protect your child's data. We do not sell data to third parties."
        canonical="/privacy"
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' }}>
            <CBLogoMark size={32} color={T.brand} />
            <span style={{ fontFamily: FONTS.serif, fontSize: 20, fontStyle: 'italic', color: T.ink900 }}>ChildBloom</span>
          </Link>
          <Display size={28} italic weight={400} lh={1.1}>Privacy Policy</Display>
          <Spacer h={6} />
          <Mono size={12} color={T.ink400}>Last updated: April 2026</Mono>
        </div>

        <Card p={24} style={{ marginBottom: 24 }}>

          <Section title="Who we are">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom is a global child development companion app,
              operated by ChildBloom Enterprise. We are incorporated in India and comply
              with India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              For privacy concerns, contact us at:{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: T.brand }}>privacy@childbloom.app</a>
            </Body>
          </Section>

          <Section title="What data we collect">
            <Body size={13} color={T.ink700} lh={1.6}><strong>Account information:</strong> Your email address, used only for authentication.</Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              <strong>Child profile data:</strong> Child's name and date of birth, entered by you
              during onboarding to personalise age-appropriate guidance.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              <strong>Child health data:</strong> Height, weight, sleep hours, mood, feeding notes,
              developmental milestones, vaccination records, and any concerns you log. This data is
              voluntarily entered by you.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              <strong>AI conversations:</strong> Questions you ask Dr. Bloom are sent to Anthropic's
              Claude API to generate responses. We do not store your conversation history on our servers
              beyond the current session.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              <strong>Device information:</strong> Basic usage data (page visits, errors) may be
              collected anonymously to improve the app. No personal identifiers are attached.
            </Body>
          </Section>

          <Section title="How your data is stored">
            <Body size={13} color={T.ink700} lh={1.6}>
              All account and child health data is stored in <strong>Supabase</strong>, a
              PostgreSQL database with encryption at rest and in transit (TLS 1.3).
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              <strong>Row-Level Security (RLS)</strong> is enforced at the database level —
              you can only ever read and write your own family's data. No ChildBloom employee
              can access your data without explicit authorization.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              Data is stored on Supabase infrastructure hosted in the European Union (AWS Frankfurt).
            </Body>
          </Section>

          <Section title="Who can access your data">
            <Body size={13} color={T.ink700} lh={1.6}>Only you — the account holder — can access your child's health data.</Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              We do not share, sell, or transfer your personal data to any third party for
              advertising, marketing, or commercial purposes.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}><strong>Third-party services we use:</strong></Body>
            <Stack gap={6} style={{ paddingLeft: 16 }}>
              {[
                ['Anthropic (Claude AI)', 'processes your questions to generate Dr. Bloom responses. Anthropic\'s privacy policy applies to this data.'],
                ['Supabase', 'database and authentication infrastructure.'],
                ['Vercel', 'hosting and serverless functions.'],
                ['Google Cloud TTS (optional)', 'text-to-speech for voice responses.'],
              ].map(([name, desc]) => (
                <HRow key={name} gap={8} align="flex-start">
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand, flexShrink: 0, marginTop: 7 }} />
                  <Body size={13} color={T.ink700} lh={1.5}><strong>{name}</strong> — {desc}</Body>
                </HRow>
              ))}
            </Stack>
          </Section>

          <Section title="How long we keep your data">
            <Body size={13} color={T.ink700} lh={1.6}>
              Your account and child health data is retained for as long as your account is active.
              If you delete your account, all associated data is permanently erased within <strong>30 days</strong>.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              AI conversation data sent to Anthropic is not stored on our servers and is subject
              to Anthropic's own retention policy.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              Anonymous usage analytics (if collected) are retained for up to <strong>12 months</strong> and
              contain no personal identifiers.
            </Body>
          </Section>

          <Section title="How to delete your data">
            <Body size={13} color={T.ink700} lh={1.6}>
              You may delete your account and all associated data at any time from the
              <strong> Settings → Account</strong> section of the app.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              On deletion, all your child profiles, weekly updates, growth records, health records,
              and food logs are permanently and irreversibly deleted from our database.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              To request manual deletion, email{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: T.brand }}>privacy@childbloom.app</a>
              {' '}with your registered email address.
            </Body>
          </Section>

          <Section title="Children's privacy">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom is designed for <strong>parents and guardians</strong>, not for use
              by children directly. We do not knowingly collect personal data from children under 13.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              Health information about children is entered by their parents or guardians and
              is treated as the parent's data under this policy.
            </Body>
          </Section>

          <Section title="No advertising">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom does not display advertisements. We do not use your data to serve
              personalized ads. We do not share your data with advertising networks.
            </Body>
          </Section>

          <Section title="Compliance with India's DPDP Act 2023">
            <Body size={13} color={T.ink700} lh={1.6}>
              Under the Digital Personal Data Protection Act, 2023, you have the right to:
            </Body>
            <Stack gap={6} style={{ paddingLeft: 16 }}>
              {[
                'Access a summary of your personal data we process',
                'Correct inaccurate personal data',
                'Erase your personal data',
                'Withdraw consent at any time',
                'Nominate another person to exercise your rights in case of death or incapacity',
              ].map(item => (
                <HRow key={item} gap={8} align="flex-start">
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand, flexShrink: 0, marginTop: 7 }} />
                  <Body size={13} color={T.ink700} lh={1.5}>{item}</Body>
                </HRow>
              ))}
            </Stack>
            <Body size={13} color={T.ink700} lh={1.6}>
              To exercise these rights, contact:{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: T.brand }}>privacy@childbloom.app</a>
            </Body>
          </Section>

          <Section title="Grievance Officer (DPDP Act 2023)">
            <Body size={13} color={T.ink700} lh={1.6}>
              In accordance with the Digital Personal Data Protection Act, 2023, any complaints
              or grievances regarding the processing of your personal data may be directed to:
            </Body>
            <Stack gap={4} style={{ paddingLeft: 16 }}>
              <Body size={13} color={T.ink700} lh={1.5}><strong>Name:</strong> ChildBloom Enterprise</Body>
              <Body size={13} color={T.ink700} lh={1.5}><strong>Email:</strong>{' '}
                <a href="mailto:privacy@childbloom.app" style={{ color: T.brand }}>privacy@childbloom.app</a>
              </Body>
              <Body size={13} color={T.ink700} lh={1.5}><strong>Response time:</strong> We will respond within 30 days of receiving your complaint.</Body>
            </Stack>
          </Section>

          <Section title="Changes to this policy">
            <Body size={13} color={T.ink700} lh={1.6}>
              We will notify you of any significant changes to this policy by email or
              in-app notification. Continued use of the app after changes constitutes
              acceptance of the updated policy.
            </Body>
          </Section>

        </Card>

        <Mono size={12} color={T.ink300} style={{ textAlign: 'center', display: 'block' }}>
          ChildBloom · privacy@childbloom.app
        </Mono>

        <Spacer h={24} />
      </div>
    </div>
  );
}
