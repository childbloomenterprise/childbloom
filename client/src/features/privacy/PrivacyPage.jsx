import { Link } from 'react-router-dom';
import { LogoWordmark } from '../../components/ui/LogoMark';

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-serif font-bold mb-3" style={{ color: '#1D9E75' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: 'rgba(61,43,35,0.75)' }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F7F4EF' }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/login">
            <LogoWordmark iconSize={36} className="mb-6" />
          </Link>
          <h1 className="text-2xl font-serif font-bold mb-2" style={{ color: '#2A1C15' }}>
            Privacy Policy
          </h1>
          <p className="text-sm" style={{ color: 'rgba(61,43,35,0.50)' }}>
            Last updated: April 2026
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{
            background: 'rgba(255,255,255,0.70)',
            borderColor: 'rgba(232,196,184,0.50)',
          }}
        >
          <Section title="Who we are">
            <p>
              ChildBloom is a child development companion app for Indian parents,
              operated by ChildBloom Enterprise. We are based in India and comply
              with India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </p>
            <p>
              For privacy concerns, contact us at:{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: '#1D9E75' }}>
                privacy@childbloom.app
              </a>
            </p>
          </Section>

          <Section title="What data we collect">
            <p><strong>Account information:</strong> Your email address, used only for authentication.</p>
            <p>
              <strong>Child health data:</strong> Height, weight, sleep hours, mood, feeding notes,
              developmental milestones, vaccination records, and any concerns you log. This data is
              voluntarily entered by you.
            </p>
            <p>
              <strong>AI conversations:</strong> Questions you ask Dr. Bloom are sent to Anthropic's
              Claude API to generate responses. We do not store your conversation history on our servers
              beyond the current session.
            </p>
            <p>
              <strong>Device information:</strong> Basic usage data (page visits, errors) may be
              collected anonymously to improve the app. No personal identifiers are attached.
            </p>
          </Section>

          <Section title="How your data is stored">
            <p>
              All account and child health data is stored in <strong>Supabase</strong>, a
              PostgreSQL database with encryption at rest and in transit (TLS 1.3).
            </p>
            <p>
              <strong>Row-Level Security (RLS)</strong> is enforced at the database level —
              you can only ever read and write your own family's data. No ChildBloom employee
              can access your data without explicit authorization.
            </p>
            <p>
              Data is stored on Supabase infrastructure hosted in the European Union (AWS Frankfurt).
            </p>
          </Section>

          <Section title="Who can access your data">
            <p>Only you — the account holder — can access your child's health data.</p>
            <p>
              We do not share, sell, or transfer your personal data to any third party for
              advertising, marketing, or commercial purposes.
            </p>
            <p>
              <strong>Third-party services we use:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Anthropic (Claude AI)</strong> — processes your questions to generate
                Dr. Bloom responses. Anthropic's privacy policy applies to this data.
              </li>
              <li>
                <strong>Supabase</strong> — database and authentication infrastructure.
              </li>
              <li>
                <strong>Vercel</strong> — hosting and serverless functions.
              </li>
              <li>
                <strong>Google Cloud TTS</strong> (optional) — text-to-speech for voice responses.
              </li>
            </ul>
          </Section>

          <Section title="How to delete your data">
            <p>
              You may delete your account and all associated data at any time from the
              <strong> Settings → Your Space</strong> section of the app.
            </p>
            <p>
              On deletion, all your child profiles, weekly updates, growth records, health records,
              and food logs are permanently and irreversibly deleted from our database.
            </p>
            <p>
              To request manual deletion, email{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: '#1D9E75' }}>
                privacy@childbloom.app
              </a>{' '}
              with your registered email address.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              ChildBloom is designed for <strong>parents and guardians</strong>, not for use
              by children directly. We do not knowingly collect personal data from children
              under 13.
            </p>
            <p>
              Health information about children is entered by their parents or guardians and
              is treated as the parent's data under this policy.
            </p>
          </Section>

          <Section title="No advertising">
            <p>
              ChildBloom does not display advertisements. We do not use your data to serve
              personalized ads. We do not share your data with advertising networks.
            </p>
          </Section>

          <Section title="Compliance with India's DPDP Act 2023">
            <p>
              Under the Digital Personal Data Protection Act, 2023, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access a summary of your personal data we process</li>
              <li>Correct inaccurate personal data</li>
              <li>Erase your personal data</li>
              <li>Withdraw consent at any time</li>
              <li>Nominate another person to exercise your rights in case of death or incapacity</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact:{' '}
              <a href="mailto:privacy@childbloom.app" style={{ color: '#1D9E75' }}>
                privacy@childbloom.app
              </a>
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We will notify you of any significant changes to this policy by email or
              in-app notification. Continued use of the app after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: 'rgba(61,43,35,0.35)' }}>
          ChildBloom · privacy@childbloom.app · India
        </p>
      </div>
    </div>
  );
}
