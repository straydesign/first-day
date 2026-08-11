/**
 * THE READ — synthesis.
 *
 * Turns raw assessment answers into the artefact shown back to the person.
 *
 * Deliberately deterministic. Every line here can be traced to a specific answer,
 * which means it cannot hallucinate a fact about someone's life — the single
 * worst failure this product could have. An AI pass may later ENRICH the prose,
 * but the claims themselves are computed, not generated.
 *
 * The governing rule from COACH-SPEC §3: the Read must tell the person at least
 * one thing they did not type in. If every line is a rearrangement of their own
 * answers it's a receipt, not an assessment. So inferences exist — and every one
 * is labelled as an inference, carries its basis, and can be dismissed in a tap.
 */

import { DOMAINS, type DomainId } from "@/content/read-instrument";

export type Answers = Record<string, string | number | string[] | undefined>;

export interface DomainScore {
  id: DomainId;
  label: string;
  score: number;
}

export interface Inference {
  id: string;
  /** Stated plainly, in the second person. Always visibly marked as a guess. */
  claim: string;
  /** Which answers produced it. Shown when the person asks "how do you know that?" */
  basis: string;
}

export interface Read {
  domains: DomainScore[];
  /** The two lowest — where the material is. Not "what to fix": the person chooses that. */
  loadBearing: DomainScore[];
  /** Highest-scoring domain. Used to make the read not-all-deficit. */
  strongest: DomainScore;
  failurePattern: { name: string; description: string } | null;
  capacityHours: number;
  /** What a realistic week looks like, in commitments, given hours + energy + days.
   *  Includes any ±1 the person has applied. */
  weeklyCommitmentCeiling: number;
  /** The same number before they touched it — so the UI can say "adjusted". */
  computedCeiling: number;
  coachVoice: "asked" | "pushed" | "plain";
  useStreaks: boolean;
  cadence: "daily" | "weekly" | "missed" | "none";
  proof: "tick" | "artefact" | "words";
  onQuiet: "once" | "keep" | "wait";
  inferences: Inference[];
  /** One sentence: what kind of person this is to coach. */
  oneLine: string;
}

