/**
 * Deterministic 28-day / 4-sprint plan generator.
 *
 * This is the keyless fallback used when no ANTHROPIC_API_KEY is set (and when
 * the AI path fails). It produces a real, coherent plan for ANY goal — no
 * fabricated facts, no invented book titles — so the app is functional out of
 * the box and free to run. When a key is present, src/lib/anthropic.ts produces
 * a richer, personalized plan instead.
 */
import type { Plan, DayPlan, SprintMeta, GoalFormData } from "@/types";
import type { SprintGenResult } from "@/lib/anthropic";

const SPRINTS: ReadonlyArray<{ title: string; theme: string; tip: string }> = [
  {
    title: "Sprint 1: Foundations",
    theme: "Learn the fundamentals and set up everything you need.",
    tip: "Consistency beats intensity — showing up today matters more than doing it perfectly.",
  },
  {
    title: "Sprint 2: Build Momentum",
    theme: "Practice the core skills daily and build a streak.",
    tip: "Momentum compounds. Even a few focused minutes keeps it alive.",
  },
  {
    title: "Sprint 3: Stretch",
    theme: "Push past your comfort zone with harder challenges.",
    tip: "Discomfort is the sign you're growing — lean into the hard reps.",
  },
  {
    title: "Sprint 4: Integrate",
    theme: "Combine everything and make it a lasting habit.",
    tip: "You're building a habit, not finishing a task. Plan how it continues.",
  },
];

/** Short per-day labels, 7 per sprint. */
const DAY_LABELS: ReadonlyArray<ReadonlyArray<string>> = [
  ["Orientation", "Core Concepts", "Set Up", "First Attempt", "Deep Dive", "Fundamentals", "Week 1 Review"],
  ["Warm-Up", "Smooth It Out", "New Technique", "Self-Test", "Mini-Project", "The Hard Part", "Week 2 Review"],
  ["Level Up", "Add a Constraint", "Combine Skills", "Avoid Pitfalls", "Teach It", "Personal Best", "Week 3 Review"],
  ["Real-World Use", "Full Run", "Habit Check", "Make Something", "Look Back", "Keep It Going", "Finish Strong"],
];

/** Primary activity template per (sprint, dayInSprint). Uses {goal} and {time}. */
const ACTIVITY_TEMPLATES: ReadonlyArray<ReadonlyArray<string>> = [
  [
    "Spend {time} on a beginner overview of {goal} and write down 3 things it covers.",
    "Write down 5 key words used in {goal}, each with a one-line meaning.",
    "Put every tool you need for {goal} in one spot, ready to use.",
    "Do your first hands-on attempt at {goal}. Aim to start, not to be perfect.",
    "Work through the first lesson of one beginner {goal} guide.",
    "Pick the single most important fundamental of {goal} and drill it for {time}.",
    "Write two lines: one part of {goal} that clicked, one that didn't.",
  ],
  [
    "Warm up, then practice the core skill of {goal} for {time}.",
    "Repeat yesterday's practice and try to do it a little smoother or faster.",
    "Add one new technique or sub-skill to your {goal} practice.",
    "Practice {goal}, then do it once more without your notes.",
    "Work through a small real example that uses {goal}.",
    "Spend {time} on the part of {goal} you find hardest.",
    "Write your confidence with {goal} as a number from 1 to 10, then practice the weakest part for 5 minutes.",
  ],
  [
    "Take on a challenge in {goal} that's just beyond your current level.",
    "Practice {goal} under a constraint — less time, no notes, or a tougher example.",
    "Combine two things you've learned into one {goal} exercise.",
    "Look up one common {goal} mistake, then do 10 reps the right way.",
    "Explain a piece of {goal} out loud as if teaching a beginner.",
    "Push for a personal best in {goal} today.",
    "Write down the one {goal} skill you'll practice most next week.",
  ],
  [
    "Use {goal} in a real, practical situation today.",
    "Do a longer {goal} session that strings everything together.",
    "Practice {goal} for {time} without stopping.",
    "Create something small and shareable with your {goal} skills.",
    "Do the first exercise from week 1 again and time it.",
    "Put a weekly {goal} session on your calendar.",
    "Write down 3 things you can do in {goal} now that you couldn't on day 1.",
  ],
];

/** Secondary reinforce activity per sprint. */
const REINFORCE: ReadonlyArray<string> = [
  "Write down one thing about {goal} to practice tomorrow.",
  "Do a quick 5-minute recap of yesterday before you start.",
  "Write down the one thing that felt hardest today.",
  "Track today's session so you can see the streak building.",
];

function cleanGoal(raw: string): string {
  const t = raw
    .trim()
    .replace(/^i\s+(want|would like|wanna)\s+to\s+/i, "")
    .replace(/^my\s+goal\s+is\s+to\s+/i, "")
    .replace(/[.!\s]+$/, "");
  if (!t) return "your goal";
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function titleCase(raw: string): string {
  const c = cleanGoal(raw);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function generatePlanDeterministic(
  input: GoalFormData & { startDate?: string },
  startDate: string
): Plan {
  const goalPhrase = cleanGoal(input.goal);
  const time = (input.timeCommitment && input.timeCommitment.trim()) || "a few minutes";

  const fill = (s: string) => s.replace(/\{goal\}/g, goalPhrase).replace(/\{time\}/g, time);

  const days: Record<number, DayPlan> = {};
  for (let s = 0; s < 4; s++) {
    for (let d = 0; d < 7; d++) {
      const dayNumber = s * 7 + d + 1;
      const primary = fill(ACTIVITY_TEMPLATES[s][d]);
      const reinforce = fill(REINFORCE[s]);
      days[dayNumber] = {
        title: `Day ${dayNumber}: ${DAY_LABELS[s][d]}`,
        activities: d === 6 ? [primary] : [primary, reinforce],
        tip: SPRINTS[s].tip,
      };
    }
  }

  const sprints: SprintMeta[] = SPRINTS.map((sp, i) => ({
    number: i + 1,
    title: sp.title,
    theme: sp.theme,
  }));

  return {
    cleanedGoal: titleCase(input.goal),
    startDate,
    totalDays: 28,
    days,
    sprints,
    sprintsGenerated: 4,
  };
}

/**
 * Deterministic single-sprint generator — the keyless fallback for the
 * forward-generation loop. Slices one sprint's 7 days out of the full template
 * arc. The content is fixed per (sprint, day), so it never adapts to feedback:
 * `adapted` is always false here, and the recap must not claim otherwise.
 */
export function generateSprintDeterministic(
  input: GoalFormData,
  sprintNumber: number,
): SprintGenResult {
  const full = generatePlanDeterministic(input, "");
  const lo = (sprintNumber - 1) * 7 + 1;
  const hi = sprintNumber * 7;
  const days: Record<number, DayPlan> = {};
  for (let n = lo; n <= hi; n++) if (full.days[n]) days[n] = full.days[n];
  return {
    days,
    sprints: sprintNumber === 1 ? full.sprints : undefined,
    cleanedGoal: sprintNumber === 1 ? full.cleanedGoal : undefined,
    adapted: false,
  };
}
