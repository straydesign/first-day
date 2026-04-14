import type {
  ProgressMap,
  DayProgress,
  EngagementState,
  Level,
  LevelName,
  XPBreakdown,
  Achievement,
  Milestone,
  MilestoneIntensity,
  DailyChallenge,
} from "@/types";

// --- Helpers ---

export function isDayCompleted(dp: DayProgress | undefined): boolean {
  if (!dp || !dp.completed) return false;
  if (typeof dp.completed === "boolean") return dp.completed;
  return Object.values(dp.completed).some(Boolean);
}

function countCheckedActivities(dp: DayProgress | undefined): number {
  if (!dp?.completed || typeof dp.completed === "boolean") return 0;
  return Object.values(dp.completed).filter(Boolean).length;
}

function hasReflection(dp: DayProgress | undefined): boolean {
  return !!(dp?.feedback?.trim() || dp?.reflection?.trim());
}

/** Day number for "today" relative to the plan start (clamped 1–30). */
export function getTodayDayNumber(planStartDate: string): number {
  const [y, m, d] = planStartDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.min(diff + 1, 30));
}

// --- Streaks ---

export function calculateStreaks(
  progress: ProgressMap,
  planStartDate: string
): { current: number; longest: number; isAtRisk: boolean } {
  const todayDay = getTodayDayNumber(planStartDate);

  // Current streak: count backwards from today (or yesterday if today not done)
  let current = 0;
  let startFrom = todayDay;
  const todayDone = isDayCompleted(progress[todayDay]);

  if (!todayDone) {
    startFrom = todayDay - 1;
  }

  for (let d = startFrom; d >= 1; d--) {
    if (isDayCompleted(progress[d])) current++;
    else break;
  }

  // isAtRisk: today not done AND there's a streak from yesterday
  const isAtRisk = !todayDone && current > 0;

  // Longest streak: scan all days
  let longest = 0;
  let run = 0;
  for (let d = 1; d <= 30; d++) {
    if (isDayCompleted(progress[d])) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  return { current, longest, isAtRisk };
}

// --- XP ---

export function calculateDayXP(
  dayProgress: DayProgress | undefined,
  streakAtDay: number,
  dayNumber: number = 1,
  totalActivities: number = 0,
  progressMap: ProgressMap = {}
): XPBreakdown {
  if (!isDayCompleted(dayProgress)) {
    return { base: 0, activities: 0, reflection: 0, streakBonus: 0, multiplier: 1, challengeBonus: 0, comebackBonus: 0, total: 0 };
  }

  const base = 100;
  const activities = countCheckedActivities(dayProgress) * 10;
  const reflection = hasReflection(dayProgress) ? 25 : 0;
  const streakBonus = streakAtDay * 5;

  // Daily challenge bonus
  const challenge = getDailyChallenge(dayNumber);
  const challengeBonus = isDailyChallengeMet(challenge, dayProgress, totalActivities) ? challenge.bonusXP : 0;

  // Comeback bonus: 50% more base XP on return after gap
  const comebackBonus = isComeback(progressMap, dayNumber) ? Math.round(base * 0.5) : 0;

  // Daily multiplier applied to subtotal
  const multiplier = getDailyMultiplier(dayNumber);
  const subtotal = base + activities + reflection + streakBonus + challengeBonus + comebackBonus;
  const total = Math.round(subtotal * multiplier);

  return { base, activities, reflection, streakBonus, multiplier, challengeBonus, comebackBonus, total };
}

/** Preview XP for a day before completing (live preview on DayView). */
export function previewDayXP(
  checkedCount: number,
  hasReflectionText: boolean,
  currentStreak: number,
  dayNumber: number = 1
): XPBreakdown {
  const base = 100;
  const activities = checkedCount * 10;
  const reflection = hasReflectionText ? 25 : 0;
  const streakBonus = (currentStreak + 1) * 5;
  const multiplier = getDailyMultiplier(dayNumber);
  const subtotal = base + activities + reflection + streakBonus;
  const total = Math.round(subtotal * multiplier);
  return { base, activities, reflection, streakBonus, multiplier, challengeBonus: 0, comebackBonus: 0, total };
}

export function calculateTotalXP(progress: ProgressMap, _planStartDate: string): number {
  let total = 0;
  let runningStreak = 0;
  for (let d = 1; d <= 30; d++) {
    if (isDayCompleted(progress[d])) {
      runningStreak++;
      const xp = calculateDayXP(progress[d], runningStreak, d, 0, progress);
      total += xp.total;
    } else {
      runningStreak = 0;
    }
  }
  return total;
}

/** Get XP breakdown for a specific completed day (used in congrats). */
export function getLatestDayXP(
  progress: ProgressMap,
  dayNumber: number
): XPBreakdown {
  let streak = 0;
  for (let d = dayNumber; d >= 1; d--) {
    if (isDayCompleted(progress[d])) streak++;
    else break;
  }
  return calculateDayXP(progress[dayNumber], streak, dayNumber, 0, progress);
}

// --- Levels ---

const LEVELS: { name: LevelName; threshold: number }[] = [
  { name: "Beginner", threshold: 0 },
  { name: "Committed", threshold: 500 },
  { name: "Dedicated", threshold: 1200 },
  { name: "Unstoppable", threshold: 2200 },
  { name: "Master", threshold: 3500 },
];

export function getLevel(totalXP: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXP >= lvl.threshold) current = lvl;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  return {
    name: current.name,
    threshold: current.threshold,
    nextThreshold: next ? next.threshold : null,
  };
}

