import type { Variants, Transition } from "framer-motion";

// ── Spring presets ──────────────────────────────────────────────
// Named springs instead of raw easeOut everywhere

export const SPRING = {
  /** Snappy UI elements — buttons, badges, small reveals */
  snappy: { type: "spring", stiffness: 400, damping: 25 } as const,
  /** Standard content — cards, sections, form fields */
  gentle: { type: "spring", stiffness: 260, damping: 26 } as const,
  /** Dramatic reveals — headlines, trophies, celebrations */
  bouncy: { type: "spring", stiffness: 300, damping: 18 } as const,
  /** Subtle movements — fades, background elements */
  soft: { type: "spring", stiffness: 120, damping: 20 } as const,
} satisfies Record<string, Transition>;

// ── Stagger containers ─────────────────────────────────────────
// Parent wraps children; children use child variants

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

// ── Child variants (used inside stagger containers) ────────────

/** Standard tile/card entrance — slides up with spring */
export const tileEnter: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING.gentle,
  },
};

/** Content reveal with blur — for text blocks, headings */
export const contentReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING.gentle,
  },
};

/** Dramatic scale entrance — for celebrations, trophies */
export const scaleReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING.bouncy,
  },
};

/** Slide in from left — for labels, badges */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING.gentle,
  },
};

/** Pop in — for small elements like icons, checkmarks */
export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING.snappy,
  },
};

// ── Standalone transitions (not part of stagger) ───────────────

/** Page-level entrance for entire view */
export const viewEnter: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...SPRING.gentle,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

/** Word-by-word text reveal (use with split text) */
export const wordReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: "blur(6px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      ...SPRING.bouncy,
      delay: 0.3 + i * 0.08,
    },
  }),
};

/** Button hover/tap interaction */
export const buttonInteraction = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.97 },
  transition: SPRING.snappy,
};

/** Checkbox bounce on check */
export const checkBounce: Variants = {
  unchecked: { scale: 1 },
  checked: {
    scale: [1, 1.2, 1],
    transition: {
      times: [0, 0.4, 1],
      ...SPRING.snappy,
    },
  },
};
