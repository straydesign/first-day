/**
 * First Day design tokens — ONE source of truth for the greyscale-Voronoi + Apple-sleek language.
 * Background.tsx, Panel.tsx, TopBar.tsx, and every view import from here so nothing drifts.
 */

/** Apple-style system stack (Inter loaded as --font-inter, then SF / system fallbacks). */
export const FONT =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

/** Near-black greyscale palette for the single interactive Voronoi backdrop. */
export const GREY_VORONOI = [
  "#0d0d0f",
  "#111114",
  "#0a0a0c",
  "#15151a",
  "#0e0e11",
  "#191920",
  "#0c0c0e",
] as const;

/** Base page color sitting behind the backdrop. */
export const BG_BASE = "#08080a";
