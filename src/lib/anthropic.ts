/**
 * AI plan generation (server-only). Calls the Anthropic Messages API to produce
 * a personalized plan, ONE 7-day sprint at a time. Used only when
 * ANTHROPIC_API_KEY is set.
 *
 * Why sprint-at-a-time: the plan is generated forward. Sprint 1 is built at goal
 * creation; each later sprint is generated when the user finishes the previous
 * one, with that sprint's reflections + completion fed in so the model genuinely
 * ADAPTS the next week to how it actually went. That is the real feedback loop —
 * not a 28-day plan baked once and revealed on a timer.
 *
 * Returns null on ANY failure — the route handler then falls back to the
 * deterministic generator, so generation never hard-fails. `adapted` reports
 * whether prior feedback actually shaped this sprint (true only when AI ran for a
 * later sprint with real feedback); the recap UI uses it to avoid over-claiming.
 *
 * Cost note: every call here spends Anthropic credits on the configured key.
 */
import type { DayPlan, SprintMeta, GoalFormData } from "@/types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

/** The four-quarter arc every goal follows. Themes are fixed; days are generated. */
export const SPRINT_ARC: ReadonlyArray<{ title: string; theme: string }> = [
  { title: "Sprint 1: Foundations", theme: "Learn the fundamentals and set up everything you need." },
  { title: "Sprint 2: Build Momentum", theme: "Practice the core skills daily and build a streak." },
  { title: "Sprint 3: Stretch", theme: "Push past your comfort zone with harder challenges." },
  { title: "Sprint 4: Integrate", theme: "Combine everything and make it a lasting habit." },
];

export interface SprintGenContext {
  /** Existing arc themes (passed for sprints 2+ so the model stays on-arc). */
  sprints?: SprintMeta[];
  /** Reflections the user wrote during the sprint they just finished. */
  priorReflections?: string[];
  /** How many of the prior sprint's 7 days they actually completed. */
  priorCompletion?: { completed: number; total: number };
}

export interface SprintGenResult {
  /** Day-number-keyed plan content for exactly this sprint's 7 days. */
  days: Record<number, DayPlan>;
  /** The 4-sprint arc — only returned when generating sprint 1. */
  sprints?: SprintMeta[];
  /** Clean, motivating restatement of the goal — only returned for sprint 1. */
  cleanedGoal?: string;
  /** True only when prior feedback actually shaped this sprint. */
  adapted: boolean;
}

interface RawDay {
  day?: number;
  number?: number;
  title?: string;
  activities?: string[];
  tip?: string;
}
interface RawSprintPayload {
  cleanedGoal?: string;
  sprints?: Array<{ number?: number; title?: string; theme?: string }>;
  days?: RawDay[];
}

function goalContextLines(input: GoalFormData): string[] {
  const lines: string[] = [`Goal: ${input.goal}`];
  if (input.why) lines.push(`Why it matters: ${input.why}`);
  if (input.experienceLevel) lines.push(`Experience level: ${input.experienceLevel}`);
  if (input.priorExperience) lines.push(`Prior experience: ${input.priorExperience}`);
  if (input.preferredTactics) lines.push(`Preferred tactics: ${input.preferredTactics}`);
  if (input.timeCommitment) lines.push(`Time per day: ${input.timeCommitment}`);
  if (input.contextAnswers) {
    for (const [q, a] of Object.entries(input.contextAnswers)) {
      if (a) lines.push(`${q}: ${a}`);
    }
  }
  return lines;
}

/** Does this sprint have real prior feedback to adapt from? */
function hasFeedback(sprintNumber: number, ctx: SprintGenContext): boolean {
  if (sprintNumber <= 1) return false;
  const reflections = (ctx.priorReflections || []).filter((r) => r && r.trim());
  return reflections.length > 0 || !!ctx.priorCompletion;
}

function buildPrompt(input: GoalFormData, sprintNumber: number, ctx: SprintGenContext): string {
  const start = (sprintNumber - 1) * 7 + 1;
  const end = sprintNumber * 7;
  const lines = goalContextLines(input);
  lines.push("");

  const arc = ctx.sprints && ctx.sprints.length >= sprintNumber ? ctx.sprints : SPRINT_ARC.map((s, i) => ({ number: i + 1, ...s }));
  const thisTheme = arc[sprintNumber - 1]?.theme || "";
  lines.push(`You are designing Sprint ${sprintNumber} of a 4-sprint, 28-day arc.`);
  lines.push(`This sprint's theme: ${thisTheme}`);
  lines.push(`Generate days ${start} through ${end} (7 days).`);

  if (hasFeedback(sprintNumber, ctx)) {
    lines.push("");
    lines.push("Here is how the PREVIOUS sprint actually went — adapt this sprint to it:");
    if (ctx.priorCompletion) {
      lines.push(`Days completed: ${ctx.priorCompletion.completed} of ${ctx.priorCompletion.total}.`);
      if (ctx.priorCompletion.completed < ctx.priorCompletion.total) {
        lines.push("They missed some days — ease the load slightly and rebuild momentum before adding difficulty.");
      } else {
        lines.push("They completed every day — they can handle a step up in challenge.");
      }
    }
    const reflections = (ctx.priorReflections || []).filter((r) => r && r.trim());
    if (reflections.length) {
      lines.push("Their reflections (what they told themselves each day):");
      for (const r of reflections) lines.push(`- "${r.trim()}"`);
      lines.push("Use these to adjust pacing, address what they struggled with, and lean into what energized them.");
    }
  }
  return lines.join("\n");
}

