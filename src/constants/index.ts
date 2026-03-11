/** Shared constants used across multiple components. */

/** Aurora gradient background colors (green, cyan, indigo). */
export const AURORA_COLORS = ["#7cff67", "#00c7fc", "#5227FF"] as const;

/** Vivid bright mosaic tile colors — used in outer zones. */
export const MOSAIC_BRIGHT_COLORS = [
  "#7cff67", "#00c7fc", "#5227FF", "#cc5533",
  "#b5a6ff", "#ff6b6b", "#c8ffbe", "#a3e2fd",
] as const;

/** Dark mosaic tile colors — used in text safe zone. */
export const MOSAIC_DARK_COLORS = [
  "#0a0a1e", "#12122e", "#1a1a3e", "#1e1e45", "#242450",
] as const;

/** Default safe zone for dual-zone mosaic cards. */
export const DEFAULT_SAFE_ZONE = {
  yStart: 0.20, yEnd: 0.80, bleedProbability: 0.15,
} as const;

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

/** Tailwind class sets for each goal category — uses Aurora accent colors. */
export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  fitness: "border-[#7cff67] bg-[#7cff67]/25 hover:bg-[#7cff67]/40 hover:border-[#7cff67]",
  creative: "border-[#00c7fc] bg-[#00c7fc]/25 hover:bg-[#00c7fc]/40 hover:border-[#00c7fc]",
  professional: "border-[#5227FF] bg-[#5227FF]/25 hover:bg-[#5227FF]/40 hover:border-[#5227FF]",
  lifestyle: "border-[#ff6b6b] bg-[#ff6b6b]/25 hover:bg-[#ff6b6b]/40 hover:border-[#ff6b6b]",
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
