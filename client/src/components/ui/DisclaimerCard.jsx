import { useState } from 'react';

export default function DisclaimerCard({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="mx-1 mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-amber-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800 leading-snug">
            Dr. Bloom is an AI assistant — not a substitute for your pediatrician.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {['WHO', 'IAP 2024', 'AAP'].map(badge => (
              <span key={badge} className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 tracking-wide">
                {badge}
              </span>
            ))}
            <span className="text-[10px] text-amber-600 self-center">Evidence-based guidance</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors p-0.5 rounded"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
