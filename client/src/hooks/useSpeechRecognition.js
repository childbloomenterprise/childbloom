import { useState, useRef, useEffect, useCallback } from 'react';

const LANG_MAP = {
  ml: 'ml-IN',
  ta: 'ta-IN',
  en: 'en-IN',
};

const isSupported =
  typeof window !== 'undefined' &&
  ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

export default function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  const startListening = useCallback((language = 'en') => {
    if (!isSupported) return;
    setError(null);
    setTranscript('');

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[language] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) setTranscript(finalTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('microphone_denied');
      else if (event.error === 'network') setError('network_error');
      else if (event.error === 'no-speech') setError('no_speech');
      else setError('unknown_error');
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();

    // Auto-stop after 10 seconds
    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, 10000);
  }, [stopListening]);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening: listening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
