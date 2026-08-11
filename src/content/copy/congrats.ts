export const congrats = {
  headline: {
    dayComplete: (dayNumber: number) => `Day ${dayNumber} Complete!`,
    fallback: "Congratulations!",
  },
  xpLines: {
    base: "Day complete",
    activities: "Activities",
    reflection: "Reflection",
    streakBonus: "Streak bonus",
    challengeBonus: "Challenge bonus",
    comebackBonus: "Comeback bonus",
  },
  sprint: {
    progressLabel: (currentSprint: number, sprintCount: number) =>
      `Sprint ${currentSprint} of ${sprintCount}`,
    complete: "Sprint complete",
    dayOfTotal: (dayNumber: number, totalDays: number) =>
      `Day ${dayNumber} of ${totalDays}`,
    dotLabel: (sprint: number) => `S${sprint}`,
  },
  multiplierLabel: (multiplier: number) => `${multiplier}× Multiplier Day`,
  xpTotal: (total: number) => `+${total} XP`,
  comeback: {
    weekDone: (currentSprint: number, daysToGo: number) =>
      `Week ${currentSprint} done — ${daysToGo} ${daysToGo === 1 ? "day" : "days"} to go. Come back tomorrow.`,
    tomorrow: "Come back tomorrow for another shard.",
  },
  completed: {
    allSprints: "You did it — all 4 sprints complete.",
    allDays: (totalDays: number) => `You did it — all ${totalDays} days complete.`,
  },
  buttons: {
    viewCalendar: "View Calendar",
    backToGoals: "Back to Goals",
  },
} as const;
