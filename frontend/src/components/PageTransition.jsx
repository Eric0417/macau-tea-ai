import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Liquid Glass 頁面切換動畫
 * 只動畫 opacity + transform → GPU 合成層，不動畫 filter
 * 支援 prefers-reduced-motion
 */

const LG_EASE = [0.2, 0.8, 0.2, 1];
const LG_DURATION = 0.24; // 240ms

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

const variants = {
  initial: {
    opacity: 0,
    y: 6,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.99,
  },
};

const reducedVariants = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 1, y: 0, scale: 1 },
};

export default function PageTransition({ children, transitionKey }) {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={reduced ? reducedVariants : variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: reduced ? 0 : LG_DURATION,
          ease: LG_EASE,
        }}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}