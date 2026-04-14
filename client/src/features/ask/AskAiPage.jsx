import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useSelectedChild } from '../../hooks/useChild';
import { formatAgeInDays } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ChatIcon, SendIcon } from '../../assets/icons';
import LanguageVoiceSelector from '../../components/LanguageVoiceSelector';
import VoiceInput from '../../components/VoiceInput';
import SpeakerButton from '../../components/SpeakerButton';

const STORAGE_KEY = 'childbloom_voice_lang';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const SUGGESTED_QUESTIONS = {
  en: [
    "Is my baby's weight normal for their age?",
    "Why does my baby cry so much at night?",
    "What foods should I introduce at 8 months?",
  ],
  ml: [
    "എന്റെ കുഞ്ഞിന്റെ ഭാരം ശരിയാണോ?",
    "കുഞ്ഞ് രാത്രി ഇത്ര കരയുന്നത് എന്തുകൊണ്ട്?",
    "8 മാസത്തിൽ എന്ത് ഭക്ഷണം കൊടുക്കണം?",
  ],
  ta: [
    "என் குழந்தையின் எடை சரியானதா?",
    "குழந்தை இரவில் ஏன் அதிகமாக அழுகிறது?",
    "8 மாதத்தில் என்ன உணவு கொடுக்கணும்?",
  ],
};

export default function AskAiPage() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceLang, setVoiceLang] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancelling in-flight streams

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleLangChange = (lang) => {
    setVoiceLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // ── Stream a message from Dr. Bloom ──────────────
  const sendMessage = useCallback(async (question) => {
    const q = question.trim();
    if (!q || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: q }]);

    // Add placeholder assistant message with unique id
    const msgId = `stream-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: msgId, streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem('sb-access-token');
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: q,
          child_name: child?.name,
          age_in_days: child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
          gender: child?.gender,
          language: voiceLang,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // ── SSE streaming path ──────────────────────
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const { text } = JSON.parse(data);
              if (text) {
                setMessages(prev =>
                  prev.map(m => m.id === msgId ? { ...m, content: m.content + text } : m)
                );
              }
            } catch { /* ignore malformed chunks */ }
          }
        }
      } else {
        // ── Fallback: JSON response ─────────────────
        const json = await response.json();
        const text = json.answer || t('askAi.errorMessage');
        setMessages(prev =>
          prev.map(m => m.id === msgId ? { ...m, content: text } : m)
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // user navigated away
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, content: t('askAi.errorMessage') }
            : m
        )
      );
    } finally {
      // Mark message as done streaming
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, streaming: false } : m)
      );
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [child, isStreaming, t]);

  // Cancel stream on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSend = () => sendMessage(input);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const handleVoiceTranscript = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const name = child?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]">
      <div className="mb-3">
        <h1 className="text-h1 font-serif text-forest-700">{t('askAi.title')}</h1>
        <p className="text-body text-gray-500 mt-1">
          {name ? t('askAi.subtitle', { name }) : t('askAi.subtitleGeneric')}
        </p>
        <div className="mt-3">
          <LanguageVoiceSelector selected={voiceLang} onChange={handleLangChange} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                <ChatIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-forest-700">{t('askAi.doctorName')}</p>
              <p className="text-caption text-gray-400 mt-1">{t('askAi.askAnything')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(SUGGESTED_QUESTIONS[voiceLang] || SUGGESTED_QUESTIONS.en).map((q) => (
                <Card key={q} hover className="p-3.5 cursor-pointer" onClick={() => sendMessage(q)}>
                  <p className="text-caption text-gray-600">{q}</p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-body leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-forest-700 text-white rounded-br-md'
                  : 'bg-white border border-cream-300 text-gray-700 rounded-bl-md shadow-card'
              }`}>
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
                      /* Thinking dots while first chunk loads */
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                        <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                        <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                      </div>
                    )}
                    {/* Streaming cursor */}
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-0.5 h-4 bg-forest-400 ml-0.5 typewriter-cursor align-middle" />
                    )}
                    {/* Speaker button — only when done streaming */}
                    {!msg.streaming && msg.content && (
                      <div className="flex justify-end mt-2">
                        <SpeakerButton text={msg.content} language={voiceLang} size={32} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
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
            placeholder={name ? `Ask Dr. Bloom about ${name}…` : t('askAi.placeholder')}
            rows={1}
            className="input-field flex-1 resize-none min-h-[48px] max-h-32"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="self-end h-[48px] w-[48px] flex-shrink-0"
          >
            <SendIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
