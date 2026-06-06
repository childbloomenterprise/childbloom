import { useState, useEffect } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const GROUP_URL    = 'https://groups.google.com/g/bloom-v1-testers';
const OPTIN_URL    = 'https://play.google.com/apps/testing/com.childbloom.app';
const SHARE_URL    = 'https://childbloom.in/join';
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#F0EDE7',
  card:      '#FFFFFF',
  green:     '#1D6A47',
  greenDark: '#1D3D2E',
  greenMid:  '#2EA87B',
  greenFade: 'rgba(29,106,71,0.09)',
  text:      '#1D3D2E',
  muted:     '#6B7280',
  lighter:   '#9CA3AF',
  border:    '#E5E7EB',
  cream:     '#F7F4EF',
};

const step1Done_key = 'cb_group_joined';

export default function JoinPage() {
  const [isAndroid,    setIsAndroid]    = useState(false);
  const [step1Clicked, setStep1Clicked] = useState(false);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
    // Persist across back-navigation: if they already clicked join, skip to step 2
    if (sessionStorage.getItem(step1Done_key)) setStep1Clicked(true);
  }, []);

  function handleJoinGroup() {
    setStep1Clicked(true);
    sessionStorage.setItem(step1Done_key, '1');
    window.open(GROUP_URL, '_blank', 'noopener');
  }

  function handleInstall() {
    window.location.href = OPTIN_URL;
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Join ChildBloom Beta', url: SHARE_URL }).catch(() => {});
    } else {
      navigator.clipboard.writeText(SHARE_URL).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, ${C.bg} 0%, #E4F0EA 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '36px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenMid} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 8px 28px rgba(29,106,71,0.28)',
        }}>
          <img src="/favicon.svg" alt="" width={40} height={40}
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 26,
          color: C.greenDark,
          letterSpacing: '-0.02em',
          marginBottom: 3,
        }}>
          ChildBloom
        </div>
        <div style={{
          fontSize: 12,
          color: '#5C7A68',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Android Beta
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: C.card,
        borderRadius: 24,
        padding: '28px 24px',
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 4px 40px rgba(29,61,46,0.10)',
      }}>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 22,
          color: C.text,
          marginBottom: 6,
          letterSpacing: '-0.02em',
        }}>
          {step1Clicked ? 'Almost there — install the app' : 'Join the ChildBloom beta'}
        </h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
          {step1Clicked
            ? 'You joined the tester group. Now tap below to open Play Store and install ChildBloom.'
            : 'Two quick steps. Joining takes under 30 seconds.'}
        </p>

        {/* ── STEP 1 ── */}
        <StepRow
          n="1"
          label="Join the tester group"
          sub="Opens Google Groups — tap Join"
          done={step1Clicked}
        />
        {!step1Clicked && (
          <button onClick={handleJoinGroup} style={btnStyle(C.green, '#fff')}>
            <GroupIcon />
            Join Tester Group
          </button>
        )}

        {/* ── STEP 2 — slides in after step 1 ── */}
        <div style={{
          overflow: 'hidden',
          maxHeight: step1Clicked ? 300 : 0,
          opacity: step1Clicked ? 1 : 0,
          transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease',
        }}>
          <div style={{ paddingTop: 16 }}>
            <StepRow
              n="2"
              label="Install from Play Store"
              sub="Tap Become a tester → Install"
              done={false}
              active
            />
            <button onClick={handleInstall} style={btnStyle(C.green, '#fff')}>
              <PlayIcon />
              {isAndroid ? 'Open Play Store' : 'Open on Android'}
            </button>
          </div>
        </div>

        {/* ── Step 1 already clicked — show both done/active ── */}
        {!step1Clicked && (
          <div style={{ marginTop: 16 }}>
            <StepRow
              n="2"
              label="Install from Play Store"
              sub="Available after joining the group"
              done={false}
              locked
            />
          </div>
        )}

        {/* Divider + share */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 22, paddingTop: 18 }}>
          <p style={{ fontSize: 12.5, color: C.lighter, marginBottom: 10, textAlign: 'center' }}>
            Know another parent who'd love this?
          </p>
          <button onClick={handleShare} style={{
            ...btnStyle('transparent', C.green),
            border: `1.5px solid rgba(29,106,71,0.22)`,
            fontSize: 13.5,
          }}>
            <ShareIcon />
            {copied ? '✓ Link copied!' : 'Share invite link'}
          </button>
        </div>
      </div>

      <p style={{
        marginTop: 20,
        fontSize: 12,
        color: C.lighter,
        textAlign: 'center',
        maxWidth: 320,
        lineHeight: 1.6,
      }}>
        Free beta. No credit card.{' '}
        <a href="/privacy" style={{ color: '#5C7A68', textDecoration: 'underline' }}>
          Privacy policy
        </a>
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepRow({ n, label, sub, done, active, locked }) {
  const bg     = done   ? '#E8F5EE' : active  ? C.greenFade : locked ? '#F9FAFB' : C.greenFade;
  const color  = done   ? C.green   : active  ? C.green     : locked ? '#D1D5DB' : C.green;
  const tcolor = locked ? C.lighter : C.text;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
      <div style={{
        flexShrink: 0,
        width: 32, height: 32, borderRadius: '50%',
        background: bg,
        color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13,
        transition: 'background 0.3s, color 0.3s',
      }}>
        {done ? <CheckIcon /> : n}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: tcolor }}>{label}</div>
        <div style={{ fontSize: 12.5, color: C.lighter, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%',
    background: bg, color,
    borderRadius: 999, padding: '14px 20px',
    border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 15,
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: bg === 'transparent' ? 'none' : '0 3px 14px rgba(29,106,71,0.28)',
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
    marginBottom: 6,
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.36.6 1.24 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
