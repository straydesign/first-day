export const planComplete = {
  headline: "Goal Crushed",
  subLine: {
    full: "28 lessons. 4 sprints. You proved you can do anything you set your mind to.",
    short: (totalDays: number) =>
      `${totalDays} days straight. You proved you can do anything you set your mind to.`,
  },
  stats: {
    daysDone: "Days Done",
    longestStreak: "Longest Streak",
    xpEarned: "XP Earned",
    levelReached: "Level Reached",
  },
  statSuffixes: {
    longestStreak: " days",
  },
  levelFallback: "Master",
  achievementsHeading: (count: number) =>
    `${count} ${count === 1 ? "Achievement" : "Achievements"} Unlocked`,
  share: {
    title: (totalDays: number) => `I finished ${totalDays} days`,
    text: (
      totalDays: number,
      goalTitle: string | undefined,
      longestStreak: number,
      totalXP: number,
      achievementCount: number,
    ) =>
      `I just finished ${totalDays} days on First Day${goalTitle ? `: ${goalTitle}` : ""}.\n\n${totalDays} days · ${longestStreak}-day streak · ${totalXP.toLocaleString()} XP · ${achievementCount} achievements`,
  },
  buttons: {
    copied: "Copied",
    shareMyJourney: "Share My Journey",
    startNextGoal: "Start Next Goal",
  },
} as const;
