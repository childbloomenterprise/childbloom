import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import useAuthStore from '../../stores/authStore';
import { useDrBloom } from '../../hooks/useDrBloom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DisclaimerCard from '../../components/ui/DisclaimerCard';
import EmergencyAlert from '../../components/ui/EmergencyAlert';
import LanguageVoiceSelector from '../../components/LanguageVoiceSelector';
import VoiceInput from '../../components/VoiceInput';
import SpeakerButton from '../../components/SpeakerButton';
import { SendIcon } from '../../assets/icons';

const STORAGE_KEY = 'childbloom_voice_lang';

function getLocalGreeting(childName, parentFirstName) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const parent = parentFirstName ? `, ${parentFirstName}` : '';
  const child = childName ? ` I'm here for ${childName} today.` : '';
  return `${time}${parent}.${child} What's on your mind?`;
}

export default function AskAiPage() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const [input, setInput] = useState('');
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isStreaming,
    isEmergency,
    showDisclaimerCard,
    suggestedQuestions,
    currentIntent,
    error,
    sendMessage,
    stopStreaming,
    clearConversation,
    sendSuggestedQuestion,
  } = useDrBloom();

  // Local greeting message (instant, no API cost)
  const [greeting] = useState(() => {
    const parentFirst = profile?.full_name?.split(' ')[0];
    return getLocalGreeting(null, parentFirst);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLangChange = (lang) => {
    setVoiceLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

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

  const handleVoiceTranscript = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // Show suggestions only before first user message
  const hasUserMessage = messages.some(m => m.role === 'user');
  const showSuggestions = !hasUserMessage && suggestedQuestions.length > 0;
  const showDefaultSuggestions = !hasUserMessage && suggestedQuestions.length === 0;

  const defaultSuggestions = [
    'How is the IAP vaccine schedule different from the government schedule?',
    `What should I watch for in this developmental stage?`,
    `Is my child's growth on track?`,
    'What foods are best for brain development right now?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]">

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-h1 font-serif text-forest-700">{t('askAi.title')}</h1>
            {currentIntent === 'clinical' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 tracking-wide">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Clinical mode
              </span>
            )}
          </div>
          <p className="text-body text-gray-500 mt-0.5 text-sm">
            Evidence-based pediatric guidance · WHO · IAP · AAP
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
          <LanguageVoiceSelector selected={voiceLang} onChange={handleLangChange} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">

        {/* Greeting (local, instant) */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-cream-300 px-4 py-3 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🌸</span>
                </div>
                <span className="text-xs font-semibold text-forest-700">Dr. Bloom</span>
              </div>
              <p className="text-body text-gray-700 leading-relaxed">{greeting}</p>
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-body leading-relaxed ${
              msg.role === 'user'
                ? 'bg-forest-700 text-white rounded-br-md'
                : 'bg-white border border-cream-300 text-gray-700 rounded-bl-md shadow-card'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px]">🌸</span>
                  </div>
                  <span className="text-[11px] font-semibold text-forest-700">Dr. Bloom</span>
                  {msg.metadata?.intent === 'clinical' && (
                    <span className="text-[10px] text-blue-500 font-medium">· clinical</span>
                  )}
                </div>
              )}

              {msg.role === 'user' ? (
                <p className="whitespace-pre-line">{msg.content}</p>
              ) : (
                <>
                  {msg.content ? (
                    <ReactMarkdown
                      components={{
                        p:      ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-forest-700">{children}</strong>,
                        ul:     ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex gap-1.5 py-1">
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                    </div>
                  )}
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block w-0.5 h-4 bg-forest-400 ml-0.5 typewriter-cursor align-middle" />
                  )}
                  {!msg.isStreaming && msg.content && (
                    <div className="flex justify-end mt-2">
                      <SpeakerButton text={msg.content} language={voiceLang} size={28} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Emergency alert */}
        {isEmergency && (
          <EmergencyAlert />
        )}

        {/* Disclaimer card */}
        {showDisclaimerCard && !isEmergency && (
          <DisclaimerCard />
        )}

        {/* Suggested questions (from Dr. Bloom metadata) */}
        {showSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1 pt-1">
            {suggestedQuestions.map((q) => (
              <Card key={q} hover className="p-3 cursor-pointer" onClick={() => sendSuggestedQuestion(q)}>
                <p className="text-caption text-gray-600 leading-snug">{q}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Default suggestions before first message */}
        {showDefaultSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1 pt-1">
            {defaultSuggestions.map((q) => (
              <Card key={q} hover className="p-3 cursor-pointer" onClick={() => sendMessage(q)}>
                <p className="text-caption text-gray-600 leading-snug">{q}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-1 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-cream-300/60 pt-3 sm:pt-4">
        <div className="flex gap-2.5 items-end">
          <VoiceInput language={voiceLang} onTranscript={handleVoiceTranscript} onError={() => {}} size={48} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dr. Bloom…"
            rows={1}
            className="input-field flex-1 resize-none min-h-[48px] max-h-32"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="self-end h-[48px] w-[48px] flex-shrink-0 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              title="Stop"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="self-end h-[48px] w-[48px] flex-shrink-0"
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          )}
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          Dr. Bloom · Evidence-based AI · Always consult your pediatrician for medical decisions
        </p>
      </div>
    </div>
  );
}
