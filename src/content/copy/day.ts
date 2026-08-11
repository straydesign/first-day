export const day = {
  todayTitle: (n: number) => `Today · Day ${n}`,
  dayTitle: (n: number) => `Day ${n}`,

  completedBadge: "Day Completed",
  completedNote: "Your activities and notes are saved below.",

  multiplierChip: (n: number) => `${n}x XP Day`,
  challengePrefix: "Challenge:",
  challengeBonus: (n: number) => `(+${n} XP)`,

  activitiesLabel: "Your Activities",

  youtubePrefix: "Search YouTube:",

  feedbackLabel: "How did today go?",
  feedbackPlaceholder: "Share your thoughts, challenges, or wins from today...",
  feedbackHelper: "Reflect on your progress — what went well and what you can improve.",

  emptyTitle: "Activities for this day are not available yet.",
  emptyHelper: "Check back later or contact support if this persists.",

  completeButton: "Complete Day",

  xpPreviewPrefix: "You'll earn ~",
  xpPreviewSuffix: "XP",
  xpMultiplierNote: (n: number) => `(${n}x)`,

  validationTitle: "Check at least one activity or add a reflection to continue",
  validationButton: "Got It",
} as const;
