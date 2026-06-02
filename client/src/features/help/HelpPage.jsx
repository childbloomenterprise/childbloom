// Help & Contact page.
// FAQ above the fold (most user questions answered without contact),
// then a contact form that posts through /api/send-review (already
// IP-rate-limited + sanitized).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import {
  Card, Button, Display, Eyebrow, Body, Mono,
  Stack, HRow, Spacer, ChromeBtn, SectionLabel,
} from '../../components/cb/primitives';
import useAuthStore from '../../stores/authStore';

const FAQ = [
  {
    q: 'Is my child\'s data private?',
    a: 'Yes. Your data lives in a row-level-secured Supabase database. Only you can read it — not other parents, not the app team. We never train AI on your data.',
  },
  {
    q: 'Is Dr. Bloom a real doctor?',
    a: 'Dr. Bloom is an AI assistant grounded in WHO/AAP/IAP guidance, with your child\'s context. It\'s a thinking partner, not a replacement for your pediatrician. Always escalate genuine concerns to your doctor.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Settings → Account → Delete account. This removes everything: children, logs, photos, bloom moments. It cannot be undone.',
  },
  {
    q: 'Why does the app suggest things in only some areas?',
    a: 'Bloom Path nudges areas you haven\'t logged in yet — to gently broaden, never to pressure. Areas you\'ve already noticed stay quiet.',
  },
  {
    q: 'Can I use ChildBloom offline?',
    a: 'Read-only navigation works offline. New logs queue and sync when you\'re back online. Emergency first-aid is fully offline by design.',
  },
  {
    q: 'What languages does it support?',
    a: 'English, Hindi, Malayalam, Tamil, Telugu, and Punjabi. Dr. Bloom responds in your selected language.',
  },
  {
    q: 'Does ChildBloom replace vaccinations or doctor visits?',
    a: 'No. It tracks them and reminds you. The IAP schedule and your pediatrician decide what your child actually needs.',
  },
  {
    q: 'How much does it cost?',
    a: 'Free forever for the basics: logging, daily check-in, vaccination tracking, Bloom Path, emergency first-aid. Premium (planned ₹200/month) will unlock unlimited AI conversations and the monthly Bloom Letter.',
  },
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          fontFamily: FONTS.sans,
        }}
      >
        <Body size={14} weight={600} color={T.ink900} style={{ flex: 1 }}>{q}</Body>
        <div style={{
          width: 20, height: 20, color: T.ink400,
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          <Body size={13} color={T.ink500} lh={1.6}>{a}</Body>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [openIdx, setOpenIdx] = useState(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!message.trim()) { setError('Please describe what we can help with.'); return; }
    setError(''); setSending(true);
    try {
      const res = await fetch('/api/send-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          ratingLabel: 'Help request',
          message: message.trim(),
          userName: name.trim() || 'Anonymous',
          userEmail: email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error('Too many requests from your network. Try again in a bit.');
        }
        throw new Error(body?.message || 'Could not send. Try again or email us directly.');
      }
      setSent(true);
      setMessage('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: RADIUS.md,
    border: `0.5px solid ${T.line}`, fontSize: 14,
    background: 'rgba(0,0,0,0.02)', color: T.ink900,
    fontFamily: FONTS.sans, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s',
  };
  const onFocus = (e) => e.target.style.borderColor = T.brandSoft;
  const onBlur  = (e) => e.target.style.borderColor = T.line;

  return (
    <div data-theme-root style={{ minHeight: '100dvh', background: T.bg, fontFamily: FONTS.sans, paddingBottom: 100 }}>

      <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChromeBtn icon="back" onClick={() => navigate(-1)} aria-label="Back" />
        <Mono size={11} color={T.ink400} style={{ letterSpacing: '0.12em' }}>HELP</Mono>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '14px 20px 6px' }}>
        <Eyebrow color={T.ink300}>SUPPORT</Eyebrow>
        <Spacer h={6} />
        <Display size={28} italic weight={500} lh={1.12}>How can we help?</Display>
        <Spacer h={6} />
        <Body size={13} color={T.ink500} lh={1.5}>
          Most questions are answered below. If not, write to us — a human reads every message.
        </Body>
      </div>

      <Spacer h={24} />

      {/* FAQ */}
      <div style={{ padding: '0 16px' }}>
        <SectionLabel title="Frequently asked" />
        <Card p={0}>
          {FAQ.map((item, i) => (
            <div key={i}>
              <FaqItem
                q={item.q}
                a={item.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
              {i < FAQ.length - 1 && (
                <div style={{ height: 0.5, background: T.line, marginLeft: 16, marginRight: 16 }} />
              )}
            </div>
          ))}
        </Card>
      </div>

      <Spacer h={28} />

      {/* Contact form */}
      <div style={{ padding: '0 16px' }}>
        <SectionLabel title="Get in touch" />
        <Card p={18}>
          {sent ? (
            <Stack gap={8} style={{ alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: T.brandWash,
                color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>✓</div>
              <Display size={18} italic weight={500}>Thank you</Display>
              <Body size={13} color={T.ink500}>We read every note. We'll reply if you left an email.</Body>
              <Spacer h={6} />
              <Button variant="secondary" size="sm" onClick={() => { setSent(false); setMessage(''); }}>
                Send another
              </Button>
            </Stack>
          ) : (
            <>
              <Stack gap={10}>
                <div>
                  <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Your name</Mono>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    aria-label="Your name"
                    maxLength={100}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Email (so we can reply)</Mono>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email"
                    maxLength={200}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>What's going on?</Mono>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What happened, what you expected, what device you're on…"
                    aria-label="Your message"
                    rows={4}
                    maxLength={2000}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </Stack>

              {error && (
                <>
                  <Spacer h={10} />
                  <Body size={12} color={T.danger}>{error}</Body>
                </>
              )}

              <Spacer h={14} />
              <Button
                variant="primary"
                full
                onClick={() => !sending && submit()}
                disabled={sending || !message.trim()}
                aria-label="Send message"
              >
                {sending ? 'Sending…' : 'Send message'}
              </Button>
              <Spacer h={8} />
              <Body size={11} color={T.ink300} style={{ textAlign: 'center' }}>
                Or email us at <a href="mailto:childbloomenterprise@gmail.com" style={{ color: T.brand, textDecoration: 'none', fontWeight: 600 }}>childbloomenterprise@gmail.com</a>
              </Body>
            </>
          )}
        </Card>
      </div>

      <Spacer h={20} />

      {/* Quick links */}
      <div style={{ padding: '0 16px' }}>
        <SectionLabel title="More" />
        <Card p={0}>
          <button
            onClick={() => navigate('/privacy')}
            aria-label="Privacy policy"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <HRow gap={12} align="center" style={{ padding: '14px 16px' }}>
              <Body size={14} weight={500} color={T.ink900} style={{ flex: 1 }}>Privacy policy</Body>
              <Body size={11} color={T.ink300}>→</Body>
            </HRow>
          </button>
        </Card>
      </div>
    </div>
  );
}
