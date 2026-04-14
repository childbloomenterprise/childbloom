import { useEffect, useState } from 'react';

function BloomLogo() {
  return (
    <svg
      viewBox="0 0 100 105"
      xmlns="http://www.w3.org/2000/svg"
      width="130"
      height="137"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Left leaf — blooms first */}
      <path
        className="splash-leaf splash-leaf-1"
        d="M50 90 C46 80 18 76 8 57 C20 36 47 60 50 82Z"
        fill="#285C2A"
      />
      {/* Right leaf — blooms second */}
      <path
        className="splash-leaf splash-leaf-2"
        d="M50 90 C54 80 82 76 92 57 C80 36 53 60 50 82Z"
        fill="#285C2A"
      />
      {/* Center/top leaf — blooms third */}
      <path
        className="splash-leaf splash-leaf-3"
        d="M50 90 C33 77 28 40 50 8 C72 40 67 77 50 90Z"
        fill="#285C2A"
      />
      {/* Child's hand — fades in last */}
      <path
        className="splash-hand"
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

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const doneTimer = setTimeout(() => onDone?.(), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{
        background: '#FAF9F6',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <BloomLogo />

      <div className="mt-5 splash-wordmark flex items-baseline gap-0">
        <span
          className="font-serif font-bold text-3xl"
          style={{ color: '#2A1C15', letterSpacing: '-0.02em' }}
        >
          Child
        </span>
        <span
          className="font-serif font-bold text-3xl"
          style={{ color: '#285C2A', letterSpacing: '-0.02em' }}
        >
          Bloom
        </span>
      </div>
    </div>
  );
}
