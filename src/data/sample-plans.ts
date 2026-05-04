/**
 * Sample 7-day plans used by landing-page demos (LivePlanDemo +
 * DayCompleteDemo). Single source of truth so picking a goal in the
 * "magic moment" demo flows through to the dopamine-loop demo below.
 */

export const QUICK_GOALS = [
  "Learn guitar",
  "Run a 5K",
  "Write a novel",
  "Code daily",
  "Meditate",
] as const;

export type QuickGoal = (typeof QUICK_GOALS)[number];

export const CANNED_PLANS: Record<string, string[]> = {
  "Learn guitar": [
    "Tune up + fret hand basics",
    "Three open chords: G, C, D",
    "Strumming patterns 4/4",
    "Switch chords cleanly",
    "Play your first song",
    "Add minor chords (Am, Em)",
    "Record yourself, review",
  ],
  "Run a 5K": [
    "Walk-jog 20 min, easy pace",
    "Form drills + 1mi run",
    "Rest + stretch + foam roll",
    "Intervals: 4×400m",
    "Easy 1.5mi conversational",
    "Long slow 2mi run",
    "Time trial — full 5K",
  ],
  "Write a novel": [
    "Premise: 1 sentence + 3 act spine",
    "Cast: 4 characters, 1 wound each",
    "Outline 12 scenes",
    "Write opening 500 words",
    "Daily 500w, no editing",
    "Push to act-2 turn",
    "Crash through to climax",
  ],
  "Code daily": [
    "Set up environment + repo",
    "Solve 1 LeetCode easy",
    "Refactor an old script",
    "Build a tiny CLI tool",
    "Write tests for something",
    "Read someone else's code",
    "Ship something publicly",
  ],
  Meditate: [
    "5 min breath, eyes closed",
    "Body scan, 10 min",
    "Noting practice — thoughts as 'thinking'",
    "Loving-kindness, 10 min",
    "Walking meditation, 15 min",
    "Open awareness, 15 min",
    "Silent sit, 20 min",
  ],
};

export const FALLBACK_PLAN: string[] = [
  "Define what 'done' looks like",
  "Block 30 min on the calendar",
  "Take the smallest first step",
  "Show up — even when tired",
  "Iterate on what's working",
  "Push past the dip",
  "Reflect, celebrate, plan next",
];

export const DEFAULT_DEMO_GOAL: QuickGoal = "Learn guitar";

export function planFor(goal: string): string[] {
  return CANNED_PLANS[goal] ?? FALLBACK_PLAN;
}
