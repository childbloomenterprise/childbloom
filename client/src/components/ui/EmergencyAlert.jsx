export default function EmergencyAlert({ onDismiss }) {
  return (
    <div className="mx-1 mb-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">🚨</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-800 mb-1">Medical Emergency Detected</p>
          <p className="text-xs text-red-700 mb-3 leading-relaxed">
            Dr. Bloom is AI and cannot assess emergencies. Please contact emergency services immediately.
          </p>

          <a
            href="tel:112"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call 112 Now
          </a>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide">While waiting for help:</p>
            <ul className="text-[11px] text-red-700 space-y-0.5 list-disc list-inside">
              <li>Keep your child calm and still</li>
              <li>Do not give food or water</li>
              <li>If unconscious and breathing — place on their side</li>
              <li>If not breathing — begin CPR if trained</li>
            </ul>
          </div>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-3 w-full text-xs text-red-500 hover:text-red-700 underline transition-colors"
        >
          This was not an emergency — dismiss
        </button>
      )}
    </div>
  );
}
