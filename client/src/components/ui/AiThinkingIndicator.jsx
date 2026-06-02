import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { T } from '../cb/tokens';

const MESSAGES = [
  "Checking your child's profile.",
  'Reviewing developmental guidelines.',
  'Thinking through your question.',
  'Almost ready.',
];

export default function AiThinkingIndicator({ visible }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) { setMsgIndex(0); return; }
    const t = setInterval(() => setMsgIndex(i => (i + 1) % MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 360, damping: 28 } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 16, padding: '24px 0',
          }}
        >
          {/* Breathing orb — ChildBloom brand green */}
          <motion.div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(29,106,71,0.18) 0%, rgba(29,106,71,0.06) 70%, transparent 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span style={{ fontSize: 22 }}>🌱</span>
          </motion.div>

          {/* Rotating message — cross-fades, never jumps */}
          <div style={{ position: 'relative', height: 22, width: '100%', textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
                style={{
                  position: 'absolute', width: '100%', margin: 0,
                  fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                  fontSize: 14, color: T.ink500 || '#6a9a7a', letterSpacing: '-0.01em',
                }}
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Thin progress line — no percentage, pure animation */}
          <div style={{ width: 120, height: 2, background: 'rgba(29,106,71,0.1)', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: T.brand || '#1D6A47', borderRadius: 999 }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 8, ease: [0.2, 0, 0.8, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
