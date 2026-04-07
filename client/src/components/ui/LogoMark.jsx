// Shared ChildBloom logo components
// LogoMark     — dark square icon with glowing teal circle + plant
// LogoWordmark — icon + "Child" serif (dark) + "Bloom" teal

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Dark outer square */}
      <rect width="80" height="80" rx="18" fill="#111916" />
      {/* Dark green circle */}
      <circle cx="40" cy="40" r="28" fill="#0C1F14" />
      {/* Glowing teal ring */}
      <circle cx="40" cy="40" r="28" fill="none" stroke="#1D9E75" strokeWidth="1.5" opacity="0.9" />
      {/* Inner halo */}
      <circle cx="40" cy="40" r="26.5" fill="none" stroke="#3DD68C" strokeWidth="0.6" opacity="0.4" />
      {/* Stem */}
      <line x1="40" y1="55" x2="40" y2="31" stroke="#3DD68C" strokeWidth="2.2" strokeLinecap="round" />
      {/* Left leaf — deeper teal */}
      <path d="M40 39 C40 39 33 33 29 25 C29 25 37 23 40 31" fill="#1D9E75" />
      {/* Right leaf — lighter mint */}
      <path d="M40 34 C40 34 47 28 51 20 C51 20 43 18 40 26" fill="#3DD68C" />
      {/* Left root */}
      <path d="M38 51 C33 51 28 48 27 43 C27 43 32 41 36 44" fill="#1D9E75" opacity="0.5" />
      {/* Right root */}
      <path d="M42 51 C47 51 52 48 53 43 C53 43 48 41 44 44" fill="#1D9E75" opacity="0.5" />
      {/* Bottom dot */}
      <circle cx="40" cy="56" r="2.2" fill="#3DD68C" />
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
