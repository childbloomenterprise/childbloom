import { motion } from 'framer-motion';
import { SPRING } from '../cb/tokens';

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 14, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: SPRING.entry },
};

// Wrap any list of cards with <StaggerList> to get Apple-style staggered entry.
export function StaggerList({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

// Wrap each individual card with <StaggerItem>.
export function StaggerItem({ children, className, style, onClick }) {
  return (
    <motion.div
      className={className}
      style={{ willChange: 'transform, opacity', ...style }}
      variants={itemVariants}
      whileTap={onClick ? { scale: 0.975, transition: { type: 'spring', stiffness: 600, damping: 25 } } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export default StaggerList;
