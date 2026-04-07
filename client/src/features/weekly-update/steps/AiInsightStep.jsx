import { useEffect, useRef } from 'react';
import Button from '../../../components/ui/Button';
import useTextToSpeech from '../../../hooks/useTextToSpeech';

export default function AiInsightStep({ insight, loading, childName, onRetry, voiceLang = 'en' }) {
  const name = childName || 'your little one';
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const hasAutoSpokenRef = useRef(false);

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

  // Reset auto-speak flag when insight changes (retry)
  useEffect(() => {
    if (!insight) hasAutoSpokenRef.current = false;
  }, [insight]);

  if (loading) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
          <div className="w-2.5 h-2.5 bg-forest-400 rounded-full thinking-dot" />
        </div>
        <p className="text-sm text-gray-500">
          Dr. Bloom is thinking about {name}'s week...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-caption font-bold text-forest-700">Dr. Bloom's take on {name}'s week</h3>
          <p className="text-micro text-gray-400">Based on everything you've shared</p>
        </div>
      </div>

      <div className="bg-forest-50/60 border border-forest-100 rounded-xl p-5">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {insight}
        </p>

        {/* Speaking bar */}
        {isSpeaking && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-forest-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-forest-600 font-medium">Dr. Bloom is speaking</span>
              {/* Animated wave bars */}
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
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => { stop(); hasAutoSpokenRef.current = false; onRetry(); }}>
          Ask again
        </Button>
      </div>
    </div>
  );
}
