import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import api from '../../lib/api';
import { useSelectedChild } from '../../hooks/useChild';
import { formatAgeInDays } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ChatIcon, SendIcon } from '../../assets/icons';
import LanguageVoiceSelector from '../../components/LanguageVoiceSelector';
import VoiceInput from '../../components/VoiceInput';
import SpeakerButton from '../../components/SpeakerButton';

const STORAGE_KEY = 'childbloom_voice_lang';

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
  const [voiceLang, setVoiceLang] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLangChange = (lang) => {
    setVoiceLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const askMutation = useMutation({
    mutationFn: async (question) => {
      const response = await api.post('/api/ai/ask', {
        question,
        child_name: child?.name,
        age_in_days: child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
        gender: child?.gender,
      });
      return response.answer || "I'm sorry, I couldn't generate a response. Please try again.";
    },
  });

  const sendMessage = async (question) => {
    const q = question.trim();
    if (!q) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    try {
      const answer = await askMutation.mutateAsync(q);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('askAi.errorMessage') },
      ]);
    }
  };

  const handleSend = () => sendMessage(input);

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

  const handleSuggestedQuestion = (q) => {
    sendMessage(q);
  };

  const name = child?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]">
      <div className="mb-3">
        <h1 className="text-h1 font-serif text-forest-700">{t('askAi.title')}</h1>
        <p className="text-body text-gray-500 mt-1">
          {name ? t('askAi.subtitle', { name }) : t('askAi.subtitleGeneric')}
        </p>
        {/* Language selector */}
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
            {/* Suggested questions based on voiceLang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(SUGGESTED_QUESTIONS[voiceLang] || SUGGESTED_QUESTIONS.en).map((q) => (
                <Card
                  key={q}
                  hover
                  className="p-3.5 cursor-pointer"
                  onClick={() => handleSuggestedQuestion(q)}
                >
                  <p className="text-caption text-gray-600">{q}</p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forest-700 text-white rounded-br-md'
                    : 'bg-white border border-cream-300 text-gray-700 rounded-bl-md shadow-card'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-line">{msg.content}</p>
                ) : (
                  <>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-forest-700">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      }}
                    >{msg.content}</ReactMarkdown>
                    {/* Speaker button bottom-right of Dr. Bloom bubble */}
                    <div className="flex justify-end mt-2">
                      <SpeakerButton text={msg.content} language={voiceLang} size={32} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-cream-300 rounded-2xl rounded-bl-md px-4 py-3 shadow-card">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
                <div className="w-2 h-2 bg-forest-300 rounded-full thinking-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-cream-300/60 pt-3 sm:pt-4">
        <div className="flex gap-2.5 items-end">
          {/* Voice input — left of textarea */}
          <VoiceInput
            language={voiceLang}
            onTranscript={handleVoiceTranscript}
            onError={() => {}}
            size={48}
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={name ? `Ask Dr. Bloom about ${name}...` : t('askAi.placeholder')}
            rows={1}
            className="input-field flex-1 resize-none min-h-[48px] max-h-32"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || askMutation.isPending}
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
