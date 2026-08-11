/**
 * Between-sprints recap. The moment the loop closes: a sprint ends, we read the
 * user's reflections back to them, show how the week went, then build (and, with
 * AI, adapt) the next sprint from that. Copy stays honest — it only says the plan
 * was "shaped by" feedback when generation actually used it.
 */
export const sprintRecap = {
  eyebrow: (n: number) => `Sprint ${n} complete`,
  heading: "Look how far you came.",

  stats: {
    daysLabel: "Days you showed up",
    daysValue: (done: number, total: number) => `${done} of ${total}`,
    streakLabel: "Current streak",
    streakValue: (n: number) => `${n} day${n === 1 ? "" : "s"}`,
  },

  reflections: {
    heading: "What you told yourself",
    empty:
      "No reflections this sprint. Even one line a day gives the next sprint something to adapt to — try it this week.",
  },

  next: {
    building: "Building your next sprint…",
    buildingSub: "Reading back this week before we plan the next.",
    readyEyebrow: "Up next",
    adapted: "Shaped by what you logged this week.",
    notAdapted: "Your next 7 days are ready.",
    cta: (n: number) => `Start Sprint ${n}`,
    failed: "We couldn't build your next sprint just now.",
    retry: "Try again",
  },
} as const;
