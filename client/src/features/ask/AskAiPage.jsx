import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import useAuthStore from '../../stores/authStore';
import { useSelectedChild } from '../../hooks/useChild';
import { useDrBloom } from '../../hooks/useDrBloom';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T } from '../../components/cb/tokens';
import { differenceInDays } from 'date-fns';

const STORAGE_KEY = 'childbloom_voice_lang';

const LANG_OPTIONS = [
  { id: 'en', label: 'EN' },
  { id: 'hi', label: 'हिं' },
  { id: 'ml', label: 'മ' },
  { id: 'ta', label: 'த' },
  { id: 'te', label: 'తె' },
  { id: 'pa', label: 'ਪ' },
];

const DEFAULT_SUGGESTIONS = [
  'How is the IAP vaccine schedule different from the government schedule?',
  'What should I watch for in this developmental stage?',
  "Is my child's growth on track?",
  'What foods are best for brain development right now?',
];

export default function AskAiPage() {
  const profile = useAuthStore((s) => s.profile);
  const child = useSelectedChild();
  const [input, setInput] = useState('');
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const {
    messages,
    isStreaming,
    isEmergency,
    suggestedQuestions,
    error,
    sendMessage,
    clearConversation,
    sendSuggestedQuestion,
  } = useDrBloom();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput('');
    sendMessage(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLangChange = (lang) => {
    setVoiceLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setShowLangPicker(false);
  };

  const hasUserMessage = messages.some(m => m.role === 'user');
  const suggestions = suggestedQuestions.length > 0 ? suggestedQuestions : DEFAULT_SUGGESTIONS;
  const parentName = profile?.full_name?.split(' ')[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: T.bg, fontFamily: "-apple-system, 'Inter', system-ui, sans-serif" }}>

      {/* Nav bar */}
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={clearConversation}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', color: T.ink500 }}>
          <CBIcon name="trash" size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <CBLogoMark size={16} color={T.forest700} />
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink900, letterSpacing: '-0.01em' }}>Dr. Bloom</div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.forest500 }} />
          </div>
          {child && (
            <div style={{ fontSize: 10, color: T.ink300, marginTop: 1 }}>
              About {child.name}{ageInDays ? `, ${ageInDays}d` : ''}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLangPicker(!showLangPicker)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', color: T.ink500 }}>
            <CBIcon name="globe" size={17} />
          </button>
          {showLangPicker && (
            <div style={{ position: 'absolute', right: 0, top: 44, background: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50, minWidth: 160 }}>
              {LANG_OPTIONS.map(l => (
                <button key={l.id} onClick={() => handleLangChange(l.id)}
                  style={{ width: '100%', padding: '11px 16px', border: 'none', background: voiceLang === l.id ? T.forest50 : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: voiceLang === l.id ? T.forest700 : T.ink700, fontWeight: voiceLang === l.id ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {l.label}
                  {voiceLang === l.id && <CBIcon name="check" size={14} stroke={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px' }}>

        {/* Day label */}
        <div style={{ textAlign: 'center', fontSize: 11, color: T.ink300, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '4px 0 16px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>

        {/* Greeting if no messages */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.forest100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CBLogoMark size={14} color={T.forest700} />
            </div>
            <div style={{ maxWidth: '78%', padding: '12px 14px', borderRadius: '20px 20px 20px 4px', background: '#fff', fontSize: 14, lineHeight: 1.45, color: T.ink900 }}>
              {parentName ? `Good to see you, ${parentName}.` : 'Hello!'}{child ? ` I'm here for ${child.name} today.` : ''} What's on your mind?
            </div>
          </div>
        )}

        {/* Emergency banner */}
        {isEmergency && (
          <div style={{ margin: '8px 0', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.3)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.red, marginBottom: 4 }}>Emergency</div>
            <a href="tel:112" style={{ fontSize: 14, fontWeight: 600, color: T.red, textDecoration: 'none' }}>Call 112 immediately →</a>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ marginBottom: 10 }}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: '20px 20px 4px 20px', background: T.forest700, color: '#fff', fontSize: 14, lineHeight: 1.4 }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.forest100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CBLogoMark size={14} color={T.forest700} />
                </div>
                <div style={{ maxWidth: '78%' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '20px 20px 20px 4px', background: '#fff', fontSize: 14, lineHeight: 1.45, color: T.ink900 }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 6px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0', fontSize: 13.5, color: T.ink500 }}>{children}</ul>,
                        li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ color: T.ink900 }}>{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    {msg.isStreaming && (
                      <span style={{ display: 'inline-block', width: 6, height: 14, background: T.forest600, borderRadius: 2, marginLeft: 2, animation: 'pulse 1s infinite' }} />
                    )}
                  </div>
                  {/* Source chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    <div style={{ padding: '4px 9px', borderRadius: 99, background: '#fff', fontSize: 10.5, color: T.ink500, border: `0.5px solid ${T.ink100}`, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CBIcon name="book" size={11} /> IAP, 2024
                    </div>
                    <div style={{ padding: '4px 9px', borderRadius: 99, background: '#fff', fontSize: 10.5, color: T.ink500, border: `0.5px solid ${T.ink100}`, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CBIcon name="shield" size={11} /> Reviewed by pediatricians
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.forest100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CBLogoMark size={14} color={T.forest700} />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '20px 20px 20px 4px', background: '#fff', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.forest300, animation: `pulse ${0.6 + i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested follow-ups */}
        {!hasUserMessage && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {suggestions.slice(0, 3).map(s => (
              <button key={s} onClick={() => sendSuggestedQuestion ? sendSuggestedQuestion(s) : sendMessage(s)}
                style={{ padding: '7px 12px', borderRadius: 99, background: '#fff', border: `0.5px solid ${T.ink100}`, fontSize: 12, color: T.forest700, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,59,48,0.06)', border: `0.5px solid rgba(255,59,48,0.18)`, fontSize: 13, color: T.red, marginTop: 8 }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 12px 12px', background: `rgba(${T.bg.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.92)`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `0.5px solid ${T.ink100}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `0.5px solid ${T.ink100}` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Dr. Bloom anything…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: T.ink900, background: 'transparent', letterSpacing: '-0.005em', minWidth: 0 }}
            />
            <button style={{ border: 'none', background: 'transparent', color: T.ink300, cursor: 'pointer', display: 'flex' }}>
              <CBIcon name="mic" size={18} />
            </button>
          </div>
          {(input.trim() || isStreaming) && (
            <button onClick={handleSend} disabled={isStreaming}
              style={{ width: 40, height: 40, borderRadius: '50%', background: isStreaming ? T.ink200 : T.forest700, color: '#fff', border: 'none', cursor: isStreaming ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CBIcon name="send" size={16} />
            </button>
          )}
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: T.ink300, marginTop: 6 }}>
          Evidence-based · IAP · WHO · AAP · Not a substitute for your pediatrician
        </div>
      </div>
    </div>
  );
}
