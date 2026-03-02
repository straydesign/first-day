/** Shared constants used across multiple components. */

/** Aurora gradient background colors (green, cyan, indigo). */
export const AURORA_COLORS = ["#7cff67", "#00c7fc", "#5227FF"] as const;

/** Goal category type for color mapping. */
export type GoalCategory = "running" | "language" | "coding" | "meditation";

/** Maps goal suggestion strings to categories for color-coding. */
export const GOAL_CATEGORY_MAP: Record<string, GoalCategory> = {
  // Fitness / health (green)
  "Get in shape": "running",
  "Build a morning routine": "running",
  "Do 50 pushups a day": "running",
  "Walk 10,000 steps daily": "running",
  "Stretch for 15 min daily": "running",
  "Drink more water daily": "running",

  // Mindfulness / lifestyle (coral)
  "Start a meditation practice": "meditation",
  "Cook a new recipe every week": "meditation",
  "Journal every morning": "meditation",
  "Read for 30 min before bed": "meditation",
  "Declutter one room a week": "meditation",
  "Practice gratitude daily": "meditation",
  "Sleep by 10pm every night": "meditation",
  "Spend less time on my phone": "meditation",

  // Creative / learning (blue)
  "Learn Spanish basics": "language",
  "Learn to play guitar": "language",
  "Write a short story": "language",
  "Learn photography basics": "language",
  "Read 10 books this month": "language",
  "Draw something every day": "language",
  "Start a daily writing habit": "language",
  "Learn sign language basics": "language",

  // Professional / technical (purple)
  "Learn to code": "coding",
  "Start a side project": "coding",
  "Build a personal website": "coding",
  "Learn video editing": "coding",
  "Master public speaking": "coding",
  "Start a YouTube channel": "coding",
  "Launch a newsletter": "coding",
  "Learn graphic design basics": "coding",
};

/** Tailwind class sets for each goal category — uses Aurora accent colors. */
export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  running: "border-[#7cff67] bg-[#7cff67]/10 hover:bg-[#7cff67]/20 hover:border-[#7cff67]",
  language: "border-[#00c7fc] bg-[#00c7fc]/10 hover:bg-[#00c7fc]/20 hover:border-[#00c7fc]",
  coding: "border-[#5227FF] bg-[#5227FF]/10 hover:bg-[#5227FF]/20 hover:border-[#5227FF]",
  meditation: "border-[#ff6b6b] bg-[#ff6b6b]/10 hover:bg-[#ff6b6b]/20 hover:border-[#ff6b6b]",
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
  "Read 10 books this month", "Draw something every day", "Declutter one room a week",
  "Learn graphic design basics", "Start a daily writing habit", "Practice gratitude daily",
  "Walk 10,000 steps daily", "Sleep by 10pm every night",
];
