// QuickLogBar — speak or one-tap to log, instead of filling forms.
//
// • Voice (headline): tap mic → speak "fed 10 minutes left side, then slept two
//   hours" → api/parse-log returns structured events → editable confirm sheet.
//   Browser Web Speech API; falls back to a typed box where unsupported/offline.
// • One-tap: Diaper / Meds open the same confirm sheet pre-filled (no AI, free).
// (Feed & Sleep already have dedicated quick actions on the dashboard.)

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import api from '../../lib/api';
import { track } from '../../lib/analytics';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import { T, FONTS, RADIUS } from '../../components/cb/tokens';
import { Card, Body, Mono, Spacer } from '../../components/cb/primitives';
import CBIcon from '../../components/cb/CBIcon';
import LogConfirmSheet from './LogConfirmSheet';

function TileBtn({ icon, label, onClick, accent, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        flex: 1, padding: '12px 8px', borderRadius: RADIUS.md,
        background: T.surface, border: `0.5px solid ${T.line}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: busy ? 'default' : 'pointer', fontFamily: FONTS.sans, color: T.ink900,
        opacity: busy ? 0.6 : 1, transition: 'transform 0.12s ease',
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
      onPointerUp={(e) => (e.currentTarget.style.transform = '')}
      onPointerLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      <div style={{ width: 30, height: 30, borderRadius: 10, background: accent || T.brandWash, color: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CBIcon name={icon} size={16} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
    </button>
  );
}

export default function QuickLogBar({ child }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const [sheet, setSheet] = useState({ open: false, events: [], method: 'voice' });
  const [typedOpen, setTypedOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState(null); // { kind:'error'|'info', msg }
  const lastTranscript = useRef('');

  const {
    isListening, transcript, error: speechError, isSupported, startListening, stopListening, resetTranscript,
  } = useSpeechRecognition();

  const parse = useMutation({
    mutationFn: async ({ text, method }) => {
      const res = await api.post('/api/parse-log', {
        transcript: text, childAgeDays: ageInDays, language: i18n.language,
      });
      return { events: res?.events || [], method };
    },
    onSuccess: ({ events, method }) => {
      if (!events.length) {
        setStatus({ kind: 'info', msg: t('quicklog.nothingHeard', 'Nothing to log yet. Try again or add it manually.') });
        return;
      }
      setStatus(null);
      setSheet({ open: true, events, method });
    },
    onError: (err) => {
      if (err?.response?.status === 402 || /free voice logs/i.test(err?.message || '')) {
        setStatus({ kind: 'error', msg: t('quicklog.voiceCap', 'You\'ve used your 5 free voice logs this week. Type it or upgrade.') });
      } else {
        setStatus({ kind: 'error', msg: t('quicklog.parseError', 'Could not understand that. Please try again or type it.') });
      }
    },
  });

  // When the recognizer returns a final transcript, send it to the parser.
  useEffect(() => {
    if (transcript && transcript !== lastTranscript.current) {
      lastTranscript.current = transcript;
      parse.mutate({ text: transcript, method: 'voice' });
      resetTranscript();
    }
  }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (speechError) {
      const map = {
        microphone_denied: t('quicklog.micDenied', 'Microphone blocked. Allow it, or type instead.'),
        network_error: t('quicklog.netError', 'Voice needs a connection. Type it instead.'),
        no_speech: t('quicklog.noSpeech', "Didn't catch that. Try again."),
      };
      setStatus({ kind: 'info', msg: map[speechError] || t('quicklog.parseError', 'Could not understand that. Please try again or type it.') });
    }
  }, [speechError]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMic = () => {
    setStatus(null);
    if (!isSupported) { setTypedOpen(true); return; }
    if (isListening) stopListening();
    else startListening(i18n.language);
  };

  const submitTyped = () => {
    const text = typedText.trim();
    if (text.length < 2) return;
    setTypedOpen(false);
    setTypedText('');
    parse.mutate({ text, method: 'typed' });
  };

  const openTap = (event) => {
    setStatus(null);
    setSheet({ open: true, events: [event], method: 'tap' });
  };

  return (
    <Card p={14}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Mono size={10} color={T.ink400} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('quicklog.title', 'Quick log')}
        </Mono>
        {!typedOpen && (
          <button onClick={() => setTypedOpen(true)} style={{ border: 'none', background: 'transparent', color: T.brand, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
            {t('quicklog.typeInstead', 'Type instead')}
          </button>
        )}
      </div>

      {/* Voice button */}
      <button
        onClick={onMic}
        disabled={parse.isPending}
        aria-label={isListening ? t('quicklog.stop', 'Stop') : t('quicklog.speak', 'Tap and speak')}
        style={{
          width: '100%', padding: '14px', borderRadius: RADIUS.lg, border: 'none',
          background: isListening ? '#C0392B' : T.brand, color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: parse.isPending ? 'default' : 'pointer', fontFamily: FONTS.sans,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          opacity: parse.isPending ? 0.7 : 1,
        }}
      >
        <CBIcon name="mic" size={18} />
        {parse.isPending
          ? t('quicklog.understanding', 'Understanding…')
          : isListening
            ? t('quicklog.listening', 'Listening… tap to stop')
            : t('quicklog.speak', 'Tap and speak')}
      </button>

      {isListening && (
        <Body size={11} color={T.ink400} style={{ textAlign: 'center', marginTop: 8 }}>
          {t('quicklog.example', 'e.g. "fed 10 minutes left side, then slept two hours"')}
        </Body>
      )}

      {typedOpen && (
        <div style={{ marginTop: 10 }}>
          <input
            autoFocus
            value={typedText}
            onChange={(e) => setTypedText(e.target.value.slice(0, 500))}
            onKeyDown={(e) => e.key === 'Enter' && submitTyped()}
            placeholder={t('quicklog.typePlaceholder', 'Type what happened…')}
            style={{ width: '100%', padding: '10px 12px', borderRadius: RADIUS.sm, border: `0.5px solid ${T.line}`, fontFamily: FONTS.sans, fontSize: 14, color: T.ink900, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={submitTyped} disabled={parse.isPending} style={{ flex: 1, padding: '10px', borderRadius: RADIUS.sm, border: 'none', background: T.brand, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
              {t('quicklog.parse', 'Log it')}
            </button>
            <button onClick={() => { setTypedOpen(false); setTypedText(''); }} style={{ padding: '10px 14px', borderRadius: RADIUS.sm, border: `0.5px solid ${T.line}`, background: 'transparent', color: T.ink400, fontSize: 13, cursor: 'pointer', fontFamily: FONTS.sans }}>
              {t('quicklog.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {status && (
        <Body size={12} color={status.kind === 'error' ? '#dc2626' : T.ink500} style={{ textAlign: 'center', marginTop: 10 }}>
          {status.msg}
          {status.kind === 'error' && /upgrade/i.test(status.msg) && (
            <button onClick={() => navigate('/premium')} style={{ marginLeft: 6, border: 'none', background: 'transparent', color: T.brand, fontWeight: 700, cursor: 'pointer' }}>
              {t('quicklog.upgrade', 'Premium')}
            </button>
          )}
        </Body>
      )}

      {/* One-tap row: Diaper + Meds (Feed/Sleep have their own quick actions) */}
      <Spacer h={12} />
      <div style={{ display: 'flex', gap: 8 }}>
        <TileBtn icon="diaper" label={t('quicklog.type.diaper', 'Diaper')} accent="#EBF4FF" onClick={() => openTap({ type: 'diaper', kind: 'wet' })} />
        <TileBtn icon="pill" label={t('quicklog.type.meds', 'Meds')} accent="#FAF1E2" onClick={() => openTap({ type: 'meds', name: '' })} />
      </div>

      <LogConfirmSheet
        open={sheet.open}
        events={sheet.events}
        method={sheet.method}
        child={child}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </Card>
  );
}
