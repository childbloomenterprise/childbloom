import Button from '../../../components/ui/Button';

export default function AiInsightStep({ insight, loading, childName, onRetry }) {
  const name = childName || 'your little one';

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
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Ask again
        </Button>
      </div>
    </div>
  );
}
