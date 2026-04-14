/** Shared constants used across multiple components. */

/**
 * Hero SVG 30-Color Palette — the master palette.
 * Every color in the app should come from this set.
 */
export const HERO_PALETTE = [
  // Deep Darks (near-black/navy)
  "#0a1121", "#071671", "#0c144c",
  // Deep Blues/Indigos
  "#112c97", "#13248a", "#1c30ae", "#212bbd", "#2142c3", "#2267d9", "#3075e1", "#3540d4",
  // Purples
  "#29187d", "#3d268c", "#4e35b8", "#5b1f8a", "#7e2dba",
  // Magentas/Pinks
  "#540a2a", "#821d81", "#9a2393", "#ab1c79", "#cf1b61", "#db2b85", "#f31b5e", "#f9334d",
  // Warm (orange/yellow)
  "#fa4835", "#fb7025", "#fc9a03", "#fcd02a",
  // Forest green
  "#3a4637",
  // Cloud highlight
  "#f4cac9",
] as const;

/** Sunset Sky — Light palette (foreground tiles, highlights) */
export const VORONOI_LIGHT = [
  "#fcd02a", // Golden Yellow
  "#fb7025", // Warm Orange
  "#f31b5e", // Hot Red-Pink
  "#3075e1", // Bright Blue
] as const;

/** Sunset Sky — Dark palette (deep backgrounds, shadows) */
export const VORONOI_DARK = [
  "#212bbd", // Royal Blue
  "#db2b85", // Hot Pink
  "#4e35b8", // Purple
  "#fa4835", // Orange Red
] as const;

/** Combined palette — default for VoronoiMosaic */
export const VORONOI_PALETTE = [...VORONOI_LIGHT, ...VORONOI_DARK] as const;

/** Vibrant accent colors for goal pills, shard fills, and decorative elements. */
export const BRIGHT_COLORS = [
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0",
  "#4FC3F7", "#FF4500", "#2979FF", "#FFD38A", "#39FF14",
] as const;

/** Irregular clip-paths for shard-style UI elements. */
export const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
] as const;

/** Label/header chip clip-paths — slightly more angular for inline badges. */
export const LABEL_CLIPS = [
  "polygon(0% 0%, 97% 5%, 100% 95%, 3% 100%)",
  "polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
] as const;

/** Button clip-paths — bolder asymmetry for CTAs. */
export const BUTTON_CLIPS = [
  "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)",
  "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
] as const;

/** Menu item clip-paths — wider asymmetry for nav items. */
export const MENU_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 98% 3%, 100% 97%, 2% 100%)",
  "polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%)",
] as const;

/** Get a clip-path by index from any clip array, rotating deterministically. */
export function getClip(clips: readonly string[], index: number): string {
  return clips[index % clips.length];
}

/**
 * Brick-wall clip-paths for a 7-shard week square.
 * Row 1 (top half): 4 bricks across
 * Row 2 (bottom half): 3 bricks, offset by half-brick for classic brick-wall look.
 * Slight skew on edges for shard aesthetic.
 */
export const SHARD_SQUARE_CLIPS = [
  // Voronoi tessellation — 7 interlocking cells
  "polygon(0% 0%, 29.4% 0%, 39.5% 28.8%, 0% 48.5%)",
  "polygon(29.4% 0%, 72.7% 0%, 64.2% 27.2%, 49.1% 33.6%, 39.5% 28.8%)",
  "polygon(72.7% 0%, 100% 0%, 100% 47.7%, 64.2% 27.2%)",
  "polygon(0% 48.5%, 39.5% 28.8%, 49.1% 33.6%, 51.1% 68.6%, 47.8% 73.7%, 0% 54.6%)",
  "polygon(100% 47.7%, 64.2% 27.2%, 49.1% 33.6%, 51.1% 68.6%, 100% 55.5%)",
  "polygon(0% 54.6%, 47.8% 73.7%, 48.8% 100%, 0% 100%)",
  "polygon(100% 55.5%, 51.1% 68.6%, 47.8% 73.7%, 48.8% 100%, 100% 100%)",
] as const;

/** Animation durations for scrolling goal suggestion rows. */
export const SCROLL_SPEEDS = ["20s", "30s", "25s"] as const;

/** Scrolling goal suggestion rows for SimpleGoalCreation and LandingPage. */
export const GOAL_SUGGESTIONS_ROW_1 = [
  "Learn to play guitar", "Build a morning routine", "Learn Spanish basics",
  "Start a meditation practice", "Write a short story", "Learn to code",
  "Get in shape", "Learn photography basics",
];

export const GOAL_SUGGESTIONS_ROW_2 = [
  "Master public speaking", "Learn sign language basics", "Start a YouTube channel",
  "Cook a new recipe every week", "Learn video editing", "Journal every morning",
  "Build a personal website", "Start a side project",
];

export const GOAL_SUGGESTIONS_ROW_3 = [
  "Read a book a week", "Draw something every day", "Declutter one room a week",
  "Learn graphic design basics", "Start a daily writing habit", "Practice gratitude daily",
  "Walk 10,000 steps daily", "Sleep by 10pm every night",
];
