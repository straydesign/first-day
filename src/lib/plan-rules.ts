/**
 * Every activity in a plan must be one exact thing to DO — "Play the C chord
 * 20 times slowly" — never a prompt to think, plan, research or answer a
 * question (Tom, 2026-10-05: "do this exact thing"). The model is told this
 * in the system prompt; this check catches the ones that slip through so the
 * route can ask for a rewrite once.
 */

/** Openers that make an activity a thinking exercise instead of an action. */
const THINKING_OPENERS = [
  "think",
  "reflect",
  "consider",
  "brainstorm",
  "imagine",
  "visualize",
  "visualise",
  "explore",
  "research",
  "learn about",
  "read about",
  "look into",
  "plan",
  "decide",
  "figure out",
  "identify",
  "ask yourself",
  "journal about",
  "write about why",
  "set an intention",
  "set intentions",
  "set a goal",
  "set goals",
  "notice",
  "be mindful",
  "remember",
  "understand",
  "familiarize",
  "familiarise",
  "get familiar",
];

export function isDirectAction(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/^[-•*\d.)\s]+/, "");
  if (!t) return false;
  if (t.endsWith("?")) return false;
  return !THINKING_OPENERS.some((w) => t === w || t.startsWith(`${w} `) || t.startsWith(`${w},`) || t.startsWith(`${w}:`));
}

/** Activity texts in a generated sprint that aren't exact actions. */
export function findNonActions(days: Record<number, { activities: ReadonlyArray<string | { text: string }> }>): string[] {
  const bad: string[] = [];
  for (const day of Object.values(days)) {
    for (const a of day.activities) {
      const text = typeof a === "string" ? a : a.text;
      if (!isDirectAction(text)) bad.push(text);
    }
  }
  return bad;
}

/** Rules appended to the plan system prompt. */
export const DIRECT_ACTION_RULES = `Every activity MUST be one exact physical action the user can do and check off today:
- Start with a concrete verb (Play, Write, Walk, Cook, Record, Practice, Send, Build, Run, Read pages 1-10 of ...).
- Say exactly what, how much and when it's done ("Play the C, G and Am chords, 10 clean switches each").
- NEVER a question. NEVER think, reflect, consider, brainstorm, imagine, visualize, explore, research, plan, decide, identify, set goals or intentions.`;