const num = (a: Answers, k: string, fallback = 0): number => {
  const v = a[k];
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (a: Answers, k: string): string => {
  const v = a[k];
  return typeof v === "string" ? v.trim() : "";
};

const FAILURE_PATTERNS: Record<string, { name: string; description: string }> = {
  miss: {
    name: "The all-or-nothing break",
    description:
      "One miss becomes two, and two ends it. The thing that stops you isn't the missed day — it's what the missed day means to you. So nothing here will ever be scored on an unbroken run, and a bad day will never cost you anything you've banked.",
  },
  drift: {
    name: "The slow fade",
    description:
      "Nothing dramatic happens. It just gets a little smaller each week until one day it isn't there. Fades are invisible from the inside, which is exactly what a weekly read-back is for — it makes the shrinking visible while it's still small enough to reverse.",
  },
  swap: {
    name: "The pivot",
    description:
      "The energy is real, it just keeps moving. A new idea arrives and the old one quietly loses its claim. The counter-move isn't discipline, it's a fixed weekly appointment where switching has to be a decision you make out loud rather than a drift you don't notice.",
  },
  overload: {
    name: "The overreach",
    description:
      "You start with more than the week can hold, and the collapse is structural rather than personal. Everything in here caps what you can commit to — and shrinking a commitment is treated as a good decision, not a retreat.",
  },
  life: {
    name: "The disruption",
    description:
      "It works until something outside it — travel, illness, a heavy month at work — takes the space. The plan was never wrong; it just had no smaller version to fall back to. So every week you'll write the smaller version in advance, while you still have the capacity to write it.",
  },
};

/**
 * @param nudge  -1, 0 or +1. The person is allowed to move the computed weekly
 *               ceiling by one in either direction — see COACH-SPEC §3. It's
 *               passed in here rather than applied at the call site so the
 *               one-line summary can't end up quoting a different number than
 *               the block that offers the control.
 */
export function synthesise(a: Answers, nudge = 0): Read {
  const domains: DomainScore[] = DOMAINS.map((d) => ({
    id: d.id,
    label: d.label,
    score: num(a, `map.${d.id}`, 5),
  }));

  const ascending = [...domains].sort((x, y) => x.score - y.score);
  const loadBearing = ascending.slice(0, 2);
  const strongest = ascending[ascending.length - 1];

  const capacityHours = num(a, "constraints.hours", 3);
  const energy = num(a, "constraints.energy", 3);
  const days = Array.isArray(a["constraints.days"]) ? (a["constraints.days"] as string[]).length : 5;

  // Ceiling on weekly commitments. Hours set the base; low energy and few
  // available days each pull it down. Never above 5 — the recorded coaches are
  // unanimous that commitments should shrink, and nothing here should invite
  // someone to load up a week they can't carry.
  const base = capacityHours <= 1 ? 1 : capacityHours <= 3 ? 2 : capacityHours <= 6 ? 3 : capacityHours <= 10 ? 4 : 5;
  // One penalty, not two. Low energy and a short week are usually the same
  // constraint described twice — stacking them produces a ceiling of 1 for
  // people who could honestly carry 2, and an insultingly small plan is its
  // own kind of abandonment.
  const penalty = Math.max(energy <= 2 ? 1 : 0, days <= 3 ? 1 : 0);
  const computedCeiling = Math.max(1, Math.min(5, base - penalty));
  // The nudge moves the number but cannot escape the same 1–5 band the formula
  // lives in. Below 1 isn't a lighter week, it's no week at all; above 5 is the
  // overreach this whole instrument exists to catch, and letting someone opt
  // into it with a button would be the product arguing against itself.
  const weeklyCommitmentCeiling = Math.max(
    1,
    Math.min(5, computedCeiling + Math.max(-1, Math.min(1, nudge))),
  );

  const failurePattern = FAILURE_PATTERNS[str(a, "history.pattern")] ?? null;

  const streakAnswer = str(a, "wiring.streak");
  const useStreaks = streakAnswer === "motivating";

  const inferences: Inference[] = [];

  // Inference 1 — the six-week wall. Only claimed when the duration answer
  // actually supports it; otherwise silence, because a wrong observation is
  // worse than none.
  const lasted = str(a, "history.lasted");
  if (lasted === "sixweeks" || lasted === "weeks") {
    inferences.push({
      id: "sixweek",
      claim:
        "You get further than you give yourself credit for. What ends things for you is a specific event, not a lack of will — the attempt was working right up until something interrupted it.",
      basis: `You said your last serious attempt lasted ${lasted === "sixweeks" ? "about six weeks" : "two or three weeks"}, and that what ended it was: "${str(a, "history.stopped") || "—"}".`,
    });
  }

  // Inference 2 — the transferable one. The thing they HAVE kept is the model.
  const kept = str(a, "history.kept");
  const different = str(a, "history.different");
  if (kept && different) {
    inferences.push({
      id: "transfer",
      claim: `Whatever made "${kept}" stick is the thing worth copying here. You already know how to keep something going — you've just never pointed that machinery at this.`,
      basis: `You named "${kept}" as something you've kept for over a year, and what made it different: "${different}".`,
    });
  }

  // Inference 3 — the mismatch that matters most: streak-brittle people being
  // handed streak mechanics is the single most common way this category
  // quietly loses someone.
  if (streakAnswer === "brittle" || streakAnswer === "anxious") {
    inferences.push({
      id: "nostreak",
      claim:
        "Streak counters are the wrong instrument for you, so you won't be given one. Nothing you build up here can be taken away by a bad day.",
      basis: `You said a streak is ${streakAnswer === "brittle" ? "\"fine until it breaks — then I stop entirely\"" : "stressful"}${str(a, "history.pattern") === "miss" ? ", and that when things fall apart you miss once, then again, then it's gone" : ""}.`,
    });
  }

  // Inference 4 — capacity vs. ambition. Fires when it matters a great deal but
  // there are very few hours, which is the setup for the overreach.
  const matters = num(a, "ask.matters", 5);
  if (matters >= 8 && capacityHours <= 3) {
    inferences.push({
      id: "ambitiongap",
      claim:
        "This matters to you far more than your week currently has room for. That gap is not a motivation problem — it's the exact condition that produces an over-ambitious plan and a collapse in week three.",
      basis: `You rated how much this matters at ${matters}/10, and said you can actually give it ${capacityHours <= 1 ? "under 2" : "2 to 4"} hours a week.`,
    });
  }

  const voice = (str(a, "wiring.tone") || "asked") as Read["coachVoice"];

  return {
    domains,
    loadBearing,
    strongest,
    failurePattern,
    capacityHours,
    weeklyCommitmentCeiling,
    computedCeiling,
    coachVoice: voice,
    useStreaks,
    cadence: (str(a, "contract.how") || "daily") as Read["cadence"],
    proof: (str(a, "contract.know") || "tick") as Read["proof"],
    onQuiet: (str(a, "contract.quiet") || "once") as Read["onQuiet"],
    inferences,
    oneLine: oneLine(a, { failurePattern, weeklyCommitmentCeiling, voice, loadBearing }),
  };
}

function oneLine(
  a: Answers,
  ctx: {
    failurePattern: Read["failurePattern"];
    weeklyCommitmentCeiling: number;
    voice: Read["coachVoice"];
    loadBearing: DomainScore[];
  },
): string {
  const area = ctx.loadBearing[0]?.label.toLowerCase() ?? "this";
  const pattern = ctx.failurePattern ? ctx.failurePattern.name.toLowerCase() : "not yet clear";
  const voice =
    ctx.voice === "pushed" ? "wants to be pushed" : ctx.voice === "plain" ? "wants the facts and nothing else" : "wants to be asked, not told";
  const n = ctx.weeklyCommitmentCeiling;
  return `Someone working on ${area}, who ${voice}, whose history is ${pattern}, and whose honest week holds ${n} commitment${n === 1 ? "" : "s"} — not more.`;
}

/** The mid-survey payoff, fired after the history section. Deliberately partial:
 *  it names the pattern and stops, because the point is to prove something is
 *  listening, not to deliver the whole assessment early. */
export function partialRead(a: Answers): { headline: string; body: string } | null {
  const pattern = FAILURE_PATTERNS[str(a, "history.pattern")];
  const kept = str(a, "history.kept");
  if (!pattern) return null;
  return {
    headline: pattern.name,
    body: kept
      ? `${pattern.description}\n\nAnd you've kept "${kept}" going for over a year — so the machinery works. We're going to point it somewhere new.`
      : pattern.description,
  };
}
