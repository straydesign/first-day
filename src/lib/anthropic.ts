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
import { DIRECT_ACTION_RULES, NO_REPEAT_RULE, findNonActions, findRepeats } from "./plan-rules";
import { bandGuidance, clampLevel, levelFromExperience, skillBand } from "./skill-level";
import type { Activity, DayPlan, SprintMeta, GoalFormData } from "@/types";
import { artifactSpecsFor, coerceArtifact, type ArtifactSpec } from "@/lib/artifacts";

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
  /** Days the user marked too easy / too hard in the sprint they just finished. */
  priorDifficulty?: { easy: number; hard: number };
  /** The level the sprint just finished was written for. */
  priorSkillLevel?: number;
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

/** An activity as the model may return it: a bare string, or an object carrying
 *  an artifact. Both forms are accepted on every goal; the object form only
 *  survives coercion when a spec for its kind was actually offered. */
type RawActivity = string | { text?: unknown; artifact?: unknown };

interface RawDay {
  day?: number;
  number?: number;
  title?: string;
  activities?: RawActivity[];
  tip?: string;
}
interface RawSprintPayload {
  cleanedGoal?: string;
  sprints?: Array<{ number?: number; title?: string; theme?: string }>;
  days?: RawDay[];
}

/**
 * The level this sprint is written for: the request's skillLevel, else one
 * derived from the old three-way experience value (goals saved before the
 * slider), else undefined and the prompt says nothing about level.
 */
export function sprintLevel(input: GoalFormData): number | undefined {
  return (
    clampLevel(input.skillLevel) ??
    levelFromExperience(input.experienceLevel ?? input.contextAnswers?.experienceLevel)
  );
}

/** contextAnswers keys the prompt already states in its own words. */
const STATED_KEYS = new Set(["experienceLevel", "skillLevel"]);

function goalContextLines(input: GoalFormData): string[] {
  const lines: string[] = [`Goal: ${input.goal}`];
  if (input.why) lines.push(`Why it matters: ${input.why}`);
  const level = sprintLevel(input);
  if (level !== undefined) {
    lines.push(`Skill level: ${level}/100 (${skillBand(level).name})`);
    lines.push(`How to build each day at this level: ${bandGuidance(level)}`);
    // Tom 10-05: level-90 plans opened with basic chords and shopping lists.
    lines.push(`Day 1 already works AT level ${level}, never below it. No setup, shopping, list-making or basics the user at this level already knows.`);
  }
  if (input.priorExperience) lines.push(`Prior experience: ${input.priorExperience}`);
  if (input.preferredTactics) lines.push(`Preferred tactics: ${input.preferredTactics}`);
  if (input.timeCommitment) lines.push(`Time per day: ${input.timeCommitment}`);
  if (input.contextAnswers) {
    const stated: Record<string, string | undefined> = {
      why: input.why,
      priorExperience: input.priorExperience,
      preferredTactics: input.preferredTactics,
    };
    for (const [q, a] of Object.entries(input.contextAnswers)) {
      if (!a || STATED_KEYS.has(q) || (stated[q] && stated[q] === a)) continue;
      lines.push(`${q}: ${a}`);
    }
  }
  return lines;
}