function systemPrompt(sprintNumber: number): string {
  const start = (sprintNumber - 1) * 7 + 1;
  const end = sprintNumber * 7;
  const sprintsClause =
    sprintNumber === 1
      ? `  "cleanedGoal": string,                       // a clean, motivating restatement of the goal
  "sprints": [                                 // EXACTLY 4 entries — the whole arc
    { "number": 1, "title": "Sprint 1: Foundations", "theme": "one sentence" },
    { "number": 2, "title": "Sprint 2: Build Momentum", "theme": "one sentence" },
    { "number": 3, "title": "Sprint 3: Stretch", "theme": "one sentence" },
    { "number": 4, "title": "Sprint 4: Integrate", "theme": "one sentence" }
  ],\n`
      : "";
  return `You are a coach who designs focused 7-day learning sprints.
Return ONLY a single JSON object (no markdown, no prose) with this exact shape:
{
${sprintsClause}  "days": [                                    // EXACTLY 7 entries, day ${start}..${end}
    { "day": ${start}, "title": "Day ${start}: short label", "activities": ["concrete task", "..."], "tip": "one encouraging line" }
  ]
}
Rules: 2-3 concrete, doable activities per day sized to the user's daily time budget.
Day numbers MUST be ${start} through ${end} inclusive. Be specific to the goal.
Do NOT invent book titles, product names, URLs, statistics, or any factual claim you are unsure of.`;
}

export async function generateSprintWithAI(
  input: GoalFormData,
  sprintNumber: number,
  ctx: SprintGenContext = {},
): Promise<SprintGenResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const model = process.env.ANTHROPIC_PLAN_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt(sprintNumber),
        messages: [{ role: "user", content: buildPrompt(input, sprintNumber, ctx) }],
      }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let text: string;
  try {
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    text = (json.content || []).filter((b) => b.type === "text").map((b) => b.text || "").join("");
  } catch {
    return null;
  }

  const raw = extractJson(text);
  if (!raw) return null;
  return coerceSprint(raw, sprintNumber, ctx);
}

function extractJson(text: string): RawSprintPayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as RawSprintPayload;
  } catch {
    return null;
  }
}

function coerceSprint(raw: RawSprintPayload, sprintNumber: number, ctx: SprintGenContext): SprintGenResult | null {
  if (!Array.isArray(raw.days) || raw.days.length < 5) return null;
  const lo = (sprintNumber - 1) * 7 + 1;
  const hi = sprintNumber * 7;

  const days: Record<number, DayPlan> = {};
  for (const d of raw.days) {
    const n = d.day ?? d.number;
    if (!n || n < lo || n > hi) continue;
    const activities = Array.isArray(d.activities)
      ? d.activities.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
      : [];
    if (activities.length === 0) continue;
    days[n] = {
      title: typeof d.title === "string" && d.title.trim() ? d.title : `Day ${n}`,
      activities,
      ...(typeof d.tip === "string" && d.tip.trim() ? { tip: d.tip } : {}),
    };
  }
  // Require a near-complete sprint; otherwise let the caller fall back.
  if (Object.keys(days).length < 6) return null;

  let sprints: SprintMeta[] | undefined;
  let cleanedGoal: string | undefined;
  if (sprintNumber === 1) {
    sprints =
      Array.isArray(raw.sprints) && raw.sprints.length >= 4
        ? raw.sprints.slice(0, 4).map((s, i) => ({
            number: i + 1,
            title: typeof s.title === "string" && s.title.trim() ? s.title : SPRINT_ARC[i].title,
            theme: typeof s.theme === "string" && s.theme.trim() ? s.theme : SPRINT_ARC[i].theme,
          }))
        : SPRINT_ARC.map((s, i) => ({ number: i + 1, ...s }));
    cleanedGoal = typeof raw.cleanedGoal === "string" && raw.cleanedGoal.trim() ? raw.cleanedGoal.trim() : undefined;
  }

  return { days, sprints, cleanedGoal, adapted: hasFeedback(sprintNumber, ctx) };
}
