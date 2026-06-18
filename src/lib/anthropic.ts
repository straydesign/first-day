/**
 * AI plan generation (server-only). Calls the Anthropic Messages API to produce
 * a personalized 28-day / 4-sprint plan. Used only when ANTHROPIC_API_KEY is set.
 *
 * Returns a fully-formed Plan, or null on ANY failure (missing/invalid response,
 * bad JSON, missing days) — the route handler then falls back to the deterministic
 * generator, so plan generation never hard-fails.
 *
 * Cost note: every call here spends Anthropic credits on the configured key.
 * Nothing runs unless ANTHROPIC_API_KEY is present in the server environment.
 */
import type { Plan, DayPlan, SprintMeta, GoalFormData } from "@/types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";

interface RawDay {
  day?: number;
  number?: number;
  title?: string;
  activities?: string[];
  tip?: string;
}
interface RawPlan {
  cleanedGoal?: string;
  sprints?: Array<{ number?: number; title?: string; theme?: string }>;
  days?: RawDay[];
}

function buildPrompt(input: GoalFormData): string {
  const lines: string[] = [];
  lines.push(`Goal: ${input.goal}`);
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
  return lines.join("\n");
}

const SYSTEM = `You are a coach that designs focused 28-day learning sprints.
Return ONLY a single JSON object (no markdown, no prose) with this exact shape:
{
  "cleanedGoal": string,                      // a clean, motivating restatement of the goal
  "sprints": [                                // EXACTLY 4 entries
    { "number": 1, "title": "Sprint 1: Foundations", "theme": "one sentence" },
    { "number": 2, "title": "Sprint 2: Build Momentum", "theme": "one sentence" },
    { "number": 3, "title": "Sprint 3: Stretch", "theme": "one sentence" },
    { "number": 4, "title": "Sprint 4: Integrate", "theme": "one sentence" }
  ],
  "days": [                                   // EXACTLY 28 entries, day 1..28
    { "day": 1, "title": "Day 1: short label", "activities": ["concrete task", "..."], "tip": "one encouraging line" }
  ]
}
Rules: 2-3 concrete, doable activities per day sized to the user's daily time budget.
Progress in difficulty across the four sprints. Be specific to the goal.
Do NOT invent book titles, product names, URLs, statistics, or any factual claim you are unsure of.`;

export async function generatePlanWithAI(
  input: GoalFormData & { startDate?: string },
  startDate: string
): Promise<Plan | null> {
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
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: "user", content: buildPrompt(input) }],
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
  return coerceToPlan(raw, startDate, input.goal);
}

function extractJson(text: string): RawPlan | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as RawPlan;
  } catch {
    return null;
  }
}

function coerceToPlan(raw: RawPlan, startDate: string, goal: string): Plan | null {
  if (!Array.isArray(raw.days) || raw.days.length < 7) return null;

  const days: Record<number, DayPlan> = {};
  for (const d of raw.days) {
    const n = d.day ?? d.number;
    if (!n || n < 1 || n > 28) continue;
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
  // Require a reasonably complete plan; otherwise let the caller fall back.
  if (Object.keys(days).length < 21) return null;

  const sprints: SprintMeta[] = Array.isArray(raw.sprints) && raw.sprints.length >= 4
    ? raw.sprints.slice(0, 4).map((s, i) => ({
        number: i + 1,
        title: typeof s.title === "string" && s.title.trim() ? s.title : `Sprint ${i + 1}`,
        theme: typeof s.theme === "string" ? s.theme : "",
      }))
    : [
        { number: 1, title: "Sprint 1: Foundations", theme: "" },
        { number: 2, title: "Sprint 2: Build Momentum", theme: "" },
        { number: 3, title: "Sprint 3: Stretch", theme: "" },
        { number: 4, title: "Sprint 4: Integrate", theme: "" },
      ];

  return {
    cleanedGoal: typeof raw.cleanedGoal === "string" && raw.cleanedGoal.trim() ? raw.cleanedGoal : goal,
    startDate,
    totalDays: 28,
    days,
    sprints,
    sprintsGenerated: 4,
  };
}
