// Shared ChildBloom logo components
// LogoMark     — 3-leaf icon with child's hand
// LogoWordmark — icon + "Child" serif (dark) + "Bloom" green

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 100 105"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={Math.round(size * 1.05)}
      className={className}
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Left leaf */}
      <path
        d="M50 90 C46 80 18 76 8 57 C20 36 47 60 50 82Z"
        fill="#285C2A"
      />
      {/* Right leaf */}
      <path
        d="M50 90 C54 80 82 76 92 57 C80 36 53 60 50 82Z"
        fill="#285C2A"
      />
      {/* Center/top leaf */}
      <path
        d="M50 90 C33 77 28 40 50 8 C72 40 67 77 50 90Z"
        fill="#285C2A"
      />
      {/* Child's hand */}
      <path
        d="M41 73 C37 73 35 70 35 66 L35 59 C35 56 37 54 40 54
           C41 54 43 55 43 58 L43 51 C43 47 45 45 47.5 45
           C50 45 51 47 51 51 L51 50 C51 46 53 44 55.5 44
           C58 44 59 46 59 50 L59 52 C59 48 61 47 63 48
           C65 49 65 51 65 54 L65 63 C66 62 67 63 67 65
           C67 68 65 70 64 70 L64 73 C62 75 43 75 41 73Z"
        fill="#EDE8DF"
      />
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
          style={{ fontSize: iconSize * 0.55, color: '#285C2A', letterSpacing: '-0.01em' }}
        >
          Bloom
        </span>
      </div>
    </div>
  );
}
