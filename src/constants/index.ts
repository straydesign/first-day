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

/** Aurora gradient background colors (sunset accents). */
export const AURORA_COLORS = ["#fcd02a", "#f31b5e", "#212bbd"] as const;

/** Goal category type for color mapping. */
export type GoalCategory = "fitness" | "creative" | "professional" | "lifestyle";

/** Maps goal suggestion strings to categories for color-coding. */
export const GOAL_CATEGORY_MAP: Record<string, GoalCategory> = {
  // Fitness / health (green)
  "Get in shape": "fitness",
  "Build a morning routine": "fitness",
  "Do 50 pushups a day": "fitness",
  "Walk 10,000 steps daily": "fitness",
  "Stretch for 15 min daily": "fitness",
  "Drink more water daily": "fitness",

  // Lifestyle / mindfulness (coral)
  "Start a meditation practice": "lifestyle",
  "Cook a new recipe every week": "lifestyle",
  "Journal every morning": "lifestyle",
  "Read for 30 min before bed": "lifestyle",
  "Declutter one room a week": "lifestyle",
  "Practice gratitude daily": "lifestyle",
  "Sleep by 10pm every night": "lifestyle",
  "Spend less time on my phone": "lifestyle",

  // Creative / learning (blue)
  "Learn Spanish basics": "creative",
  "Learn to play guitar": "creative",
  "Write a short story": "creative",
  "Learn photography basics": "creative",
  "Read a book a week": "creative",
  "Draw something every day": "creative",
  "Start a daily writing habit": "creative",
  "Learn sign language basics": "creative",

  // Professional / technical (purple)
  "Learn to code": "professional",
  "Start a side project": "professional",
  "Build a personal website": "professional",
  "Learn video editing": "professional",
  "Master public speaking": "professional",
  "Start a YouTube channel": "professional",
  "Launch a newsletter": "professional",
  "Learn graphic design basics": "professional",
};

/** Tailwind class sets for each goal category — uses sunset light palette. */
export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  fitness: "border-[#FFE633] bg-[#FFE633]/25 hover:bg-[#FFE633]/40 hover:border-[#FFE633]",
  creative: "border-[#FF6B2B] bg-[#FF6B2B]/25 hover:bg-[#FF6B2B]/40 hover:border-[#FF6B2B]",
  professional: "border-[#FF2D55] bg-[#FF2D55]/25 hover:bg-[#FF2D55]/40 hover:border-[#FF2D55]",
  lifestyle: "border-[#00EAFF] bg-[#00EAFF]/25 hover:bg-[#00EAFF]/40 hover:border-[#00EAFF]",
};

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
