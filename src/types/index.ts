/** Core domain types for the First Day app. */

export type AppView =
  | "landing"
  | "goals"
  | "onboarding"
  | "calendar"
  | "day"
  | "congrats"
  | "settings"
  | "privacy"
  | "terms"
  | "reset-password";

export interface ActivityResource {
  type: "youtube" | "link";
  url?: string;
  title?: string;
  query?: string;
}

export interface Activity {
  text: string;
  resources?: ActivityResource[];
}

export interface DayPlan {
  title: string;
  activities: (string | Activity)[];
  tip?: string;
  weeklyBook?: {
    title: string;
    author: string;
    description?: string;
    reason?: string;
  };
}

export interface Plan {
  cleanedGoal?: string;
  startDate: string;
  days: Record<number, DayPlan>;
}

export interface DayProgress {
  completed?: boolean | Record<number, boolean>;
  feedback?: string;
  reflection?: string;
  completedAt?: string;
}

export type ProgressMap = Record<number, DayProgress>;

export interface Goal {
  id: string;
  title: string;
  goal?: string;
  timeCommitment?: string;
  timeSlot?: string;
  availableDays?: string[];
  wantsWeeklyBooks?: boolean;
  contextAnswers?: Record<string, string>;
  startDate: string;
  completedDays: number;
  totalDays: number;
}

export interface GoalFormData {
  goal: string;
  why?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  priorExperience?: string;
  preferredTactics?: string;
  contextAnswers?: Record<string, string>;
  timeCommitment?: string;
  timeSlot?: string;
  availableDays?: string[];
  wantsWeeklyBooks?: boolean;
  timestamp?: number;
}

export interface SelectedDay {
  number: number;
  date: string;
  dateDisplay?: string;
  isToday?: boolean;
  title?: string;
  activities: (string | Activity)[];
  tip?: string;
}

// --- Engagement System Types ---

export type LevelName = "Beginner" | "Committed" | "Dedicated" | "Unstoppable" | "Master";

export interface Level {
  name: LevelName;
  threshold: number;
  nextThreshold: number | null;
}

export interface XPBreakdown {
  base: number;
  activities: number;
  reflection: number;
  streakBonus: number;
  total: number;
}

export type MilestoneIntensity = "normal" | "big" | "epic";

export interface Milestone {
  type: "day" | "streak";
  icon: string;
  title: string;
  message: string;
  intensity: MilestoneIntensity;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface EngagementState {
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  totalXP: number;
  level: Level;
  levelProgress: number;
  achievements: Achievement[];
  completionRate: number;
  totalDaysCompleted: number;
}
