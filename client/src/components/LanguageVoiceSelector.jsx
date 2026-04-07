const PILLS = [
  { code: 'en', label: 'English' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function LanguageVoiceSelector({ selected, onChange }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Voice language">
      {PILLS.map(({ code, label }) => {
        const active = selected === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            aria-pressed={active}
            className="flex-1 py-2 px-3 rounded-full text-sm font-medium border transition-all duration-150 active:scale-95"
            style={{
              background: active ? '#1D9E75' : 'transparent',
              color: active ? '#ffffff' : '#6B7280',
              borderColor: active ? '#1D9E75' : '#D1D5DB',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = '#E1F5EE';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
