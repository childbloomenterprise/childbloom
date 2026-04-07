import useTextToSpeech from '../hooks/useTextToSpeech';

export default function SpeakerButton({ text, language = 'en', size = 44 }) {
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const handleClick = () => {
    if (isSpeaking) stop();
    else speak(text, language);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSpeaking ? 'Tap to stop' : 'Listen to Dr. Bloom'}
      title={isSpeaking ? 'Tap to stop' : 'Listen to Dr. Bloom'}
      style={{ minWidth: size, minHeight: size, width: size, height: size }}
      className="flex items-center justify-center rounded-full transition-colors duration-200 active:scale-95 hover:bg-teal-50"
    >
      {isSpeaking ? (
        // Animated sound wave bars
        <svg
          viewBox="0 0 24 24"
          style={{ width: size * 0.5, height: size * 0.5 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="9" width="3" height="6" rx="1.5" fill="#1D9E75">
            <animate attributeName="height" values="6;14;6" dur="0.8s" begin="0s" repeatCount="indefinite" />
            <animate attributeName="y" values="9;5;9" dur="0.8s" begin="0s" repeatCount="indefinite" />
          </rect>
          <rect x="9" y="7" width="3" height="10" rx="1.5" fill="#1D9E75">
            <animate attributeName="height" values="10;18;10" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
            <animate attributeName="y" values="7;3;7" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
          </rect>
          <rect x="15" y="9" width="3" height="6" rx="1.5" fill="#1D9E75">
            <animate attributeName="height" values="6;14;6" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="y" values="9;5;9" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
          </rect>
        </svg>
      ) : (
        // Speaker icon idle
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: size * 0.5, height: size * 0.5 }}
          className="group-hover:stroke-teal-500 transition-colors duration-200"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      )}
    </button>
  );
}