/** Does this sprint have real prior feedback to adapt from? */
function hasFeedback(sprintNumber: number, ctx: SprintGenContext): boolean {
  if (sprintNumber <= 1) return false;
  const reflections = (ctx.priorReflections || []).filter((r) => r && r.trim());
  const marked = (ctx.priorDifficulty?.easy ?? 0) + (ctx.priorDifficulty?.hard ?? 0);
  return reflections.length > 0 || !!ctx.priorCompletion || marked > 0;
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
  const level = sprintLevel(input);
  if (level !== undefined) {
    const prior = sprintNumber > 1 ? clampLevel(ctx.priorSkillLevel) : undefined;
    lines.push(
      prior !== undefined
        ? `This week is written for level ${level}. Last week was level ${prior}.`
        : `This week is written for level ${level}.`,
    );
    lines.push(
      `Day ${end} (the last day) is a small test at level ${level}: one thing they do start to finish to show what they can do now (like "Play the song start to finish" or "Run 2 miles without stopping").`,
    );
  }

  if (hasFeedback(sprintNumber, ctx)) {
    lines.push("");
    lines.push("Here is how the PREVIOUS sprint actually went — adapt this sprint to it:");
    const { easy = 0, hard = 0 } = ctx.priorDifficulty ?? {};
    if (ctx.priorCompletion) {
      lines.push(`Days completed: ${ctx.priorCompletion.completed} of ${ctx.priorCompletion.total}.`);
      if (ctx.priorCompletion.completed < ctx.priorCompletion.total) {
        lines.push("They missed some days — ease the load slightly and rebuild momentum before adding difficulty.");
      } else if (hard > easy) {
        // Finishing every day doesn't mean a step up when they said it was too hard.
        lines.push("They completed every day, but found the work hard.");
      } else {
        lines.push("They completed every day — they can handle a step up in challenge.");
      }
    }
    if (easy || hard) {
      lines.push(`They marked ${easy} day(s) "too easy" and ${hard} day(s) "too hard".`);
      if (easy > hard) lines.push("Make this sprint noticeably harder: more reps, longer sessions or a harder version of each task.");
      else if (hard > easy) lines.push("Make this sprint easier: fewer reps, shorter sessions or a simpler version of each task.");
      else lines.push("Keep the difficulty about the same.");
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

function systemPrompt(sprintNumber: number, specs: ReadonlyArray<ArtifactSpec> = []): string {
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
  // Only goals that matched a spec are told artifacts exist. Everyone else gets
  // the original prompt verbatim, unchanged in length or behaviour.
  const artifactClause = specs.length ? `\n\n${specs.map((s) => s.prompt).join("\n\n")}` : "";

  return `You are a coach who designs focused 7-day learning sprints.
Return ONLY a single JSON object (no markdown, no prose) with this exact shape:
{
${sprintsClause}  "days": [                                    // EXACTLY 7 entries, day ${start}..${end}
    { "day": ${start}, "title": "Day ${start}: short label", "activities": ["concrete task", "..."], "tip": "one encouraging line" }
  ]
}
Rules: 2-3 activities per day sized to the user's daily time budget.
${DIRECT_ACTION_RULES}
${NO_REPEAT_RULE}
Day numbers MUST be ${start} through ${end} inclusive. Be specific to the goal.
Do NOT invent book titles, product names, URLs, statistics, or any factual claim you are unsure of.${artifactClause}`;
}

export async function generateSprintWithAI(
  input: GoalFormData,
  sprintNumber: number,
  ctx: SprintGenContext = {},
): Promise<SprintGenResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[plan] ANTHROPIC_API_KEY unset — serving the deterministic template");
    return null;
  }
  const model = process.env.ANTHROPIC_PLAN_MODEL || DEFAULT_MODEL;

  // Which domain artifacts this goal can carry — decided from the goal text
  // before spending a token, so a goal about running never pays for guitar tab.
  const specs = artifactSpecsFor(input.goal || "");
  // Artifacts are JSON-heavy. Without headroom the model truncates mid-object,
  // extractJson fails, and the whole sprint falls back to the template.
  const maxTokens = 4000 + specs.reduce((n, s) => n + s.tokenBudget, 0);

  type Message = { role: "user" | "assistant"; content: string };
  const ask = async (messages: Message[]): Promise<{ text: string; result: SprintGenResult | null } | null> => {
    let res: Response;
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt(sprintNumber, specs), messages }),
      });
    } catch (e) {
      console.error("[plan] anthropic fetch failed", e);
      return null;
    }
    if (!res.ok) {
      console.error(`[plan] anthropic ${res.status}`, (await res.text()).slice(0, 400));
      return null;
    }
    let text: string;
    try {
      const json = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        stop_reason?: string;
      };
      // Truncation is the failure mode that looks identical to a bad response:
      // the JSON simply ends mid-object and every parse below fails. Name it.
      if (json.stop_reason === "max_tokens") {
        console.error(`[plan] response hit max_tokens (${maxTokens}) — raise the artifact budget`);
      }
      text = (json.content || []).filter((b) => b.type === "text").map((b) => b.text || "").join("");
    } catch (e) {
      console.error("[plan] anthropic response was not JSON", e);
      return null;
    }
    const raw = extractJson(text);
    return { text, result: raw ? coerceSprint(raw, sprintNumber, ctx, specs) : null };
  };

  const first: Message = { role: "user", content: buildPrompt(input, sprintNumber, ctx) };
  const attempt = await ask([first]);
  if (!attempt?.result) return null;

  // Activities must be exact actions and must not repeat. One rewrite if any
  // slipped through; if the rewrite fails or isn't better, keep the first.
  const issues = planIssues(attempt.result.days);
  if (issues.count === 0) return attempt.result;
  console.warn(
    `[plan] ${issues.nonActions.length} non-action and ${issues.repeats.length} repeated activities, asking for a rewrite`,
  );
  const parts: string[] = [];
  if (issues.nonActions.length) {
    parts.push(
      `These activities are not exact actions:\n${issues.nonActions.map((b) => `- ${b}`).join("\n")}\nRewrite them as one exact thing to do each (what, how much, when it's done).`,
    );
  }
  if (issues.repeats.length) {
    parts.push(
      `These activities repeat an earlier one word for word:\n${issues.repeats.map((b) => `- ${b}`).join("\n")}\nChange each repeat (count, time, tempo, piece or version) so no two activities match.`,
    );
  }
  const retry = await ask([
    first,
    { role: "assistant", content: attempt.text },
    { role: "user", content: `${parts.join("\n\n")}\nReturn the full JSON object again in the same shape.` },
  ]);
  if (retry?.result && planIssues(retry.result.days).count < issues.count) return retry.result;
  return attempt.result;
}

