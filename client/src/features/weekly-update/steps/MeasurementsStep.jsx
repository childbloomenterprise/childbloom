export default function MeasurementsStep({ formData, updateField, childName }) {
  const adjustValue = (field, delta) => {
    const current = parseFloat(formData[field]) || 0;
    const newVal = Math.max(0, current + delta);
    updateField(field, parseFloat(newVal.toFixed(1)));
  };

  const name = childName || 'your little one';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-serif font-semibold text-forest-700">
          How big is {name} getting?
        </h3>
        <p className="text-sm text-gray-400 mt-1">Skip anything you haven't measured — that's okay.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How tall? <span className="text-gray-400 font-normal">(cm)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustValue('height_cm', -0.5)}
              className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-cream-100 transition-colors"
              aria-label="Decrease height"
            >
              −
            </button>
            <input
              type="number"
              step="0.1"
              value={formData.height_cm}
              onChange={(e) => updateField('height_cm', e.target.value ? parseFloat(e.target.value) : '')}
              className="input-field text-center text-lg flex-1"
              placeholder="—"
            />
            <button
              type="button"
              onClick={() => adjustValue('height_cm', 0.5)}
              className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-cream-100 transition-colors"
              aria-label="Increase height"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How much do they weigh? <span className="text-gray-400 font-normal">(kg)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustValue('weight_kg', -0.1)}
              className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-cream-100 transition-colors"
              aria-label="Decrease weight"
            >
              −
            </button>
            <input
              type="number"
              step="0.1"
              value={formData.weight_kg}
              onChange={(e) => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : '')}
              className="input-field text-center text-lg flex-1"
              placeholder="—"
            />
            <button
              type="button"
              onClick={() => adjustValue('weight_kg', 0.1)}
              className="w-12 h-12 rounded-xl border border-cream-300 flex items-center justify-center text-lg font-medium text-gray-600 hover:bg-cream-100 transition-colors"
              aria-label="Increase weight"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
