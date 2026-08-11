import type { Artifact, ArtifactKind } from "@/types";

/**
 * Everything the generator needs to know about one artifact domain, in one
 * object. A new domain is a new file exporting one of these plus a component in
 * the renderer registry — no edits to anthropic.ts, the API route, or DayView.
 */
export interface ArtifactSpec {
  kind: ArtifactKind;

  /**
   * Does this goal want this artifact? Runs against the raw goal text before the
   * model is called, so an unrelated goal never pays for the prompt or the
   * output tokens. Keep matchers TIGHT — a false positive costs budget and ships
   * a renderer that does not fit (six-string tab under a bass goal, say).
   */
  matches(goal: string): boolean;

  /** Appended to the system prompt when matched. Must describe its JSON exactly. */
  prompt: string;

  /** Extra `max_tokens` this artifact needs across a 7-day sprint. */
  tokenBudget: number;

  /**
   * Model JSON → a valid Artifact, or null. This is the trust boundary: the
   * model can return anything, and the day view must never receive a shape it
   * cannot draw. Returning null is always safe — the activity keeps its text.
   */
  coerce(raw: unknown): Artifact | null;
}
