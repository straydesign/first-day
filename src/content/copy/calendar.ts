export const calendar = {
  // TopBar / fallbacks
  planTitleFallback: "Your Plan",
  dayTitleFallback: (n: number) => `Day ${n}`,
  editButton: "Edit",

  // At-risk streak warning
  streakRiskWarning: (streak: number) =>
    `Complete a lesson today to keep your ${streak}-day streak alive`,
  streakRiskWithFreeze: " — or your freeze will catch you.",
  streakRiskNoFreeze: ".",

  // Section A — Next Lesson hero
  nextLessonEyebrow: "Next Lesson",
  nextLessonCount: (current: number, total: number) => `${current} of ${total}`,
  xpMultiplier: (n: number) => `${n}x XP`,
  bonusXp: (n: number) => `+${n}XP`,
  comebackBadge: "Comeback +50%",
  startLessonButton: "Start Lesson",

  // Section B — Progress summary
  lessonsSuffix: (total: number) => `/ ${total} lessons`,
  progressPercent: (pct: number) => `${pct}%`,
  streakLabel: (streak: number) => `${streak}-day streak`,
  xpLabel: (xp: string) => `${xp} XP`,
  separator: "·",

  // Section C — Lesson path
  sprintReading: (weekNumber: number) => `Sprint ${weekNumber} Reading`,
  bookByAuthor: (author: string) => `by ${author}`,

  // Locked sprint
  lockedSprintLabel: (sprintNumber: number) =>
    `Generates after Sprint ${sprintNumber - 1}`,
  lockedSprintBody:
    "Finish the current sprint to unlock your next 7 days — generated forward when you get here.",

  // Sprint title fallbacks (when plan provides no titles)
  sprintPrefix: (sprintNumber: number) => `Sprint ${sprintNumber}: `,
  sprintTitleSets: {
    fitness: ["Warming Up", "Building Endurance", "Hitting Stride", "Peak Performance"],
    learning: ["Foundation", "Building Blocks", "Gaining Fluency", "Mastery Mode"],
    creative: ["Finding Your Voice", "Building Skills", "Creative Flow", "Finishing Strong"],
    career: ["Foundations", "Building Momentum", "Deep Dive", "Advanced Mastery"],
    generic: ["Foundations", "Build Momentum", "Stretch", "Integrate"],
  },
  sprintTitleFallback: "Keep Going",

  // WeekCalendar — day rows
  dayTitleDash: "—",
  dayLockedLabel: "Locked",
  startBadge: "START",
  completedDate: (date: string) => `Completed ${date}`,
  activityCount: (count: number) => `${count} ${count === 1 ? "activity" : "activities"}`,
} as const;
