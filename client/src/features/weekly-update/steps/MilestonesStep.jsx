import { useMemo } from 'react';
import { getAgeInMonths } from '../../../lib/formatters';
import milestonesData from '../../../data/milestones/milestones-by-age.json';
import VoiceInput from '../../../components/VoiceInput';

function getAgeGroup(months) {
  if (months < 3) return '0-3';
  if (months < 6) return '3-6';
  if (months < 9) return '6-9';
  if (months < 12) return '9-12';
  if (months < 18) return '12-18';
  if (months < 24) return '18-24';
  if (months < 36) return '24-36';
  if (months < 48) return '36-48';
  if (months < 60) return '48-60';
  return '60-84';
}

export default function MilestonesStep({ formData, updateField, child, voiceLang = 'en' }) {
  const ageMonths = child?.date_of_birth ? getAgeInMonths(child.date_of_birth) : 6;
  const ageGroup = getAgeGroup(ageMonths);
  const milestones = milestonesData[ageGroup];
  const name = child?.name || 'your little one';

  const toggleMilestone = (milestone) => {
    const current = formData.milestones_checked || [];
    if (current.includes(milestone)) {
      updateField('milestones_checked', current.filter((m) => m !== milestone));
    } else {
      updateField('milestones_checked', [...current, milestone]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-serif font-semibold text-forest-700">
          What's {name} up to?
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Tick anything you've noticed — no pressure to check everything
        </p>
      </div>

      {/* Milestone Checklist */}
      {milestones && (
        <div className="space-y-2">
          {milestones.milestones.map((milestone) => (
            <button
              key={milestone}
              onClick={() => toggleMilestone(milestone)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                (formData.milestones_checked || []).includes(milestone)
                  ? 'border-forest-400 bg-forest-50'
                  : 'border-cream-200 hover:border-cream-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                (formData.milestones_checked || []).includes(milestone)
                  ? 'border-forest-500 bg-forest-500'
                  : 'border-gray-300'
              }`}>
                {(formData.milestones_checked || []).includes(milestone) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">{milestone}</span>
            </button>
          ))}
        </div>
      )}

      {/* Free text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Anything new or surprising happen this week?
          </label>
          <VoiceInput
            language={voiceLang}
            onTranscript={(text) => updateField('new_skills', (formData.new_skills ? formData.new_skills + ' ' : '') + text)}
            onError={() => {}}
            size={30}
          />
        </div>
        <textarea
          value={formData.new_skills}
          onChange={(e) => updateField('new_skills', e.target.value)}
          placeholder={`New sounds, words, movements — even a funny face counts`}
          className="input-field min-h-[100px] resize-none"
          rows={4}
        />
      </div>
    </div>
  );
}
