/**
 * The artifact registry — the seam between "the model wrote a plan" and "the day
 * view renders something a guitarist can actually play".
 *
 * Register a spec here and it is automatically offered to matching goals, its
 * prompt fragment is appended, its token budget is added, and its output is
 * validated before it can reach a component. Nothing else in the pipeline knows
 * the domain exists.
 */
import type { Activity, Artifact } from "@/types";
import type { ArtifactSpec } from "./types";
import { guitarSpec } from "./guitar";

export type { ArtifactSpec } from "./types";

const SPECS: ReadonlyArray<ArtifactSpec> = [guitarSpec];

/** Specs whose domain this goal is actually about. Usually zero or one. */
export function artifactSpecsFor(goal: string): ArtifactSpec[] {
  const text = (goal || "").trim();
  if (!text) return [];
  return SPECS.filter((s) => s.matches(text));
}

/**
 * Validate one `artifact` object off a model-generated activity.
 *
 * Only specs offered for THIS goal are consulted: if the prompt never described
 * guitar tab, a returned "guitar-riff" is a hallucination and gets dropped
 * rather than rendered.
 */
export function coerceArtifact(raw: unknown, allowed: ReadonlyArray<ArtifactSpec>): Artifact | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = (raw as { kind?: unknown }).kind;
  if (typeof kind !== "string") return null;
  const spec = allowed.find((s) => s.kind === kind);
  if (!spec) return null;
  const data = (raw as { data?: unknown }).data;
  return spec.coerce(data ?? raw);
}

/**
 * The ONE way to ask an activity what it should render.
 *
 * Folds the pre-seam `riff` field — still in stored plans and every demo fixture
 * — into the same Artifact shape, so components never branch on plan vintage.
 */
export function activityArtifact(activity: string | Activity): Artifact | null {
  if (typeof activity === "string") return null;
  if (activity.artifact) return activity.artifact;
  if (activity.riff) return { kind: "guitar-riff", data: activity.riff };
  return null;
}