/** Everything the single rewrite pass looks for. */
export function planIssues(days: Record<number, DayPlan>): { nonActions: string[]; repeats: string[]; count: number } {
  const nonActions = findNonActions(days);
  const repeats = findRepeats(days);
  return { nonActions, repeats, count: nonActions.length + repeats.length };
}

function extractJson(text: string): RawSprintPayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    console.error("[plan] no JSON object in response", text.slice(0, 200));
    return null;
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as RawSprintPayload;
  } catch (e) {
    console.error("[plan] JSON.parse failed", (e as Error).message, "tail:", text.slice(-160));
    return null;
  }
}

/**
 * One model activity → a string or an Activity, or null to drop it.
 *
 * An activity is only ever upgraded to the object form when it carries an
 * artifact that survived validation. A day full of `{ text }` objects with no
 * artifact would be the same content in a heavier shape, so those collapse back
 * to plain strings and the rest of the app sees exactly what it always has.
 */
function coerceActivity(raw: RawActivity, specs: ReadonlyArray<ArtifactSpec>): string | Activity | null {
  if (typeof raw === "string") return raw.trim() || null;
  if (!raw || typeof raw !== "object") return null;

  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  if (!text) return null;
  if (!specs.length || raw.artifact == null) return text;

  const artifact = coerceArtifact(raw.artifact, specs);
  return artifact ? { text, artifact } : text;
}

function coerceSprint(
  raw: RawSprintPayload,
  sprintNumber: number,
  ctx: SprintGenContext,
  specs: ReadonlyArray<ArtifactSpec> = [],
): SprintGenResult | null {
  if (!Array.isArray(raw.days) || raw.days.length < 5) {
    console.error("[plan] payload had no usable days array");
    return null;
  }
  const lo = (sprintNumber - 1) * 7 + 1;
  const hi = sprintNumber * 7;

  const days: Record<number, DayPlan> = {};
  for (const d of raw.days) {
    const n = d.day ?? d.number;
    if (!n || n < lo || n > hi) continue;
    const activities = Array.isArray(d.activities)
      ? d.activities.map((a) => coerceActivity(a, specs)).filter((a): a is string | Activity => a !== null)
      : [];
    if (activities.length === 0) continue;
    days[n] = {
      title: typeof d.title === "string" && d.title.trim() ? d.title : `Day ${n}`,
      activities,
      ...(typeof d.tip === "string" && d.tip.trim() ? { tip: d.tip } : {}),
    };
  }
  // Require a near-complete sprint; otherwise let the caller fall back.
  if (Object.keys(days).length < 6) {
    console.error(`[plan] only ${Object.keys(days).length} of 7 days survived (${lo}-${hi})`);
    return null;
  }

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
