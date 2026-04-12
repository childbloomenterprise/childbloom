const TRUST_ITEMS = [
  'WHO growth standards',
  'IAP vaccination schedule',
  'AAP evidence-based guides',
  'Indian food database',
  'Medical disclaimers on all AI content',
];

export default function TrustBar() {
  return (
    <section
      style={{
        borderTop: '1px solid rgba(232,196,184,0.5)',
        borderBottom: '1px solid rgba(232,196,184,0.5)',
        backgroundColor: '#F0ECE6',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 py-5">
        <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
          {TRUST_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-2 shrink-0">
              {/* Teal checkmark circle */}
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 18, height: 18, backgroundColor: '#1D9E75' }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                className="font-sans whitespace-nowrap"
                style={{ fontSize: '0.8125rem', color: '#3D2B23', opacity: 0.7, fontWeight: 500 }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
