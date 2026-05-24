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
  | "reset-password"
  | "gallery";

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
  /** Owner identity for shared/published rooms. Optional — never required at load. */
  ownerUserId?: string;
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
  /** Owner identity for shared/published goals. Optional — never required at load. */
  ownerUserId?: string;
}

// --- Social Surface Types ---

export type MoodTileKind = "warm" | "cool" | "spark" | "weight" | "quiet";

/**
 * REDACTED projection of a Plan safe to publish to the gallery.
 * Includes day titles only — never activities, tips, contextAnswers, why.
 */
export interface PublishedPlanJson {
  /** Schema version so future projections can evolve without server changes. */
  v: 1;
  cleanedGoal?: string;
  /** Day-by-day breakdown, titles only. */
  days: Array<{ number: number; title: string; activityCount: number }>;
}

export interface PublicRoomRow {
  id: string;
  owner_user_id: string;
  goal_title: string;
  cleaned_goal?: string | null;
  published_plan_json: PublishedPlanJson;
  position_x: number;
  position_y: number;
  position_z: number;
  color: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** Slim row used to render distant gallery markers without pulling full plans. */
export interface PublicRoomMarker {
  id: string;
  ownerUserId: string;
  goalTitle: string;
  position: [number, number, number];
  color: string;
  updatedAt: string;
}

export interface ReactionRow {
  id: string;
  room_id: string;
  author_user_id: string;
  kind: MoodTileKind;
  wall_face: number;
  anchor_u: number;
  anchor_v: number;
  created_at: string;
}

export interface ReactionTile {
  id: string;
  roomId: string;
  authorUserId: string;
  kind: MoodTileKind;
  wallFace: number;
  u: number;
  v: number;
  createdAt: string;
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
  multiplier: number;
  challengeBonus: number;
  comebackBonus: number;
  total: number;
}

export interface DailyChallenge {
  id: string;
  description: string;
  /** Bonus XP awarded when challenge is met */
  bonusXP: number;
  /** Function name to check if challenge is met (computed in engagement.ts) */
  checkKey: string;
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
  /** Number of streak freezes earned (1 per 7-streak milestone, max 3) */
  streakFreezes: number;
  /** Today's XP multiplier (1.0 - 3.0, deterministic per day) */
  dailyMultiplier: number;
  /** Today's bonus challenge */
  dailyChallenge: DailyChallenge;
  /** Whether today is a comeback day (returning after a gap) */
  isComeback: boolean;
}
