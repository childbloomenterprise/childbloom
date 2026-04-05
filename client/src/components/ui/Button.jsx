// Dark glass button — matches dock aesthetic
export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, className = '', ...props }) {
  const base = `
    inline-flex items-center justify-center font-semibold tracking-tight
    rounded-xl transition-all duration-300 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
    relative overflow-hidden select-none
    border
  `;

  const variants = {
    primary: `
      bg-white/10 backdrop-blur-sm border-white/20 text-white
      hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5
      hover:shadow-[0_4px_24px_0_rgba(255,255,255,0.08)]
      active:translate-y-0 active:scale-[0.98]
    `,
    secondary: `
      bg-white/5 backdrop-blur-sm border-white/10 text-white/80
      hover:bg-white/10 hover:border-white/20 hover:text-white hover:-translate-y-0.5
      active:translate-y-0 active:scale-[0.98]
    `,
    ghost: `
      bg-transparent border-transparent text-white/60
      hover:bg-white/5 hover:border-white/10 hover:text-white
      active:scale-[0.98]
    `,
    danger: `
      bg-red-500/10 border-red-500/20 text-red-400
      hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 hover:-translate-y-0.5
      active:translate-y-0 active:scale-[0.98]
    `,
  };

  const sizes = {
    sm:   'px-4 py-2 text-caption gap-1.5',
    md:   'px-5 py-2.5 text-body gap-2',
    lg:   'px-7 py-3.5 text-body-lg gap-2',
    icon: 'p-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
