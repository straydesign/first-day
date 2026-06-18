import type {
  ProgressMap,
  Plan,
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

/** The classic 4-sprint arc length. Every duration-bounded calculation below
 *  defaults to this so existing 28-day goals are unaffected; goals with a
 *  different cadence pass their own totalDays. */
export const DEFAULT_TOTAL_DAYS = 28;

/** Resolve a plan's length in days, falling back to the classic 28. */
export function getPlanTotalDays(plan: Plan | null | undefined): number {
  return plan?.totalDays ?? DEFAULT_TOTAL_DAYS;
}

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

/** Day number for "today" relative to the plan start (clamped 1–totalDays). */
export function getTodayDayNumber(planStartDate: string, totalDays: number = DEFAULT_TOTAL_DAYS): number {
  const [y, m, d] = planStartDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.min(diff + 1, totalDays));
}

// --- Progression ---

/** First day number (1–totalDays) that is not completed. Returns totalDays + 1
 *  when every day is done (the "all complete" sentinel). */
export function getNextAvailableDay(progress: ProgressMap, totalDays: number = DEFAULT_TOTAL_DAYS): number {
  for (let d = 1; d <= totalDays; d++) {
    if (!isDayCompleted(progress[d])) return d;
  }
  return totalDays + 1;
}

/** Total count of completed days. */
export function getCompletedDayCount(progress: ProgressMap, totalDays: number = DEFAULT_TOTAL_DAYS): number {
  let count = 0;
  for (let d = 1; d <= totalDays; d++) if (isDayCompleted(progress[d])) count++;
  return count;
}

/** Is a given day unlocked (completed already, or the next available one)? */
export function isDayUnlocked(progress: ProgressMap, dayNumber: number, totalDays: number = DEFAULT_TOTAL_DAYS): boolean {
  return dayNumber <= getNextAvailableDay(progress, totalDays);
}

// --- Streaks (calendar-based on completedAt timestamps) ---

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function completedAtToLocalKey(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d);
}

