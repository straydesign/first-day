/** Shared constants used across multiple components. */

/** Sunset Sky — Light palette (foreground tiles, highlights) */
export const VORONOI_LIGHT = [
  "#FFD166", // Golden Peach
  "#FF9E7A", // Warm Apricot
  "#FF6F91", // Soft Coral
  "#FFB3C6", // Rose Pink
] as const;

/** Sunset Sky — Dark palette (deep backgrounds, shadows) */
export const VORONOI_DARK = [
  "#5227FF", // Deep Violet
  "#3A0CA3", // Indigo Blue
  "#1B1B3A", // Burnt Magenta
  "#0B132B", // Midnight Navy
] as const;

/** Combined palette — default for VoronoiMosaic */
export const VORONOI_PALETTE = [...VORONOI_LIGHT, ...VORONOI_DARK] as const;

/** Aurora gradient background colors (sunset accents). */
export const AURORA_COLORS = ["#FFD166", "#FF6F91", "#5227FF"] as const;

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
  fitness: "border-[#FFD166] bg-[#FFD166]/25 hover:bg-[#FFD166]/40 hover:border-[#FFD166]",
  creative: "border-[#FF9E7A] bg-[#FF9E7A]/25 hover:bg-[#FF9E7A]/40 hover:border-[#FF9E7A]",
  professional: "border-[#FF6F91] bg-[#FF6F91]/25 hover:bg-[#FF6F91]/40 hover:border-[#FF6F91]",
  lifestyle: "border-[#FFB3C6] bg-[#FFB3C6]/25 hover:bg-[#FFB3C6]/40 hover:border-[#FFB3C6]",
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
