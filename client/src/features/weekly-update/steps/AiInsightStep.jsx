import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import SpeakerButton from '../../../components/SpeakerButton';
import useTextToSpeech from '../../../hooks/useTextToSpeech';

export default function AiInsightStep({ insight, loading, childName, parentName, weekNumber, onRetry, voiceLang = 'en' }) {
  const name = childName || 'your little one';
  const parent = parentName || '';
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const hasAutoSpokenRef = useRef(false);
  const today = format(new Date(), 'MMMM d, yyyy');

  // Auto-speak 800ms after insight arrives
  useEffect(() => {
    if (insight && !loading && !hasAutoSpokenRef.current) {
      hasAutoSpokenRef.current = true;
      const timer = setTimeout(() => {
        speak(insight, voiceLang);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [insight, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!insight) hasAutoSpokenRef.current = false;
  }, [insight]);

  if (loading) {
    return (
      <div className="text-center py-12 space-y-5">
        <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex justify-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
        </div>
        <p className="text-sm font-serif italic text-gray-500">
          Dr. Bloom is writing {name}'s letter…
        </p>
      </div>
    );
  }

  return (
    <div className="weekly-letter max-w-lg mx-auto">
      {/* Letter header */}
      <div className="flex justify-between items-baseline mb-6 pb-4 border-b border-cream-300">
        <span className="font-serif text-sm text-gray-500 italic">A note from Dr. Bloom</span>
        <span className="text-xs text-gray-400">
          {weekNumber ? `Week ${weekNumber} · ` : ''}{today}
        </span>
      </div>

      {/* Salutation */}
      {parent && (
        <div className="font-serif text-lg text-gray-800 mb-4">
          Dear {parent},
        </div>
      )}

      {/* Body */}
      <div className="font-serif text-base leading-relaxed text-gray-700 space-y-4 whitespace-pre-line">
        {insight}
      </div>

      {/* Speaking bar */}
      {isSpeaking && (
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-forest-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-forest-600 font-medium">Dr. Bloom is speaking</span>
            <svg viewBox="0 0 24 18" width="24" height="18" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="6" width="4" height="6" rx="2" fill="#1D9E75">
                <animate attributeName="height" values="6;12;6" dur="0.8s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="y" values="6;3;6" dur="0.8s" begin="0s" repeatCount="indefinite" />
              </rect>
              <rect x="7" y="4" width="4" height="10" rx="2" fill="#1D9E75">
                <animate attributeName="height" values="10;16;10" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
                <animate attributeName="y" values="4;1;4" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
              </rect>
              <rect x="13" y="6" width="4" height="6" rx="2" fill="#1D9E75">
                <animate attributeName="height" values="6;12;6" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="y" values="6;3;6" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
              </rect>
            </svg>
          </div>
          <button
            type="button"
            onClick={stop}
            className="text-xs font-semibold text-forest-600 hover:text-forest-800 underline"
          >
            Stop
          </button>
        </div>
      )}

      {/* Sign-off */}
      <div className="mt-8 pt-4 border-t border-cream-300 font-serif text-sm text-gray-500 italic">
        With warmth,<br />
        Dr. Bloom
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <SpeakerButton text={insight} language={voiceLang} size={36} />
        <button
          type="button"
          onClick={() => { stop(); hasAutoSpokenRef.current = false; onRetry(); }}
          className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto"
        >
          Generate again
        </button>
      </div>

      {/* Medical disclaimer */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Dr. Bloom is AI and can make mistakes. Always consult your pediatrician.
      </p>
    </div>
  );
}
