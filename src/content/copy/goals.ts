export const goals = {
  loading: "Loading your goals…",
  topBarTitle: "Your goals",
  lessonLabel: (completed: number, total: number) => `Lesson ${completed} of ${total}`,
  hooks: {
    dailyMultiplier: (multiplier: number) => `Today: ${multiplier}× XP`,
    streakFreeze: (count: number) => `${count} Streak Freeze${count > 1 ? "s" : ""}`,
    comeback: "Welcome Back Bonus Active",
  },
  addGoal: "Add new goal",
  emptyState: {
    heading: "Set Your First Goal",
    body: "Pick any goal — your first 7-day sprint is ready in seconds. Three more sprints generate as you go.",
  },
} as const;
