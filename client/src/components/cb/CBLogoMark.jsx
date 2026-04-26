export default function CBLogoMark({ size = 24, color = '#0F3D2E' }) {
  return (
    <svg width={size} height={Math.round(size * 1.05)} viewBox="0 0 100 105" aria-hidden="true">
      <path d="M50 90 C46 80 18 76 8 57 C20 36 47 60 50 82Z" fill={color} />
      <path d="M50 90 C54 80 82 76 92 57 C80 36 53 60 50 82Z" fill={color} />
      <path d="M50 90 C33 77 28 40 50 8 C72 40 67 77 50 90Z" fill={color} />
    </svg>
  );
}