export function getLevelProgress(totalXP: number): number {
  const level = getLevel(totalXP);
  if (!level.nextThreshold) return 1;
  const range = level.nextThreshold - level.threshold;
  return Math.min(1, (totalXP - level.threshold) / range);
}

// --- Achievements ---

const ACHIEVEMENT_DEFS: {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (p: ProgressMap, streak: { current: number; longest: number }) => boolean;
}[] = [
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first day",
    icon: "👟",
    check: (p) => isDayCompleted(p[1]),
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Achieve a 3-day streak",
    icon: "🔥",
    check: (_, s) => s.longest >= 3,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Complete 7 days total",
    icon: "⚔️",
    check: (p) => {
      let count = 0;
      for (let d = 1; d <= 30; d++) if (isDayCompleted(p[d])) count++;
      return count >= 7;
    },
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Achieve a 7-day streak",
    icon: "💪",
    check: (_, s) => s.longest >= 7,
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete 7 consecutive days in a week",
    icon: "⭐",
    check: (p) => {
      // Check any run of 7 consecutive completed days
      let run = 0;
      for (let d = 1; d <= 30; d++) {
        if (isDayCompleted(p[d])) { run++; if (run >= 7) return true; }
        else run = 0;
      }
      return false;
    },
  },
  {
    id: "halfway_hero",
    name: "Halfway Hero",
    description: "Complete 15 days",
    icon: "🏅",
    check: (p) => {
      let count = 0;
      for (let d = 1; d <= 30; d++) if (isDayCompleted(p[d])) count++;
      return count >= 15;
    },
  },
  {
    id: "deep_thinker",
    name: "Deep Thinker",
    description: "Write 10 reflections",
    icon: "🧠",
    check: (p) => {
      let count = 0;
      for (let d = 1; d <= 30; d++) if (hasReflection(p[d])) count++;
      return count >= 10;
    },
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Complete all 30 days",
    icon: "🏆",
    check: (p) => {
      for (let d = 1; d <= 30; d++) if (!isDayCompleted(p[d])) return false;
      return true;
    },
  },
];

export function calculateAchievements(
  progress: ProgressMap,
  streaks: { current: number; longest: number }
): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    unlocked: def.check(progress, streaks),
  }));
}

// --- Milestones ---

const DAY_MILESTONES: Record<number, { icon: string; title: string; message: string; intensity: MilestoneIntensity }> = {
  1:  { icon: "🚀", title: "Liftoff!", message: "You've taken the first step. The hardest part is starting.", intensity: "big" },
  7:  { icon: "🔥", title: "One Week Down!", message: "7 days in — you're building real momentum.", intensity: "big" },
  14: { icon: "⚡", title: "Two Weeks Strong!", message: "Halfway through the first half. You're locked in.", intensity: "big" },
  15: { icon: "🏅", title: "Halfway There!", message: "15 days complete. You're officially in the second half.", intensity: "epic" },
  21: { icon: "💎", title: "Three Weeks!", message: "21 days — they say it takes this long to build a habit.", intensity: "epic" },
  30: { icon: "🏆", title: "Goal Crushed!", message: "30 days. You proved you can do anything you set your mind to.", intensity: "epic" },
};

export function getMilestone(
  dayNumber: number,
  currentStreak: number
): Milestone | null {
  // Day milestones take priority
  const dayM = DAY_MILESTONES[dayNumber];
  if (dayM) {
    return { type: "day", ...dayM };
  }

  // Streak milestones at every 5th streak day
  if (currentStreak > 0 && currentStreak % 5 === 0) {
    const intensity: MilestoneIntensity = currentStreak >= 20 ? "epic" : currentStreak >= 10 ? "big" : "normal";
    return {
      type: "streak",
      icon: "🔥",
      title: `${currentStreak}-Day Streak!`,
      message: `You've been consistent for ${currentStreak} days straight. Incredible!`,
      intensity,
    };
  }

  return null;
}

