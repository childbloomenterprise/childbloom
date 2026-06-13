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
      {items.map((item) => (
        <HRow key={typeof item === 'string' ? item : item.key} gap={8} align="flex-start">
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand, flexShrink: 0, marginTop: 7 }} />
          <Body size={13} color={T.ink700} lh={1.5}>{item}</Body>
        </HRow>
      ))}
    </Stack>
  );
}

export default function TermsPage() {
  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans }}>
      <PageSEO
        title="Terms of Service — ChildBloom"
        description="ChildBloom's Terms of Service. The rules for using our child development companion app, including the medical disclaimer, Premium subscription terms, and your responsibilities."
        canonical="/terms"
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' }}>
            <CBLogoMark size={32} color={T.brand} />
            <span style={{ fontFamily: FONTS.serif, fontSize: 20, fontStyle: 'italic', color: T.ink900 }}>ChildBloom</span>
          </Link>
          <Display size={28} italic weight={400} lh={1.1}>Terms of Service</Display>
          <Spacer h={6} />
          <Mono size={12} color={T.ink400}>Last updated: June 2026</Mono>
        </div>

        {/* Medical disclaimer — pinned to the top, this is the most important term */}
        <Card p={20} style={{ marginBottom: 16, background: '#FBF1E9', border: `1px solid ${T.gold}` }}>
          <Eyebrow color={T.gold}>Important — please read first</Eyebrow>
          <Spacer h={8} />
          <Body size={13} color={T.ink900} lh={1.6} weight={600}>
            ChildBloom is not a medical service and does not provide medical advice, diagnosis, or treatment.
          </Body>
          <Spacer h={6} />
          <Body size={13} color={T.ink700} lh={1.6}>
            All guidance — including Dr. Bloom AI responses, the Daily Bloom Brief, growth insights,
            and the emergency first-aid guides — is <strong>general educational information only</strong>.
            It is not a substitute for professional advice from your pediatrician or a qualified
            healthcare provider. Always consult your doctor about your child's health, and never delay
            seeking medical care because of something you read in this app.
          </Body>
          <Spacer h={6} />
          <Body size={13} color={T.ink900} lh={1.6} weight={600}>
            In an emergency, call your local emergency number immediately. Do not rely on the app.
          </Body>
        </Card>

        <Card p={24} style={{ marginBottom: 24 }}>

          <Section title="1. Acceptance of these terms">
            <Body size={13} color={T.ink700} lh={1.6}>
              These Terms of Service ("Terms") are a legal agreement between you and
              <strong> ChildBloom Enterprise</strong> ("ChildBloom", "we", "us"), the operator of the
              ChildBloom app and website at childbloom.in. By creating an account, signing in, or
              using ChildBloom, you agree to these Terms and to our{' '}
              <Link to="/privacy" style={{ color: T.brand }}>Privacy Policy</Link>. If you do not
              agree, please do not use the app.
            </Body>
          </Section>

          <Section title="2. What ChildBloom is">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom is a child development companion app for parents and guardians. It helps you
              log feeding, sleep, growth, and milestones, offers age-appropriate guidance, and includes
              an AI assistant ("Dr. Bloom") for general questions about early childhood.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              The app is provided on an <strong>"as is" and "as available"</strong> basis. We may add,
              change, or remove features at any time.
            </Body>
          </Section>

          <Section title="3. Not medical advice">
            <Body size={13} color={T.ink700} lh={1.6}>
              As stated above, nothing in ChildBloom constitutes medical advice. Dr. Bloom is an AI tool
              that generates general guidance and can be wrong or incomplete. You are responsible for any
              decisions you make about your child's care, and you agree to consult a qualified healthcare
              professional for medical concerns. The emergency guides are for general first-aid education
              and do not replace professional emergency services or training.
            </Body>
          </Section>

          <Section title="4. Eligibility & accounts">
            <Bullets items={[
              'You must be at least 18 years old and the parent or legal guardian of any child whose information you add.',
              'You sign in with Google. You are responsible for keeping access to your Google account secure.',
              'You are responsible for the accuracy of the information you enter, and for all activity under your account.',
              'One person should not impersonate another or create accounts on behalf of someone without their consent.',
            ]} />
          </Section>

          <Section title="5. Acceptable use">
            <Body size={13} color={T.ink700} lh={1.6}>You agree not to:</Body>
            <Bullets items={[
              'Use the app for any unlawful purpose, or to harm a child or any other person.',
              'Attempt to reverse-engineer, scrape, overload, or disrupt the app, its API, or its infrastructure.',
              'Circumvent usage limits, security controls, or the Premium paywall.',
              'Upload malicious code, or content that infringes the rights of others.',
            ]} />
            <Body size={13} color={T.ink700} lh={1.6}>
              We may suspend or terminate accounts that violate these Terms.
            </Body>
          </Section>

          <Section title="6. Premium subscription & payments">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom offers a paid <strong>Premium</strong> plan at <strong>₹179 per month</strong>.
              The core app and a generous free tier remain free to use. Premium unlocks higher AI usage
              limits and additional features.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              During early access, payments are collected <strong>manually via UPI</strong> and Premium
              is activated after you send proof of payment. There is no automatic recurring charge — your
              Premium simply expires at the end of the paid period unless you renew. Prices are in Indian
              Rupees (INR) and may change with notice for future periods.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              Cancellations and refunds are governed by our{' '}
              <Link to="/refund" style={{ color: T.brand }}>Refund &amp; Cancellation Policy</Link>.
            </Body>
          </Section>

          <Section title="7. Your data & content">
            <Body size={13} color={T.ink700} lh={1.6}>
              You retain ownership of the information you enter about yourself and your child. You grant
              ChildBloom a limited licence to store and process that information solely to provide the
              service to you, as described in our{' '}
              <Link to="/privacy" style={{ color: T.brand }}>Privacy Policy</Link>. We do not sell your
              data or use it for advertising.
            </Body>
          </Section>

          <Section title="8. Intellectual property">
            <Body size={13} color={T.ink700} lh={1.6}>
              The ChildBloom name, logo, design, content, and software are owned by ChildBloom Enterprise
              and protected by applicable law. You may use the app for your personal, non-commercial use.
              You may not copy, redistribute, or create derivative works from the app without our written
              permission.
            </Body>
          </Section>

          <Section title="9. Disclaimers & limitation of liability">
            <Body size={13} color={T.ink700} lh={1.6}>
              To the maximum extent permitted by law, ChildBloom is provided without warranties of any
              kind. We do not guarantee that the app will be accurate, uninterrupted, or error-free.
            </Body>
            <Body size={13} color={T.ink700} lh={1.6}>
              To the maximum extent permitted by law, ChildBloom Enterprise will not be liable for any
              indirect, incidental, or consequential damages arising from your use of the app. Where
              liability cannot be excluded, our total liability is limited to the amount you paid us in
              the three months before the claim.
            </Body>
          </Section>

          <Section title="10. Termination">
            <Body size={13} color={T.ink700} lh={1.6}>
              You may stop using ChildBloom at any time and delete your account from
              <strong> Settings → Account</strong>, which permanently erases your data as described in
              the Privacy Policy. We may suspend or end your access if you breach these Terms or to
              protect the service and its users.
            </Body>
          </Section>

          <Section title="11. Governing law">
            <Body size={13} color={T.ink700} lh={1.6}>
              ChildBloom Enterprise is incorporated in India. These Terms are governed by the laws of
              India, and the courts at our registered place of business have jurisdiction over any
              disputes, subject to any rights you have under applicable local consumer law.
            </Body>
          </Section>

          <Section title="12. Changes to these terms">
            <Body size={13} color={T.ink700} lh={1.6}>
              We may update these Terms from time to time. If we make significant changes, we will notify
              you by email or in-app notice. Continued use of the app after changes take effect means you
              accept the updated Terms.
            </Body>
          </Section>

          <Section title="13. Contact">
            <Body size={13} color={T.ink700} lh={1.6}>
              Questions about these Terms? Email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: T.brand }}>{SUPPORT_EMAIL}</a>.
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
