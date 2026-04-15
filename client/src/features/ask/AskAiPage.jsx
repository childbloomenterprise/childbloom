import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import useAuthStore from '../../stores/authStore';
import { useSelectedChild } from '../../hooks/useChild';
import { formatAgeInDays } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SendIcon } from '../../assets/icons';
import LanguageVoiceSelector from '../../components/LanguageVoiceSelector';
import VoiceInput from '../../components/VoiceInput';
import SpeakerButton from '../../components/SpeakerButton';

const STORAGE_KEY = 'childbloom_voice_lang';
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Age-specific suggested questions using child's actual name
function getSuggestedQuestions(ageInDays, childName, language) {
  const name = childName || 'my baby';
  const weeks = Math.floor(ageInDays / 7);
  const months = Math.floor(ageInDays / 30);

  const enQuestions = (() => {
    if (weeks <= 4)   return [`Why does ${name} cry so much at night?`, `Is ${name}'s feeding pattern normal?`, `What can ${name} see right now?`];
    if (weeks <= 12)  return [`When should ${name} start smiling?`, `How much sleep does ${name} need?`, `Is ${name}'s weight gain on track?`];
    if (weeks <= 26)  return [`When should I introduce solid foods to ${name}?`, `Why does ${name} put everything in their mouth?`, `How do I know if ${name} is ready to sit?`];
    if (months <= 12) return [`When will ${name} start walking?`, `How many words should ${name} have by now?`, `Why does ${name} have separation anxiety?`];
    if (months <= 24) return [`How do I handle ${name}'s tantrums?`, `Is ${name}'s speech development on track?`, `How much screen time is okay for ${name}?`];
    return [`What should ${name} be learning at this age?`, `How do I prepare ${name} for school?`, `What foods are best for ${name}'s development?`];
  })();

  const localQuestions = {
    ml: [`${name}-ന്റെ ഭാരം ശരിയാണോ?`, `${name} രാത്രി ഇത്ര കരയുന്നത് എന്തുകൊണ്ട്?`, `${months < 6 ? '8' : '12'} മാസത്തിൽ എന്ത് ഭക്ഷണം കൊടുക്കണം?`],
    ta: [`${name}-ன் எடை சரியானதா?`, `${name} இரவில் ஏன் அதிகமாக அழுகிறது?`, `${months < 6 ? '8' : '12'} மாதத்தில் என்ன உணவு கொடுக்கணும்?`],
    hi: [`${name} का वज़न सही है?`, `${name} रात में इतना क्यों रोता है?`, `${name} के लिए इस उम्र में क्या खाना सही है?`],
    te: [`${name} బరువు సరిగ్గా ఉందా?`, `${name} రాత్రి ఎందుకు ఏడుస్తుంది?`, `${name}కి ఏ వయసులో పప్పు పెట్టాలి?`],
  };

  return localQuestions[language] || enQuestions;
}

export default function AskAiPage() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const profile = useAuthStore((s) => s.profile);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [openingLoaded, setOpeningLoaded] = useState(false);
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleLangChange = (lang) => {
    setVoiceLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // ── Stream helper (shared by opening + user messages) ─────
  const streamFromApi = useCallback(async (body, msgId, isOpening = false) => {
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
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
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
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: m.content + text } : m));
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        const json = await response.json();
        const text = json.answer || t('askAi.errorMessage');
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: text } : m));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!isOpening) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: t('askAi.errorMessage') } : m));
      } else {
        // Opening message fallback
        const timeHour = new Date().getHours();
        const greeting = timeHour < 12 ? 'Good morning' : timeHour < 17 ? 'Good afternoon' : 'Good evening';
        const parentFirst = profile?.full_name?.split(' ')[0];
        const fallback = `${greeting}${parentFirst ? `, ${parentFirst}` : ''}. ${child?.name ? `${child.name} is lucky to have you. ` : ''}What is on your mind today?`;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fallback } : m));
      }
    } finally {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [child, profile, t]);

  // ── Generate opening message on mount ────────────
  useEffect(() => {
    if (openingLoaded) return;
    setOpeningLoaded(true);
    setIsStreaming(true);

    const msgId = `opening-${Date.now()}`;
    setMessages([{ role: 'assistant', content: '', id: msgId, streaming: true }]);

    const ageInDays = child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : null;
    const parentMood = localStorage.getItem('childbloom_parent_mood_today');
    const lang = localStorage.getItem(STORAGE_KEY) || 'en';

    // 5-second timeout → show fallback
    const timeoutId = setTimeout(() => {
      const timeHour = new Date().getHours();
      const greeting = timeHour < 12 ? 'Good morning' : timeHour < 17 ? 'Good afternoon' : 'Good evening';
      const parentFirst = profile?.full_name?.split(' ')[0];
      const fallback = `${greeting}${parentFirst ? `, ${parentFirst}` : ''}. ${child?.name ? `${child.name} is lucky to have you. ` : ''}What is on your mind today?`;
      setMessages([{ role: 'assistant', content: fallback, id: msgId, streaming: false }]);
      setIsStreaming(false);
      abortRef.current?.abort();
    }, 5000);

    streamFromApi({
      opening_message: true,
      child_name: child?.name,
      child_id: child?.id,
      age_in_days: ageInDays,
      gender: child?.gender,
      language: lang,
      parent_mood: parentMood,
    }, msgId, true).then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel stream on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // ── Send user message ─────────────────────────────
  const sendMessage = useCallback(async (question) => {
    const q = question.trim();
    if (!q || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content: q }]);

    const msgId = `stream-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: msgId, streaming: true }]);

    await streamFromApi({
      question: q,
      child_name: child?.name,
      child_id: child?.id,
      age_in_days: child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
      gender: child?.gender,
      language: voiceLang,
    }, msgId, false);
  }, [child, isStreaming, voiceLang, streamFromApi]);

  const handleSend = () => sendMessage(input);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleVoiceTranscript = (text) => { setInput(text); inputRef.current?.focus(); };

  const name = child?.name;
  const ageInDays = child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : 0;
  const suggestedQuestions = getSuggestedQuestions(ageInDays, name, voiceLang);
  // Only show suggested questions when there's exactly the opening message (1 msg) and it's done streaming
  const showSuggestions = messages.length === 1 && !messages[0]?.streaming && messages[0]?.content;

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
        {messages.map((msg, i) => (
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
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                      <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                    </div>
                  )}
                  {msg.streaming && msg.content && (
                    <span className="inline-block w-0.5 h-4 bg-forest-400 ml-0.5 typewriter-cursor align-middle" />
                  )}
                  {!msg.streaming && msg.content && (
                    <div className="flex justify-end mt-2">
                      <SpeakerButton text={msg.content} language={voiceLang} size={32} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Suggested question chips — shown after opening message loads */}
        {showSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1 pt-1">
            {suggestedQuestions.map((q) => (
              <Card key={q} hover className="p-3 cursor-pointer" onClick={() => sendMessage(q)}>
                <p className="text-caption text-gray-600">{q}</p>
              </Card>
            ))}
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
        <p className="text-center text-xs text-gray-400 mt-2">
          Dr. Bloom is AI and can make mistakes. Always consult your pediatrician.
        </p>
      </div>
    </div>
  );
}
