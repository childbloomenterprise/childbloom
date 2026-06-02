import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring', stiffness: 340, damping: 28, mass: 0.8 };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { ...spring, delay } },
});

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{ backgroundColor: '#f5f0e8' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
    >
      <div className="flex flex-col items-center" style={{ gap: '28px' }}>

        {/* Logo — scales in with spring */}
        <motion.div
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1, transition: { ...spring, delay: 0.05 } }}
        >
          <div style={{
            position: 'absolute', width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,125,111,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            aria-hidden="true"
          >
            <motion.g
              initial={{ opacity: 0, rotate: -8 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ ...spring, delay: 0.15 }}
              style={{ transformOrigin: '100px 160px' }}
            >
              <path d="M100 160 C60 140 30 100 50 60 C65 30 95 40 100 80 Z" fill="#1f5e3a" />
            </motion.g>
            <motion.g
              initial={{ opacity: 0, rotate: 8 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ ...spring, delay: 0.22 }}
              style={{ transformOrigin: '100px 160px' }}
            >
              <path d="M100 160 C140 140 170 100 150 60 C135 30 105 40 100 80 Z" fill="#1f5e3a" />
            </motion.g>
            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
            >
              <path d="M100 165 C85 130 80 90 100 50 C120 90 115 130 100 165 Z" fill="#2a7a50" />
            </motion.g>
          </svg>
        </motion.div>

        {/* Wordmark — fades up after logo */}
        <motion.div
          className="flex flex-col items-center"
          style={{ gap: '4px' }}
          {...fadeUp(0.38)}
        >
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: '26px',
            fontWeight: 700,
            color: '#1f5e3a',
            letterSpacing: '0.04em',
          }}>
            ChildBloom
          </span>
          <motion.span
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#6a9a7a',
              fontWeight: 400,
            }}
            {...fadeUp(0.52)}
          >
            Your child's growth companion
          </motion.span>
        </motion.div>

        {/* Dots — staggered entry, then continuous pulse */}
        <motion.div
          className="flex"
          style={{ gap: '8px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden:  {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.65 } },
          }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7d6f', willChange: 'transform, opacity' }}
              variants={{
                hidden:  { opacity: 0, scale: 0 },
                visible: {
                  opacity: [0.7, 1, 0.7],
                  scale:   [1, 1.3, 1],
                  transition: { duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' },
                },
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
