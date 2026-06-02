export const motionTimings = {
  fast: 0.15,
  normal: 0.2,
  page: 0.3,
  modal: 0.25
};

export const easeOut = 'easeOut';

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTimings.page, ease: easeOut }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: motionTimings.page, ease: easeOut }
  }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1
    }
  }
};

export const cardItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTimings.page, ease: easeOut }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: motionTimings.normal, ease: easeOut }
  },
  hover: {
    y: -2,
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)',
    transition: { duration: motionTimings.normal, ease: easeOut }
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1, ease: easeOut }
  }
};

export const tableRow = {
  initial: { opacity: 0, y: 8 },
  animate: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: motionTimings.normal, delay: index * 0.05, ease: easeOut }
  }),
  exit: (index = 0) => ({
    opacity: 0,
    transition: { duration: motionTimings.fast, delay: index * 0.02, ease: easeOut }
  })
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: motionTimings.modal, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: motionTimings.modal, ease: easeOut } }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: motionTimings.modal, ease: easeOut } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: motionTimings.modal, ease: easeOut } }
};

export const dropdownMenu = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { duration: motionTimings.normal, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: motionTimings.normal, ease: easeOut } }
};

export const toastMotion = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0, transition: { duration: motionTimings.page, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: motionTimings.normal, ease: easeOut } }
};

export const sidebarPanel = {
  expanded: {
    width: 220,
    transition: { duration: motionTimings.page, ease: easeOut }
  },
  collapsed: {
    width: 56,
    transition: { duration: motionTimings.page, ease: easeOut }
  }
};

export const sidebarList = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const sidebarItem = {
  initial: { opacity: 0, x: -10 },
  animate: (index = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: motionTimings.normal, delay: index * 0.05, ease: easeOut }
  }),
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: motionTimings.fast, ease: easeOut }
  }
};

export const buttonTap = {
  tap: {
    scale: 0.97,
    transition: { duration: 0.1, ease: easeOut }
  }
};

export const reducedMotionVariants = {
  initial: { opacity: 1, x: 0, y: 0, scale: 1 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 1, x: 0, y: 0, scale: 1 }
};

export const getMotionVariants = (variants, shouldReduceMotion) => {
  if (!shouldReduceMotion) return variants;

  return {
    ...reducedMotionVariants,
    hover: variants.hover ? {} : undefined,
    tap: variants.tap ? {} : undefined
  };
};

export const spinTransition = {
  repeat: Infinity,
  ease: 'linear',
  duration: 0.8
};

export const spinnerMotion = {
  animate: {
    rotate: 360,
    transition: spinTransition
  }
};

export const alertPulse = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [1, 0.86, 1],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: easeOut
    }
  }
};
