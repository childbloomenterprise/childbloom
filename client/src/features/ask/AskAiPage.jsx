import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import useAuthStore from '../../stores/authStore';
import { useAchievements } from '../../hooks/useAchievements';

import { useSelectedChild } from '../../hooks/useChild';
import { useDrBloom } from '../../hooks/useDrBloom';
import CBIcon from '../../components/cb/CBIcon';
import CBLogoMark from '../../components/cb/CBLogoMark';
import { T, FONTS } from '../../components/cb/tokens';
import { Card, Chip, AIBubble, UserBubble, Body, Eyebrow, Spacer, HRow } from '../../components/cb/primitives';
import AiThinkingIndicator from '../../components/ui/AiThinkingIndicator';
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

// Ambient floating particle blob
function Particle({ top, left, right, bottom, size, color, delay, duration }) {
  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left, right, bottom,
      pointerEvents: 'none',
      animation: `bloom-particle ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }} />
  );
}

export default function AskAiPage() {
  const profile = useAuthStore((s) => s.profile);
  const child = useSelectedChild();

  const [input, setInput] = useState('');
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const ageInDays = child?.date_of_birth
    ? differenceInDays(new Date(), new Date(child.date_of_birth))
    : null;

  const navigate = useNavigate();

  const {
    messages, isStreaming, isEmergency, suggestedQuestions, error, limitReached,
    sendMessage, clearConversation, sendSuggestedQuestion,
  } = useDrBloom();

  const { tryUnlock, incrementBloomQuestions } = useAchievements();

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Show scroll-to-bottom button when user is far from bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput('');

    // Track for achievements (fire-and-forget, non-blocking)
    (async () => {
      const hour = new Date().getHours();
      const newCount = await incrementBloomQuestions();
      if (newCount === 1)  await tryUnlock('first_question');
      if (newCount === 5)  await tryUnlock('bloom_curious');
      if (newCount === 10) await tryUnlock('bloom_regular');
      if (newCount === 25) await tryUnlock('bloom_devoted');
      if (newCount === 50) await tryUnlock('bloom_expert');
      if (hour >= 22)      await tryUnlock('night_owl');
      if (hour < 6)        await tryUnlock('early_bird');
    })();

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

  const handleCopy = async (content, msgKey) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {}
  };

  const hasUserMessage = messages.some(m => m.role === 'user');
  const suggestions = suggestedQuestions.length > 0 ? suggestedQuestions : DEFAULT_SUGGESTIONS;
  const parentName = profile?.full_name?.split(' ')[0] || null;
  const charCount = input.length;

  return (
    <div
      data-theme-root
      style={{
        display: 'flex', flexDirection: 'column', height: '100dvh',
        background: T.bg, fontFamily: FONTS.sans,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* ── Ambient background particles ── */}
      <Particle top="12%" left="-50px"  size={200} color={T.brandWash}  delay={0} duration={14} />
      <Particle top="48%" right="-30px" size={130} color={T.accentSoft} delay={4} duration={11} />
      <Particle bottom="28%" left="18%" size={100} color={T.brandWash}  delay={8} duration={17} />
      <Particle top="72%" right="10%"   size={70}  color={T.brandTint}  delay={2} duration={20} />

      {/* ── Nav bar ── */}
      <div style={{
        padding: '52px 16px 10px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0, gap: 10, zIndex: 10,
      }}>
        {/* Clear chat */}
        <button
          onClick={clearConversation}
          style={{
            width: 38, height: 38, borderRadius: 999, background: T.surface,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: T.ink500,
            boxShadow: '0 0 0 1px rgba(11,23,20,0.06), 0 1px 3px rgba(11,23,20,0.04)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
          }}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onTouchEnd={e => e.currentTarget.style.transform = ''}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
        >
          <CBIcon name="trash" size={16} stroke={1.7} />
        </button>

        {/* Center — title + status */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
            {/* Avatar — breathes normally, glows while streaming */}
            <div style={{
              width: 26, height: 26, borderRadius: 999, background: T.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: isStreaming
                ? 'thinking-glow 1.5s ease-in-out infinite'
                : 'bloom-breathe 3s ease-in-out infinite',
              transition: 'box-shadow 0.4s ease',
            }}>
              <CBLogoMark size={14} color="#fff" />
            </div>
            <div style={{
              fontFamily: FONTS.serif, fontSize: 17, color: T.ink900, letterSpacing: '-0.02em',
            }}>
              Dr. Bloom
            </div>
            {/* Status dot — pulses green while streaming */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isStreaming ? T.brand : T.brandSoft,
              boxShadow: isStreaming ? `0 0 0 0 ${T.brand}` : 'none',
              animation: isStreaming ? 'online-pulse 1.2s ease-in-out infinite' : 'none',
              transition: 'background 0.3s ease',
            }} />
          </div>
          {child && (
            <div style={{ fontSize: 10, color: T.ink400, marginTop: 2 }}>
              {isStreaming ? 'typing…' : `About ${child.name}${ageInDays ? `, ${ageInDays}d` : ''}`}
            </div>
          )}
        </div>

        {/* Language picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            style={{
              width: 38, height: 38, borderRadius: 999, background: T.surface,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: T.ink500,
              boxShadow: '0 0 0 1px rgba(11,23,20,0.06), 0 1px 3px rgba(11,23,20,0.04)',
            }}
          >
            <CBIcon name="globe" size={17} stroke={1.7} />
          </button>
          {showLangPicker && (
            <div style={{
              position: 'absolute', right: 0, top: 46,
              background: T.surface, borderRadius: 16,
              boxShadow: '0 8px 28px rgba(11,23,20,0.12)',
              overflow: 'hidden', zIndex: 50, minWidth: 160,
              border: `1px solid ${T.ink100}`,
              animation: 'scale-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}>
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.id}
                  onClick={() => handleLangChange(l.id)}
                  style={{
                    width: '100%', padding: '11px 16px', border: 'none',
                    background: voiceLang === l.id ? T.brandTint : 'transparent',
                    cursor: 'pointer', textAlign: 'left', fontSize: 14,
                    color: voiceLang === l.id ? T.brand : T.ink700,
                    fontWeight: voiceLang === l.id ? 600 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: FONTS.sans,
                  }}
                >
                  {l.label}
                  {voiceLang === l.id && <CBIcon name="check" size={14} stroke={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 8px', position: 'relative', zIndex: 5 }}
      >
        {/* Date separator */}
        <div style={{
          textAlign: 'center', fontSize: 11, color: T.ink300, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase', margin: '4px 0 18px',
        }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>

        {/* Welcome message when empty */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14, animation: 'msg-in 0.4s ease-out both' }}>
            <AIBubble lead="Bloom · greeting" sparkle>
              {parentName ? `Good to see you, ${parentName}.` : 'Hello!'}
              {child ? ` I'm here for ${child.name} today.` : ''} What's on your mind?
            </AIBubble>
          </div>
        )}

        {/* Emergency banner */}
        {isEmergency && (
          <div style={{
            margin: '8px 0', padding: '12px 14px', borderRadius: 14,
            background: 'rgba(255,59,48,0.07)', border: '0.5px solid rgba(255,59,48,0.25)',
            animation: 'msg-in 0.3s ease-out both',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.red, marginBottom: 4 }}>
              Emergency
            </div>
            <a href="tel:112" style={{ fontSize: 14, fontWeight: 600, color: T.red, textDecoration: 'none' }}>
              Call 112 immediately →
            </a>
          </div>
        )}

        {/* Message list (live region for streaming AI responses) */}
        <div role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions text" className="sr-only">
          {messages.length > 0 && messages[messages.length - 1]?.content?.slice(0, 200)}
        </div>
        {messages.map((msg, i) => {
          const msgKey = msg.id ?? `msg-${i}`;
          const isCopied = copiedId === msgKey;
          return (
            <div
              key={msgKey}
              style={{
                marginBottom: 12, display: 'flex', flexDirection: 'column',
                animation: 'msg-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '0ms',
              }}
            >
              {msg.role === 'user' ? (
                <UserBubble>{msg.content}</UserBubble>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 999,
                    background: T.brandWash, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    animation: msg.isStreaming ? 'bloom-breathe 1.8s ease-in-out infinite' : 'none',
                  }}>
                    <CBLogoMark size={15} color={T.brand} />
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    {/* Bubble */}
                    <div style={{
                      padding: '12px 15px', borderRadius: '20px 20px 20px 4px',
                      background: T.surface,
                      boxShadow: 'var(--shadow-sm), var(--shadow-ring)',
                      fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.55, color: T.ink900,
                      position: 'relative',
                    }}>
                      <ReactMarkdown
                        components={{
                          p:      ({ children }) => <p style={{ margin: '0 0 6px 0', fontFamily: FONTS.sans }}>{children}</p>,
                          ul:     ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0', fontSize: 13.5, color: T.ink500 }}>{children}</ul>,
                          li:     ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ color: T.ink900, fontWeight: 600 }}>{children}</strong>,
                          code:   ({ children }) => <code style={{ background: T.surfaceDim, padding: '1px 5px', borderRadius: 4, fontSize: 12.5, fontFamily: 'monospace' }}>{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {/* Streaming cursor */}
                      {msg.isStreaming && (
                        <span
                          className="typewriter-cursor"
                          style={{ display: 'inline-block', width: 6, height: 14, background: T.brandSoft, borderRadius: 2, marginLeft: 2 }}
                        />
                      )}
                      {/* Copy button — always visible, subtle */}
                      {!msg.isStreaming && (
                        <button
                          onClick={() => handleCopy(msg.content, msgKey)}
                          title="Copy response"
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 26, height: 26, borderRadius: 7,
                            background: isCopied ? T.brandTint : 'rgba(11,23,20,0.04)',
                            border: `0.5px solid ${isCopied ? T.brand : 'rgba(11,23,20,0.08)'}`,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isCopied ? T.brand : T.ink400,
                            opacity: 0.6,
                            transition: 'opacity 0.2s ease, background 0.2s ease, color 0.2s ease',
                            animation: isCopied ? 'copy-flash 0.3s ease-out' : 'none',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                          onTouchStart={e => e.currentTarget.style.opacity = '1'}
                          onTouchEnd={e => e.currentTarget.style.opacity = '0.6'}
                        >
                          <CBIcon name={isCopied ? 'check' : 'copy'} size={12} stroke={2} />
                        </button>
                      )}
                    </div>
                    {/* Source tags */}
                    {!msg.isStreaming && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                        <Chip tone="surface" icon="book" style={{ fontSize: 10.5, height: 22 }}>IAP, 2024</Chip>
                        <Chip tone="surface" icon="shield" style={{ fontSize: 10.5, height: 22 }}>Reviewed by pediatricians</Chip>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* AI thinking — brand moment, not a spinner. Shows while streaming
            but before the first assistant chunk arrives. */}
        <AiThinkingIndicator
          visible={isStreaming && messages[messages.length - 1]?.role !== 'assistant'}
        />

        {/* Suggestion chips — only before first user message */}
        {!hasUserMessage && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
            {suggestions.slice(0, 3).map((s, i) => (
              <Chip
                key={`sug-${i}`}
                tone="surface"
                onClick={() => sendSuggestedQuestion ? sendSuggestedQuestion(s) : sendMessage(s)}
                style={{
                  color: T.brand, border: `0.5px solid ${T.ink100}`,
                  height: 'auto', padding: '7px 13px',
                  whiteSpace: 'normal', maxWidth: '100%',
                  animation: `msg-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 90}ms both`,
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
              >
                {s}
              </Chip>
            ))}
          </div>
        )}

        {/* Free limit upgrade prompt */}
        {limitReached && (
          <div style={{
            margin: '8px 0', padding: '16px', borderRadius: 16,
            background: T.brandTint, border: `0.5px solid ${T.brandSoft}`,
            animation: 'msg-in 0.3s ease-out both',
          }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 16, color: T.ink900, fontStyle: 'italic', marginBottom: 6 }}>
              You've used your free chats this week.
            </div>
            <div style={{ fontSize: 13, color: T.ink500, marginBottom: 12, lineHeight: 1.5 }}>
              Upgrade to Premium for unlimited Dr. Bloom, weekly AI insights, and doctor-ready PDFs.
            </div>
            <button
              onClick={() => navigate('/premium')}
              style={{
                padding: '10px 20px', borderRadius: 999, border: 'none',
                background: T.brand, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONTS.sans,
              }}
            >
              Upgrade — ₹179/mo
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(255,59,48,0.06)', border: '0.5px solid rgba(255,59,48,0.18)',
            fontSize: 13, color: T.red, marginTop: 8,
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          style={{
            position: 'absolute', bottom: 96, right: 16, zIndex: 20,
            width: 36, height: 36, borderRadius: 999,
            background: T.surface, border: `0.5px solid ${T.ink100}`,
            boxShadow: '0 4px 16px rgba(11,23,20,0.14)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.brand, animation: 'fab-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          <CBIcon name="chevron-down" size={16} stroke={2.2} />
        </button>
      )}

      {/* ── Composer ── */}
      <div style={{
        padding: '10px 12px 14px',
        background: 'rgba(242,240,234,0.94)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${T.ink100}`,
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Input row */}
          <div style={{
            flex: 1, background: T.surface, borderRadius: 999, padding: '9px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            border: `0.5px solid ${input.length > 0 ? T.brandSoft : T.ink100}`,
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.25s ease',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Dr. Bloom anything…"
              aria-label="Type a question for Dr. Bloom"
              maxLength={2000}
              autoComplete="off"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 14,
                color: T.ink900, background: 'transparent', letterSpacing: '-0.005em',
                minWidth: 0, fontFamily: FONTS.sans,
              }}
            />
            {/* Character count — appears after 80 chars */}
            {charCount > 80 && (
              <span style={{
                fontSize: 10, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                color: charCount > 500 ? T.red : T.ink300,
                transition: 'color 0.2s ease',
              }}>
                {charCount}
              </span>
            )}
            <button aria-label="Voice input (coming soon)" style={{ border: 'none', background: 'transparent', color: T.ink300, cursor: 'pointer', display: 'flex', padding: 0 }}>
              <CBIcon name="mic" size={18} stroke={1.7} />
            </button>
          </div>

          {/* Send button — animates in when input has text */}
          {(input.trim() || isStreaming) && (
            <button
              onClick={handleSend}
              disabled={isStreaming}
              aria-label={isStreaming ? 'Dr. Bloom is responding' : 'Send question to Dr. Bloom'}
              style={{
                width: 42, height: 42, borderRadius: 999,
                background: isStreaming ? T.ink200 : T.brand, color: '#fff',
                border: 'none', cursor: isStreaming ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isStreaming ? 'none' : '0 3px 12px rgba(15,61,46,0.35)',
                animation: 'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                transition: 'background 0.2s ease, box-shadow 0.2s ease',
              }}
              onTouchStart={e => { if (!isStreaming) e.currentTarget.style.transform = 'scale(0.9)'; }}
              onTouchEnd={e => e.currentTarget.style.transform = ''}
            >
              <CBIcon name="send" size={16} stroke={1.8} />
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: 'center', fontSize: 10, color: T.ink300, marginTop: 7, letterSpacing: '-0.005em' }}>
          Evidence-based · IAP · WHO · AAP · Not a substitute for your pediatrician
        </div>
      </div>
    </div>
  );
}