// --- Streak Freezes ---

/** Count streak freezes earned: 1 per 7-streak milestone hit, max 3. */
export function calculateStreakFreezes(progress: ProgressMap): number {
  let maxStreak = 0;
  let run = 0;
  for (let d = 1; d <= 30; d++) {
    if (isDayCompleted(progress[d])) {
      run++;
      if (run > maxStreak) maxStreak = run;
    } else {
      run = 0;
    }
  }
  // 1 freeze at 7, 2 at 14, 3 at 21
  return Math.min(3, Math.floor(maxStreak / 7));
}

// --- Daily Multiplier ---

/** Deterministic daily multiplier based on day number (1.0x to 3.0x). */
export function getDailyMultiplier(dayNumber: number): number {
  // Simple hash: prime multiplication mod 5 gives 0-4, map to 1.0-3.0
  const hash = ((dayNumber * 7919) + 13) % 5;
  return 1.0 + hash * 0.5;
}

// --- Daily Challenges ---

const DAILY_CHALLENGES: Omit<DailyChallenge, "checkKey">[] = [
  { id: "reflect_50", description: "Write a 50+ word reflection", bonusXP: 50 },
  { id: "all_activities", description: "Complete every activity", bonusXP: 75 },
  { id: "reflect_deep", description: "Write a 100+ word reflection", bonusXP: 100 },
  { id: "reflect_any", description: "Include a reflection today", bonusXP: 30 },
];

/** Get today's rotating challenge based on day number. */
export function getDailyChallenge(dayNumber: number): DailyChallenge {
  const challenge = DAILY_CHALLENGES[dayNumber % DAILY_CHALLENGES.length];
  return { ...challenge, checkKey: challenge.id };
}

/** Check if a daily challenge was met for a given day's progress. */
export function isDailyChallengeMet(
  challenge: DailyChallenge,
  dayProgress: DayProgress | undefined,
  totalActivities: number
): boolean {
  if (!dayProgress) return false;
  const feedback = dayProgress.feedback?.trim() || dayProgress.reflection?.trim() || "";
  const wordCount = feedback.split(/\s+/).filter(Boolean).length;

  switch (challenge.id) {
    case "reflect_50":
      return wordCount >= 50;
    case "all_activities": {
      if (!dayProgress.completed || typeof dayProgress.completed === "boolean") return false;
      const checked = Object.values(dayProgress.completed).filter(Boolean).length;
      return totalActivities > 0 && checked >= totalActivities;
    }
    case "reflect_deep":
      return wordCount >= 100;
    case "reflect_any":
      return wordCount > 0;
    default:
      return false;
  }
}

// --- Comeback Detection ---

/** Check if completing this day is a "comeback" (gap exists before it). */
export function isComeback(progress: ProgressMap, dayNumber: number): boolean {
  if (dayNumber <= 1) return false;
  // Check if the previous day was NOT completed but there's history before the gap
  const prevDone = isDayCompleted(progress[dayNumber - 1]);
  if (prevDone) return false;
  // Look for any completed day before the gap
  for (let d = dayNumber - 2; d >= 1; d--) {
    if (isDayCompleted(progress[d])) return true;
  }
  return false;
}

// --- Main Computation ---

export function computeEngagementState(
  progress: ProgressMap,
  planStartDate: string
): EngagementState {
  const streaks = calculateStreaks(progress, planStartDate);
  const totalXP = calculateTotalXP(progress, planStartDate);
  const level = getLevel(totalXP);
  const levelProgress = getLevelProgress(totalXP);
  const achievements = calculateAchievements(progress, streaks);
  const streakFreezes = calculateStreakFreezes(progress);

  let totalDaysCompleted = 0;
  for (let d = 1; d <= 30; d++) {
    if (isDayCompleted(progress[d])) totalDaysCompleted++;
  }

  const todayDay = getTodayDayNumber(planStartDate);
  const completionRate = todayDay > 0 ? Math.round((totalDaysCompleted / todayDay) * 100) : 0;
  const dailyMultiplier = getDailyMultiplier(todayDay);
  const dailyChallenge = getDailyChallenge(todayDay);
  const comebackCheck = isComeback(progress, todayDay);

  return {
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    isAtRisk: streaks.isAtRisk,
    totalXP,
    level,
    levelProgress,
    achievements,
    completionRate,
    totalDaysCompleted,
    streakFreezes,
    dailyMultiplier,
    dailyChallenge,
    isComeback: comebackCheck,
  };
}
