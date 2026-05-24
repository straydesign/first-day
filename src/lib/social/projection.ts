import type { Plan, Goal, PublishedPlanJson, MoodTileKind } from "@/types";

/**
 * Privacy gate. Takes a user's private Plan + Goal and returns the ONLY shape
 * that may be written to public_rooms.published_plan_json.
 *
 * Excluded forever: activities text, tips, contextAnswers, why, experience,
 * preferredTactics, timeCommitment, timeSlot, availableDays, weeklyBooks.
 *
 * Day TITLES are included because they're high-level milestones ("Learn the C
 * chord shape"), not journal content. If a title accidentally contains private
 * data the caller can scrub before publish.
 */
export function redactPlanForPublish(plan: Plan, goal: Goal): PublishedPlanJson {
  const days = Object.entries(plan.days)
    .map(([k, day]) => ({
      number: Number(k),
      title: day.title,
      activityCount: day.activities.length,
    }))
    .filter((d) => Number.isFinite(d.number) && d.number > 0)
    .sort((a, b) => a.number - b.number);

  return {
    v: 1,
    cleanedGoal: plan.cleanedGoal ?? goal.title,
    days,
  };
}

const MOOD_HUES: Record<MoodTileKind, string> = {
  warm: "#ff8b5a",
  cool: "#5aa8ff",
  spark: "#ffd23f",
  weight: "#b06ab3",
  quiet: "#7fb3a3",
};

export function moodTileHex(kind: MoodTileKind): string {
  return MOOD_HUES[kind];
}

/**
 * Hash a goal title into one of the mood-hue families so similar goals cluster
 * in goal-sentiment space rather than scattering randomly across the gallery.
 */
export function colorForGoalTitle(title: string): string {
  const t = title.toLowerCase();
  const warm = /fit|run|lift|gym|workout|train|weight|strong|muscle|cardio/;
  const cool = /code|job|career|learn|study|engineer|design|build|write/;
  const spark = /music|art|paint|draw|sing|guitar|piano|create/;
  const weight = /quit|stop|less|reduce|sober|debt/;
  const quiet = /meditat|mind|read|sleep|focus|calm|journal/;
  if (warm.test(t)) return MOOD_HUES.warm;
  if (cool.test(t)) return MOOD_HUES.cool;
  if (spark.test(t)) return MOOD_HUES.spark;
  if (weight.test(t)) return MOOD_HUES.weight;
  if (quiet.test(t)) return MOOD_HUES.quiet;
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  const palette = Object.values(MOOD_HUES);
  return palette[Math.abs(h) % palette.length];
}
