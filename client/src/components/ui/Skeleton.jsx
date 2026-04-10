export default function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-lg h-4',
  };

  return (
    <div className={`skeleton ${variants[variant]} ${className}`} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-cream-300/80 p-6 space-y-4 shadow-card">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4 stagger-children">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Matches the exact layout of DashboardPage
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-2xl border border-cream-300/80 p-5 sm:p-7 shadow-card"
           style={{ background: 'rgba(232,196,184,0.25)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32 mt-3" />
          </div>
          <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" variant="rect" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-cream-300/80 p-3.5 text-center shadow-card"
               style={{ background: 'rgba(232,196,184,0.20)' }}>
            <Skeleton className="h-3 w-12 mx-auto mb-2" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* AI insight card */}
      <div className="rounded-2xl border border-cream-300/80 p-5 sm:p-6 shadow-card"
           style={{ background: 'rgba(232,196,184,0.20)' }}>
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Primary CTA */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Quick links grid */}
      <div>
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-cream-300/80 p-3.5 shadow-card"
                 style={{ background: 'rgba(232,196,184,0.20)' }}>
              <Skeleton className="w-10 h-10 rounded-xl mb-2.5" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
