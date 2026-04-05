import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { useSelectedChild } from '../../hooks/useChild';
import { formatAgeInDays } from '../../lib/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import MedicalDisclaimer from '../../components/layout/MedicalDisclaimer';
import { ChatIcon, SendIcon } from '../../assets/icons';

export default function AskAiPage() {
  const { t } = useTranslation();
  const child = useSelectedChild();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question) => {
      const response = await api.post('/api/ai/ask', {
        question,
        child_name: child?.name,
        age_in_days: child?.date_of_birth ? formatAgeInDays(child.date_of_birth) : null,
        gender: child?.gender,
      });
      return response.data?.answer || response.answer || 'I\'m sorry, I couldn\'t generate a response. Please try again.';
    },
  });

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);

    try {
      const answer = await askMutation.mutateAsync(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('askAi.errorMessage') },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    t('askAi.suggestedQ1'),
    t('askAi.suggestedQ2'),
    t('askAi.suggestedQ3'),
    t('askAi.suggestedQ4'),
    t('askAi.suggestedQ5'),
    t('askAi.suggestedQ6'),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]">
      <div className="mb-4">
        <h1 className="text-h1 font-serif text-forest-700">{t('askAi.title')}</h1>
        <p className="text-body text-gray-500 mt-1">
          {child?.name ? t('askAi.subtitle', { name: child.name }) : t('askAi.subtitleGeneric')}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-forest-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChatIcon className="w-7 h-7 text-forest-600" />
              </div>
              <p className="text-body text-gray-500">
                {t('askAi.askAnything')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestedQuestions.map((q) => (
                <Card
                  key={q}
                  hover
                  className="p-3.5 cursor-pointer"
                  onClick={() => setInput(q)}
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
                <p className="whitespace-pre-line">{msg.content}</p>
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

      {/* Input */}
      <div className="border-t border-cream-300/60 pt-3 sm:pt-4">
        <div className="flex gap-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('askAi.placeholder')}
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
        <MedicalDisclaimer className="mt-2.5" />
      </div>
    </div>
  );
}
