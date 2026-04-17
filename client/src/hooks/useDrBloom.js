import { useState, useCallback, useRef } from 'react';
import { useSelectedChild } from './useChild';

const STORAGE_KEY = 'childbloom_voice_lang';
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export function useDrBloom() {
  const selectedChild = useSelectedChild();
  const language = localStorage.getItem(STORAGE_KEY) || 'en';

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showDisclaimerCard, setShowDisclaimerCard] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [currentIntent, setCurrentIntent] = useState('warm');
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isStreaming) return;
    if (!selectedChild?.id) {
      setError('Please select a child first.');
      return;
    }

    setError(null);
    setIsEmergency(false);
    setShowDisclaimerCard(false);

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    const conversationHistory = messages
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const assistantMessageId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      metadata: null,
    }]);

    try {
      const token = localStorage.getItem('sb-access-token');
      if (!token) throw new Error('Not authenticated');

      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          childId: selectedChild.id,
          language: localStorage.getItem(STORAGE_KEY) || 'en',
          conversationHistory,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Dr. Bloom is unavailable right now');

      const contentType = response.headers.get('Content-Type') || '';

      // Emergency returns plain JSON
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.type === 'emergency') {
          setIsEmergency(true);
          setShowDisclaimerCard(true);
          setMessages(prev => prev.map(m =>
            m.id === assistantMessageId
              ? { ...m, content: data.content, isStreaming: false, isEmergency: true }
              : m
          ));
          return;
        }
      }

      // SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue; // skip malformed SSE lines
          }

          if (event.type === 'metadata') {
            setCurrentIntent(event.intent);
            setShowDisclaimerCard(event.showDisclaimerCard);
            setSuggestedQuestions(event.suggestedQuestions || []);
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId ? { ...m, metadata: event } : m
            ));
          } else if (event.type === 'text') {
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: m.content + event.content }
                : m
            ));
          } else if (event.type === 'done') {
            setSuggestedQuestions(event.suggestedQuestions || []);
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId ? { ...m, isStreaming: false } : m
            ));
          } else if (event.type === 'error') {
            throw new Error(event.message); // propagates to outer catch
          }
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
    } finally {
      setIsStreaming(false);
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId ? { ...m, isStreaming: false } : m
      ));
    }
  }, [messages, isStreaming, selectedChild]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setIsEmergency(false);
    setShowDisclaimerCard(false);
    setSuggestedQuestions([]);
    setError(null);
  }, []);

  const sendSuggestedQuestion = useCallback((question) => {
    setSuggestedQuestions([]);
    sendMessage(question);
  }, [sendMessage]);

  return {
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
  };
}