export function calculateStreaks(
  progress: ProgressMap
): { current: number; longest: number; isAtRisk: boolean } {
  const activeDates = new Set<string>();
  for (const dp of Object.values(progress)) {
    if (dp?.completedAt) activeDates.add(completedAtToLocalKey(dp.completedAt));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const todayDone = activeDates.has(todayKey);

  let current = 0;
  const cursor = new Date(today);
  if (todayDone) {
    current = 1;
    cursor.setDate(cursor.getDate() - 1);
    while (activeDates.has(toDateKey(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    cursor.setDate(cursor.getDate() - 1);
    while (activeDates.has(toDateKey(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const isAtRisk = !todayDone && current > 0;

  // Longest consecutive run across all active dates
  const sorted = [...activeDates].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const [y, m, d] = k.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (prev && dt.getTime() - prev.getTime() === 86400000) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = dt;
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

export function calculateTotalXP(progress: ProgressMap, _planStartDate: string, totalDays: number = DEFAULT_TOTAL_DAYS): number {
  let total = 0;
  let runningStreak = 0;
  for (let d = 1; d <= totalDays; d++) {
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
  check: (p: ProgressMap, streak: { current: number; longest: number }, totalDays: number) => boolean;
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
    check: (p, _s, totalDays) => {
      let count = 0;
      for (let d = 1; d <= totalDays; d++) if (isDayCompleted(p[d])) count++;
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
    check: (p, _s, totalDays) => {
      // Check any run of 7 consecutive completed days
      let run = 0;
      for (let d = 1; d <= totalDays; d++) {
        if (isDayCompleted(p[d])) { run++; if (run >= 7) return true; }
        else run = 0;
      }
      return false;
    },
  },
  {
    id: "halfway_hero",
    name: "Halfway Hero",
    description: "Reach the halfway point",
    icon: "🏅",
    check: (p, _s, totalDays) => {
      let count = 0;
      for (let d = 1; d <= totalDays; d++) if (isDayCompleted(p[d])) count++;
      return count >= Math.ceil(totalDays / 2);
    },
  },
  {
    id: "deep_thinker",
    name: "Deep Thinker",
    description: "Write 10 reflections",
    icon: "🧠",
    check: (p, _s, totalDays) => {
      let count = 0;
      for (let d = 1; d <= totalDays; d++) if (hasReflection(p[d])) count++;
      return count >= 10;
    },
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Complete every day",
    icon: "🏆",
    check: (p, _s, totalDays) => {
      for (let d = 1; d <= totalDays; d++) if (!isDayCompleted(p[d])) return false;
      return true;
    },
  },
];

export function calculateAchievements(
  progress: ProgressMap,
  streaks: { current: number; longest: number },
  totalDays: number = DEFAULT_TOTAL_DAYS
): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    unlocked: def.check(progress, streaks, totalDays),
  }));
}

// --- Milestones ---

const DAY_MILESTONES: Record<number, { icon: string; title: string; message: string; intensity: MilestoneIntensity }> = {
  1:  { icon: "🚀", title: "Liftoff!", message: "You've taken the first step. The hardest part is starting.", intensity: "big" },
  7:  { icon: "🔥", title: "Sprint 1 Complete!", message: "7 days in — your first sprint is done. Sprint 2 is generating now.", intensity: "epic" },
  14: { icon: "⚡", title: "Sprint 2 Complete!", message: "Halfway. Most quit before here — you didn't. Sprint 3 is ready.", intensity: "epic" },
  21: { icon: "💎", title: "Sprint 3 Complete!", message: "Three sprints down. One more decides whether this becomes who you are.", intensity: "epic" },
  28: { icon: "🏆", title: "Goal Crushed!", message: "4 sprints. 28 days. You did what most people never finish.", intensity: "epic" },
};

export function getMilestone(
  dayNumber: number,
  currentStreak: number,
  totalDays: number = DEFAULT_TOTAL_DAYS
): Milestone | null {
  // Finale for non-28 goals — the curated DAY_MILESTONES finale lives at day 28,
  // so a longer/shorter goal needs its "you finished" beat at its real last day.
  if (totalDays !== DEFAULT_TOTAL_DAYS && dayNumber === totalDays) {
    return {
      type: "day",
      icon: "🏆",
      title: "Goal Crushed!",
      message: `${totalDays} days done. You finished what most people never start.`,
      intensity: "epic",
    };
  }

  // Day milestones take priority
  const dayM = DAY_MILESTONES[dayNumber];
  if (dayM) {
    // For goals longer than 28, day 28 is NOT the end — downgrade its finale copy
    // to a progress beat so we don't tell the user they're done early.
    if (dayNumber === DEFAULT_TOTAL_DAYS && totalDays > DEFAULT_TOTAL_DAYS) {
      return {
        type: "day",
        icon: "⚡",
        title: "Four Weeks Strong!",
        message: `28 days in, ${totalDays - dayNumber} to go. Keep the streak alive to the finish.`,
        intensity: "big",
      };
    }
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
export function calculateStreakFreezes(progress: ProgressMap, totalDays: number = DEFAULT_TOTAL_DAYS): number {
  let maxStreak = 0;
  let run = 0;
  for (let d = 1; d <= totalDays; d++) {
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
  _planStartDate: string,
  totalDays: number = DEFAULT_TOTAL_DAYS
): EngagementState {
  const streaks = calculateStreaks(progress);
  const totalXP = calculateTotalXP(progress, _planStartDate, totalDays);
  const level = getLevel(totalXP);
  const levelProgress = getLevelProgress(totalXP);
  const achievements = calculateAchievements(progress, streaks, totalDays);
  const streakFreezes = calculateStreakFreezes(progress, totalDays);

  const totalDaysCompleted = getCompletedDayCount(progress, totalDays);
  const nextDay = getNextAvailableDay(progress, totalDays);
  const completionRate = Math.round((totalDaysCompleted / totalDays) * 100);
  const dailyMultiplier = getDailyMultiplier(nextDay);
  const dailyChallenge = getDailyChallenge(nextDay);
  const comebackCheck = isComeback(progress, nextDay);

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
