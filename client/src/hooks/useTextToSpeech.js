import { useState, useRef, useCallback } from 'react';

const LANG_MAP = {
  ml: 'ml-IN',
  ta: 'ta-IN',
  en: 'en-IN',
};

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const usingBrowserTTSRef = useRef(false);

  const stop = useCallback(() => {
    if (usingBrowserTTSRef.current) {
      window.speechSynthesis?.cancel();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    usingBrowserTTSRef.current = false;
  }, []);

  const speakWithBrowserTTS = useCallback((text, language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      usingBrowserTTSRef.current = false;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      usingBrowserTTSRef.current = false;
    };
    usingBrowserTTSRef.current = true;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text, language = 'en') => {
    // Stop anything currently playing
    stop();

    try {
      const token = localStorage.getItem('sb-access-token');
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) throw new Error('tts_unavailable');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
      audioRef.current = audio;
      usingBrowserTTSRef.current = false;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        speakWithBrowserTTS(text, language);
      };

      await audio.play();
    } catch {
      speakWithBrowserTTS(text, language);
    }
  }, [stop, speakWithBrowserTTS]);

  return { speak, stop, isSpeaking };
}
