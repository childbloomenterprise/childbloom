import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { SPRING, EASE } from '../cb/tokens';

const pageVariants = {
  initial:  { opacity: 0, x: 18, scale: 0.99 },
  animate:  { opacity: 1, x: 0,  scale: 1,    transition: SPRING.page },
  exit:     { opacity: 0, x: -12, scale: 0.98, transition: { duration: 0.22, ease: EASE.fastOut } },
};

const INSTANT_PATHS = ['/emergency'];

function isInstantRoute(pathname) {
  return INSTANT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function PageTransition({ children }) {
  const location = useLocation();
  const instant = isInstantRoute(location.pathname);

  if (instant) {
    return <div style={{ width: '100%' }}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%', willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
