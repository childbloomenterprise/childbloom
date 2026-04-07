import { useEffect } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const MIC_DENIED_MSG = {
  en: 'Please allow microphone access in browser settings',
  ml: 'ബ്രൗസർ സെറ്റിംഗ്സിൽ മൈക്രോഫോൺ അനുവദിക്കുക',
  ta: 'உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதிக்கவும்',
};

export default function VoiceInput({ language = 'en', onTranscript, onError, size = 44 }) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // When listening stops and we have a transcript, fire callback
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Forward errors
  useEffect(() => {
    if (error && onError) {
      const msg = error === 'microphone_denied'
        ? (MIC_DENIED_MSG[language] || MIC_DENIED_MSG.en)
        : error;
      onError(msg);
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isSupported) return null;

  const handleClick = () => {
    if (isListening) stopListening();
    else startListening(language);
  };

  const ariaLabel = isListening ? 'Listening, tap to stop' : 'Tap to speak';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      style={{ minWidth: size, minHeight: size, width: size, height: size }}
      className={`
        relative flex items-center justify-center rounded-full
        border transition-all duration-200 flex-shrink-0
        active:scale-95
        ${isListening
          ? 'bg-red-500 border-red-400 shadow-lg'
          : 'bg-white border-gray-300 hover:border-teal-400 hover:bg-teal-50'
        }
      `}
    >
      {isListening && (
        <span
          className="absolute inset-0 rounded-full bg-red-400 opacity-60"
          style={{ animation: 'voicePulse 1.5s ease-in-out infinite' }}
        />
      )}

      {isListening ? (
        // White mic on red
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          style={{ width: size * 0.45, height: size * 0.45, position: 'relative', zIndex: 1 }}
        >
          <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4z" />
          <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" />
        </svg>
      ) : (
        // Teal mic idle
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1D9E75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: size * 0.45, height: size * 0.45 }}
        >
          <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4z" />
          <path d="M19 11a7 7 0 01-14 0M12 18v3M8 21h8" />
        </svg>
      )}

      <style>{`
        @keyframes voicePulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.3; }
        }
      `}</style>
    </button>
  );
}
