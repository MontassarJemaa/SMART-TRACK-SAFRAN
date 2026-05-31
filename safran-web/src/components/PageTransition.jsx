'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { getMotionVariants, pageTransition, reducedMotionVariants } from '@/src/animations/variants';

export default function PageTransition({ children, className = '', fitContent = false }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedMotionVariants : getMotionVariants(pageTransition, false);

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: fitContent ? 'auto' : '100vh', height: fitContent ? 'auto' : undefined }}
    >
      {children}
    </motion.div>
  );
}
