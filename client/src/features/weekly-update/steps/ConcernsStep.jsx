import { AlertIcon } from '../../../assets/icons';

const RED_FLAGS = [
  'Not making eye contact',
  'Not responding to name',
  'Losing previously gained skills',
  'Not gaining weight',
  'Excessive crying (inconsolable)',
  'Unusually stiff or floppy body',
  'Not feeding well',
];

export default function ConcernsStep({ formData, updateField, childName }) {
  const toggleRedFlag = (flag) => {
    const current = formData.red_flags || [];
    if (current.includes(flag)) {
      updateField('red_flags', current.filter((f) => f !== flag));
    } else {
      updateField('red_flags', [...current, flag]);
    }
  };

  const hasRedFlags = (formData.red_flags || []).length > 0;
  const name = childName || 'your little one';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-serif font-semibold text-forest-700">
          Anything on your mind?
        </h3>
        <p className="text-sm text-gray-400 mt-1">This is just between you and Dr. Bloom</p>
      </div>

      {/* Free text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Is there anything about {name} that's been worrying you?
        </label>
        <textarea
          value={formData.concerns}
          onChange={(e) => updateField('concerns', e.target.value)}
          placeholder={`Share whatever's on your mind — no concern is too small`}
          className="input-field min-h-[100px] resize-none"
          rows={4}
        />
      </div>

      {/* Red flag checklist */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Have you noticed any of these recently?
        </label>
        <div className="space-y-2">
          {RED_FLAGS.map((flag) => (
            <button
              key={flag}
              onClick={() => toggleRedFlag(flag)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                (formData.red_flags || []).includes(flag)
                  ? 'border-red-300 bg-red-50'
                  : 'border-cream-200 hover:border-cream-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                (formData.red_flags || []).includes(flag)
                  ? 'border-red-500 bg-red-500'
                  : 'border-gray-300'
              }`}>
                {(formData.red_flags || []).includes(flag) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">{flag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Doctor nudge */}
      {hasRedFlags && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Worth mentioning to your paediatrician</p>
            <p className="text-xs text-amber-600 mt-1">
              A few things you've noted are worth a professional look. It's not an alarm — just a nudge to bring it up at your next visit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
