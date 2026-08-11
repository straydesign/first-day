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

/** A single fretted (or open) note in a riff, in playing order.
 *  Strings are numbered the way tab is read: 1 = high e (thinnest, top line),
 *  6 = low E (thickest, bottom line). This matches every tab on the internet. */
export interface RiffNote {
  /** 1 (high e) … 6 (low E). */
  string: number;
  /** Fret pressed; 0 = open string. A muted/dead note uses technique "x". */
  fret: number;
  /** Optional playing technique that decorates this note:
   *  "h" hammer-on into it · "p" pull-off into it · "/" slide up into it ·
   *  "\\" slide down into it · "b" bend it · "~" vibrato · "x" dead/muted note. */
  technique?: "h" | "p" | "/" | "\\" | "b" | "~" | "x";
}

/** A chord struck in a single step of a riff — references a {@link ChordShape}
 *  by name (defined once in {@link GuitarRiff.chords}). In the tab it renders as
 *  the shape's fretted numbers stacked in one column; the shape is also drawn as
 *  a fingering diagram beneath the board so the player can learn it. */
export interface ChordHit {
  /** Name matching a ChordShape in the riff's `chords` list, e.g. "Em". */
  chord: string;
}

/** One step in a riff, left → right: either a single note or a chord struck
 *  together. Discriminated by the presence of `chord`. */
export type RiffStep = RiffNote | ChordHit;

/** A chord fingering, drawn as the standard 6-string chord box beneath the tab.
 *  This is the "teach the chord" surface — name + shape + a plain-English hint. */
export interface ChordShape {
  /** Chord name, e.g. "Em", "G", "Cadd9". */
  name: string;
  /** Fret per string from LOW E (6th string) → high e (1st string).
   *  0 = open, -1 = muted/not played, ≥1 = fretted. */
  frets: [number, number, number, number, number, number];
  /** One-line plain-English explanation shown under the diagram. */
  hint?: string;
}

/** A structured guitar riff rendered as tablature in the day view. A sequence of
 *  steps (single notes and/or chords), read left → right. 15–25 steps. Chords
 *  used are defined once in `chords` and diagrammed beneath the board. */
export interface GuitarRiff {
  /** Short descriptive name, e.g. "Minor Pentatonic Climb". */
  name: string;
  /** 1 (easiest) … 5 (hardest) — drives the difficulty dots. */
  difficulty?: 1 | 2 | 3 | 4 | 5;
  /** Musical key/scale label, e.g. "E minor". Display only. */
  key?: string;
  /** Suggested practice tempo in beats per minute. */
  bpm?: number;
  /** The skill this riff drills, e.g. "hammer-ons & pull-offs". */
  teaches?: string;
  /** Ordered steps, left → right — each a single note or a chord. */
  steps: RiffStep[];
  /** Chord shapes used by any ChordHit steps — diagrammed + explained below. */
  chords?: ChordShape[];
}

/**
 * A domain-specific thing an activity can render instead of being a line of text.
 *
 * "Practise the E minor pentatonic" is a sentence. Actual tablature is the
 * product. Same for a routine's schedule, a recipe's ingredients, a chapter
 * outline — each goal type has a shape that a generic bullet list cannot carry.
 *
 * Adding a domain means: one entry in this union, one validator + prompt
 * fragment in `src/lib/artifacts/`, one component in the renderer registry.
 * Nothing in DayView, the API route, or the plan schema changes. Unknown kinds
 * (old plans, a newer model, a renderer that failed to load) render nothing —
 * the activity's own text always stands on its own.
 */
export type Artifact = { kind: "guitar-riff"; data: GuitarRiff };

export type ArtifactKind = Artifact["kind"];

export interface Activity {
  text: string;
  resources?: ActivityResource[];
  /** The structured thing this activity is really about, if it has one. */
  artifact?: Artifact;
  /** @deprecated Pre-seam field, still present in stored plans and the demo
   *  fixtures. Never read it directly — `activityArtifact()` folds it into an
   *  Artifact so there is exactly one path through the renderer. */
  riff?: GuitarRiff;
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

/** One of the four 7-day sprints that make up a goal. Each sprint corresponds to
 *  a quarter of the goal — Foundations → Build Momentum → Stretch → Integrate. */
export interface SprintMeta {
  /** 1-4. */
  number: number;
  /** "Sprint 1: Foundations" — short header used in calendar + congrats. */
  title: string;
  /** One-line description of what this quarter of the goal is about. */
  theme: string;
}

export interface Plan {
  cleanedGoal?: string;
  startDate: string;
  /** Total length of the goal in days. Absent = 28 (the classic 4-sprint arc).
   *  Goals with a different cadence (e.g. a 30-day riff challenge) set this and
   *  every duration-bounded calculation reads it instead of the 28 default. */
  totalDays?: number;
  /** Sparse — only days from generated sprints are present. */
  days: Record<number, DayPlan>;
  /** Four entries describing each sprint's theme. Set at plan creation; never mutates. */
  sprints?: SprintMeta[];
  /** Number of sprints currently generated and visible to the user (1-4).
   *  Sprint N covers days (N-1)*7+1 through N*7. Older fixtures without this
   *  field are treated as fully generated (= 4). */
  sprintsGenerated?: number;
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
  title: string;
  message: string;
  intensity: MilestoneIntensity;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
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
