/**
 * TOKENS — single source of truth for every design value in First Day.
 *
 * All colors, fonts, clip-paths, motion, and layout values live here.
 * Components import from this file; nothing should hardcode a hex, clamp,
 * polygon, or spring preset anywhere else.
 *
 * Backwards compat: re-exports existing named constants from
 * `src/constants/index.ts`, `src/constants/trophies.ts`, and
 * `src/lib/animations.ts` so gradual migration doesn't break imports.
 */

import {
  HERO_PALETTE,
  VORONOI_LIGHT,
  VORONOI_DARK,
  VORONOI_PALETTE,
  BRIGHT_COLORS,
  SHARD_CLIPS,
  LABEL_CLIPS,
  BUTTON_CLIPS,
  MENU_CLIPS,
  SHARD_SQUARE_CLIPS,
  SCROLL_SPEEDS,
  getClip,
} from "./constants";
import { SHARD_3D_COLORS } from "./constants/trophies";
import {
  SPRING,
  staggerContainer,
  staggerContainerSlow,
  tileEnter,
  contentReveal,
  scaleReveal,
  slideInLeft,
  popIn,
  viewEnter,
  wordReveal,
  buttonInteraction,
  checkBounce,
} from "./lib/animations";

// ── Day-of-week palette ────────────────────────────────────────
// Previously duplicated locally in WeekCalendar.tsx
export const DAY_COLORS = [
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#4FC3F7", "#FF4500", "#2979FF",
] as const;

// ── Form field palette ─────────────────────────────────────────
// Previously duplicated locally in SimpleGoalCreation.tsx
export const FIELD_COLORS = ["#FFE633", "#FF6B2B", "#2979FF", "#FF10F0"] as const;

// ── Experience-level palette (beginner/intermediate/advanced) ──
export const EXP_COLORS = ["#FFE633", "#FF2D55", "#00EAFF"] as const;

// ── Monotone fallback ──────────────────────────────────────────
// Previously hardcoded #333/#555 in SimpleGoalCreation.tsx
export const MONOTONE = {
  fillDark: "#333333",
  fillMid: "#555555",
  fillLight: "#777777",
} as const;

// ── Brand colors (mirror CSS variables in globals.css) ─────────
export const BRAND = {
  primary: "#cc5533",
  destructive: "#FF2D55",
  bgBase: "#000000",
  textPrimary: "#ffffff",
} as const;

// ── Overlay colors (border/input fills) ────────────────────────
export const OVERLAY = {
  border: "rgba(255, 255, 255, 0.1)",
  borderThick: "rgba(255, 255, 255, 0.2)",
  inputBg: "rgba(255, 255, 255, 0.05)",
  switchBg: "rgba(255, 255, 255, 0.2)",
} as const;

// ── Typography clamp presets ───────────────────────────────────
// Previously hardcoded clamp() in 4 components
export const FONT_SIZE = {
  heroTitle: "clamp(2rem, 5vw, 4rem)",
  pageTitle: "clamp(1.3rem, 4vw, 2.2rem)",
  modalHeading: "clamp(4rem, 18vw, 12rem)",
  sectionHeading: "clamp(1.5rem, 3.5vw, 2.5rem)",
} as const;

export const FONT_FAMILY = {
  display: "var(--font-bebas), system-ui, sans-serif",
  body: "var(--font-inter), system-ui, sans-serif",
} as const;

export const LETTER_SPACING = {
  display: "0.06em",
  wide: "0.1em",
} as const;

// ── Motion durations (ms) ──────────────────────────────────────
// Previously hardcoded setInterval/setTimeout values across components
export const DURATIONS = {
  colorCycleFast: 800,   // DayView button color cycle
  colorCycleMed: 1500,   // Toast copy feedback
  modalEntry: 300,       // Login modal transitions
  loadingBar: 100,       // Progress animation increment
  shardPulse: 600,       // shardPulse keyframe (0.6s)
  shardGlow: 1000,       // shardGlow keyframe (1s)
  letterWave: 2000,      // letterWave keyframe (2s)
  scrollRow: 25000,      // Goal suggestion scrolling
  fadeIn: 500,           // fadeIn keyframe
  scaleIn: 400,          // scaleIn keyframe
  btnShake: 400,         // btnShake keyframe
} as const;

// ── Layout constants ───────────────────────────────────────────
export const LAYOUT = {
  borderRadius: 0,           // Enforced everywhere — clip-paths only
  borderWidth: {
    thin: "1px",
    medium: "2px",
    thick: "3px",
  },
  border: {
    default: `1px solid ${OVERLAY.border}`,
    thick: `2px solid ${OVERLAY.border}`,
  },
} as const;

// ── Unified TOKENS namespace ───────────────────────────────────
// Prefer TOKENS.colors.primary in new code over importing BRAND directly.
export const TOKENS = {
  colors: {
    brand: BRAND,
    overlay: OVERLAY,
    monotone: MONOTONE,
    hero: HERO_PALETTE,
    voronoi: {
      light: VORONOI_LIGHT,
      dark: VORONOI_DARK,
      full: VORONOI_PALETTE,
    },
    bright: BRIGHT_COLORS,
    shard3d: SHARD_3D_COLORS,
    day: DAY_COLORS,
    field: FIELD_COLORS,
    exp: EXP_COLORS,
  },
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    letterSpacing: LETTER_SPACING,
  },
  clipPaths: {
    shard: SHARD_CLIPS,
    label: LABEL_CLIPS,
    button: BUTTON_CLIPS,
    menu: MENU_CLIPS,
    shardSquare: SHARD_SQUARE_CLIPS,
  },
  motion: {
    spring: SPRING,
    stagger: {
      default: staggerContainer,
      slow: staggerContainerSlow,
    },
    variants: {
      tileEnter,
      contentReveal,
      scaleReveal,
      slideInLeft,
      popIn,
      viewEnter,
      wordReveal,
      checkBounce,
    },
    button: buttonInteraction,
    durations: DURATIONS,
    scrollSpeeds: SCROLL_SPEEDS,
  },
  layout: LAYOUT,
  util: { getClip },
} as const;

// Re-export individual names so `import { BRIGHT_COLORS } from '@/tokens'` works.
export {
  HERO_PALETTE,
  VORONOI_LIGHT,
  VORONOI_DARK,
  VORONOI_PALETTE,
  BRIGHT_COLORS,
  SHARD_CLIPS,
  LABEL_CLIPS,
  BUTTON_CLIPS,
  MENU_CLIPS,
  SHARD_SQUARE_CLIPS,
  SCROLL_SPEEDS,
  SHARD_3D_COLORS,
  SPRING,
  staggerContainer,
  staggerContainerSlow,
  tileEnter,
  contentReveal,
  scaleReveal,
  slideInLeft,
  popIn,
  viewEnter,
  wordReveal,
  buttonInteraction,
  checkBounce,
  getClip,
};
