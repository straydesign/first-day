/**
 * Skill level, 1–100. The user sets a starting level with a slider before the
 * plan is made; each 7-day sprint is written for one level, and that level
 * rises across the four sprints, nudged by the Too easy / Too hard marks.
 *
 * Pure and dependency-free so the route, the client and the eval script all
 * agree on the same numbers.
 */

export const SKILL_MIN = 1;
export const SKILL_MAX = 100;
/** Slider start for a new goal: low in the Beginner band. */
export const DEFAULT_SKILL_LEVEL = 25;

/** Level gained per finished sprint, before any Too easy / Too hard marks. */
export const LEVEL_STEP_PER_SPRINT = 6;
/** Level added for each day marked "too easy". */
export const LEVEL_PER_EASY_DAY = 2;
/** Level removed for each day marked "too hard". */
export const LEVEL_PER_HARD_DAY = 2;

export type SkillBandId = "starting" | "beginner" | "intermediate" | "advanced" | "expert";

export interface SkillBand {
  readonly id: SkillBandId;
  /** Display + prompt name, e.g. "Beginner". */
  readonly name: string;
  readonly min: number;
  readonly max: number;
  /** How a day is built at this band — goes into the model prompt. */
  readonly guidance: string;
}

export const SKILL_BANDS: readonly SkillBand[] = [
  {
    id: "starting",
    name: "Starting out",
    min: 1,
    max: 20,
    guidance:
      "One tiny skill per day. Point them to a guided tutorial by naming exactly what to search for. Keep each day to 10-20 minutes. A task is done when they finish it once.",
  },
  {
    id: "beginner",
    name: "Beginner",
    min: 21,
    max: 40,
    guidance:
      "Short drills with exact counts. Repeat the same basics, adding one new thing about every 2 days.",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    min: 41,
    max: 60,
    guidance:
      "Drills aimed at weak spots, with measured reps or times. Include one real-world use of the skill each week.",
  },
  {
    id: "advanced",
    name: "Advanced",
    min: 61,
    max: 80,
    guidance:
      "Timed sets against a target, harder variations, and recording the result to compare with last week.",
  },
  {
    id: "expert",
    name: "Expert",
    min: 81,
    max: 100,
    guidance:
      "Specialized high-intensity work, a public output (perform, publish, compete or teach), and polish on fine details.",
  },
];

/** Round and clamp anything to a valid level, or undefined if it isn't a number. */
export function clampLevel(v: unknown): number | undefined {
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(SKILL_MAX, Math.max(SKILL_MIN, Math.round(n)));
}

export function skillBand(level: number): SkillBand {
  const l = clampLevel(level) ?? SKILL_MIN;
  return SKILL_BANDS.find((b) => l >= b.min && l <= b.max) ?? SKILL_BANDS[0];
}

export function bandGuidance(level: number): string {
  return skillBand(level).guidance;
}

/** "34 · Beginner" */
export function levelLabel(level: number): string {
  const l = clampLevel(level) ?? SKILL_MIN;
  return `${l} · ${skillBand(l).name}`;
}

/** The level the NEXT sprint is written for. */
export function nextLevel(level: number, marks: { easy?: number; hard?: number } = {}): number {
  const easy = Math.max(0, marks.easy ?? 0);
  const hard = Math.max(0, marks.hard ?? 0);
  const raw = level + LEVEL_STEP_PER_SPRINT + easy * LEVEL_PER_EASY_DAY - hard * LEVEL_PER_HARD_DAY;
  return clampLevel(raw) ?? SKILL_MIN;
}

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

/** Old three-button value, derived from the slider so stored data stays readable. */
export function experienceFromLevel(level: number): ExperienceLevel {
  const l = clampLevel(level) ?? SKILL_MIN;
  if (l <= 40) return "beginner";
  if (l <= 60) return "intermediate";
  return "advanced";
}

/** A starting level for goals saved before the slider existed. */
export function levelFromExperience(exp: unknown): number | undefined {
  if (exp === "beginner") return 15;
  if (exp === "intermediate") return 50;
  if (exp === "advanced") return 70;
  return undefined;
}
