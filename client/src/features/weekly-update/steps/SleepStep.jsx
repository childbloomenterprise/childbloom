import { useTranslation } from 'react-i18next';

export default function SleepStep({ formData, updateField, childName }) {
  const { t } = useTranslation();
  const name = childName || 'your little one';
  const hours = formData.sleep_hours ?? 10;

  const adjustHours = (delta) => {
    const next = Math.min(14, Math.max(0, parseFloat((hours + delta).toFixed(1))));
    updateField('sleep_hours', next);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-serif font-semibold text-forest-700">
          {t('sleep.title')}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {t('sleep.lastNight')} — {name}
        </p>
      </div>

      {/* Big hours display */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-bold text-forest-700" style={{ fontSize: 64, lineHeight: 1 }}>
          {hours}
        </span>
        <span className="text-sm font-medium text-gray-400">{t('sleep.hours')}</span>
      </div>

      {/* Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('sleep.hoursSlept')}{' '}
          <span className="text-forest-600 font-semibold">{hours} hrs</span>
        </label>
        <input
          type="range"
          min="0"
          max="14"
          step="0.5"
          value={hours}
          onChange={(e) => updateField('sleep_hours', parseFloat(e.target.value))}
          className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-forest-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0h</span>
          <span>7h</span>
          <span>14h</span>
        </div>
      </div>

      {/* +/− fine-tune buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => adjustHours(-0.5)}
          className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-xl font-medium text-gray-600 hover:bg-cream-100 transition-colors"
          aria-label="Decrease by 30 minutes"
        >
          −
        </button>
        <span className="text-sm text-gray-400 w-16 text-center">
          {hours} hrs
        </span>
        <button
          type="button"
          onClick={() => adjustHours(0.5)}
          className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-xl font-medium text-gray-600 hover:bg-cream-100 transition-colors"
          aria-label="Increase by 30 minutes"
        >
          +
        </button>
      </div>
    </div>
  );
}
