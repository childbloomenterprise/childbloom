// Shared ChildBloom logo components
// LogoMark  — green square icon only (for dock, favicon reference)
// LogoWordmark — icon + "Child" serif + "Bloom" teal

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <rect width="80" height="80" rx="18" fill="#1D9E75" />
      <line x1="40" y1="56" x2="40" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 38 C40 38 32 32 28 24 C28 24 36 22 40 30" fill="white" />
      <path d="M40 33 C40 33 48 27 52 19 C52 19 44 17 40 25" fill="rgba(255,255,255,0.75)" />
      <path d="M37 50 C32 50 27 47 26 42 C26 42 31 40 35 43" fill="white" opacity="0.4" />
      <path d="M43 50 C48 50 53 47 54 42 C54 42 49 40 45 43" fill="white" opacity="0.4" />
      <circle cx="40" cy="57" r="2.5" fill="white" />
    </svg>
  );
}

export function LogoWordmark({ iconSize = 44, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={iconSize} />
      <div className="leading-none">
        <span
          className="font-serif font-bold"
          style={{ fontSize: iconSize * 0.55, color: '#2A1C15', letterSpacing: '-0.01em' }}
        >
          Child
        </span>
        <span
          className="font-serif font-bold"
          style={{ fontSize: iconSize * 0.55, color: '#1D9E75', letterSpacing: '-0.01em' }}
        >
          Bloom
        </span>
      </div>
    </div>
  );
}
