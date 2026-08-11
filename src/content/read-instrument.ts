/**
 * THE READ — the intake instrument.
 *
 * Ordering is the whole point: the assessment comes BEFORE the person names what
 * they want. Goal-first onboarding asks someone to name an outcome at the moment
 * they have the least information about themselves, and what you get back is a
 * wish. Recorded MCC sessions are consistent on this — they open on state, not
 * topic, and reach the ask only after the material has surfaced.
 *
 * See COACH-SPEC.md §3 for the evidence behind each section.
 */

export type QuestionKind = "scale10" | "scale5" | "text" | "choice" | "multi";

export interface ReadQuestion {
  id: string;
  section: SectionId;
  kind: QuestionKind;
  /** The question itself. Short. It is the only thing on screen. */
  q: string;
  /** One line under it — context, or what makes a good answer. */
  sub?: string;
  placeholder?: string;
  /** Endpoint labels for scales. */
  low?: string;
  high?: string;
  options?: { v: string; label: string; note?: string }[];
  /** Optional questions can be skipped; everything else gates Next. */
  optional?: boolean;
}

export type SectionId = "map" | "gap" | "history" | "constraints" | "wiring" | "ask" | "contract";

export const SECTIONS: { id: SectionId; name: string; blurb: string }[] = [
  { id: "map", name: "The map", blurb: "Eight areas, one number each. First instinct is the right answer." },
  { id: "gap", name: "The gap", blurb: "Only the two you rated lowest. This is where the material is." },
  { id: "history", name: "The history", blurb: "What you've tried before, and what actually happened to it." },
  { id: "constraints", name: "The constraints", blurb: "The real shape of your week, not the ideal one." },
  { id: "wiring", name: "The wiring", blurb: "How you're built. This configures how I talk to you." },
  { id: "ask", name: "The ask", blurb: "Now — and only now — what you want." },
  { id: "contract", name: "The contract", blurb: "How you want to be held to it." },
];

/** The eight domains, in the order they're asked. */
export const DOMAINS = [
  { id: "health", label: "Health and body", ask: "your health and your body right now" },
  { id: "craft", label: "Work and craft", ask: "the work you do and how good you're getting at it" },
  { id: "money", label: "Money", ask: "where your money is" },
  { id: "people", label: "Relationships", ask: "the people closest to you" },
  { id: "home", label: "Home and environment", ask: "the space you live in" },
  { id: "play", label: "Play", ask: "how much of your life is just for enjoying it" },
  { id: "learning", label: "Learning", ask: "how much you're learning right now" },
  { id: "direction", label: "Direction", ask: "how clear you are on where all this is going" },
] as const;

export type DomainId = (typeof DOMAINS)[number]["id"];

const mapQuestions: ReadQuestion[] = DOMAINS.map((d) => ({
  id: `map.${d.id}`,
  section: "map",
  kind: "scale10",
  q: `How satisfied are you with ${d.ask}?`,
  sub: "One to ten. Don't deliberate — the number you thought of first is the honest one.",
  low: "Not at all",
  high: "Completely",
}));

/* The gap questions are templated: two of them get generated at runtime against
   whichever domains came back lowest. `{domain}` is substituted then. */
export const GAP_TEMPLATES: Omit<ReadQuestion, "id">[] = [
  {
    section: "gap",
    kind: "text",
    q: "Describe what a 10 would look like in {domain}.",
    sub: "Be specific and concrete. Not 'better' — what would actually be happening on an ordinary Tuesday?",
    placeholder: "",
  },
];

const staticQuestions: ReadQuestion[] = [
  /* ── THE GAP (the fixed three; two more get generated per lowest domain) ── */
  {
    id: "gap.known",
    section: "gap",
    kind: "text",
    q: "What's the thing you already know you should do and haven't?",
    sub: "You almost certainly thought of it immediately. Write that one.",
  },
  {
    id: "gap.cost",
    section: "gap",
    kind: "text",
    q: "What has not doing it already cost you?",
    sub: "Not a guilt exercise. The cost is the information.",
    optional: true,
  },
  {
    id: "gap.trade",
    section: "gap",
    kind: "text",
    q: "What are you getting out of not doing it?",
    sub: "There's always something — time, comfort, avoiding a risk of failing at it. Naming it is how it stops running the show.",
    optional: true,
  },

  /* ── THE HISTORY — the section nobody else asks, and the most predictive ── */
  {
    id: "history.tried",
    section: "history",
    kind: "text",
    q: "What have you tried before to change this?",
    sub: "List them. Apps, programs, gym memberships, systems, promises to yourself.",
  },
  {
    id: "history.lasted",
    section: "history",
    kind: "choice",
    q: "How long did the last serious attempt last?",
    options: [
      { v: "days", label: "A few days" },
      { v: "weeks", label: "Two or three weeks" },
      { v: "sixweeks", label: "About six weeks" },
      { v: "months", label: "A few months" },
      { v: "longer", label: "Longer than that" },
    ],
  },
  {
    id: "history.stopped",
    section: "history",
    kind: "text",
    q: "What made it stop?",
    sub: "The actual event, if there was one. A trip, an illness, a busy month, a bad week you never came back from.",
  },
  {
    id: "history.pattern",
    section: "history",
    kind: "choice",
    q: "When something you started falls apart, what usually happens first?",
    options: [
      { v: "miss", label: "I miss once, then again, then it's gone", note: "The all-or-nothing break" },
      { v: "drift", label: "It gets quietly smaller until it isn't there", note: "The slow fade" },
      { v: "swap", label: "I get excited about a different thing", note: "The pivot" },
      { v: "overload", label: "I take on too much at once and it collapses", note: "The overreach" },
      { v: "life", label: "Something outside it — work, family, travel — takes over", note: "The disruption" },
    ],
  },
  {
    id: "history.kept",
    section: "history",
    kind: "text",
    q: "Name something you HAVE kept going for a year or more.",
    sub: "Anything at all. A job, a friendship, a band, feeding a cat, a game you still play.",
  },
  {
    id: "history.different",
    section: "history",
    kind: "text",
    q: "What was different about that one?",
    sub: "This is the most useful answer in the whole assessment. Whatever made that one stick is the thing worth copying.",
  },

  /* ── THE CONSTRAINTS — the real week ── */
  {
    id: "constraints.hours",
    section: "constraints",
    kind: "choice",
    q: "How many hours a week can you actually give this?",
    sub: "The number you'd still hit in a bad week — not a good one.",
    options: [
      { v: "1", label: "Under 2 hours" },
      { v: "3", label: "2 to 4 hours" },
      { v: "6", label: "5 to 7 hours" },
      { v: "10", label: "8 to 12 hours" },
      { v: "15", label: "More than 12" },
    ],
  },
  {
    id: "constraints.when",
    section: "constraints",
    kind: "choice",
    q: "When in the day are you actually any good?",
    options: [
      { v: "early", label: "Early morning", note: "Before anyone needs me" },
      { v: "morning", label: "Mid-morning" },
      { v: "afternoon", label: "Afternoon" },
      { v: "evening", label: "Evening" },
      { v: "late", label: "Late at night" },
    ],
  },
  {
    id: "constraints.days",
    section: "constraints",
    kind: "multi",
    q: "Which days are realistically available?",
    sub: "Uncheck the ones that are already spoken for. An honest four beats an aspirational seven.",
    options: [
      { v: "mon", label: "Monday" }, { v: "tue", label: "Tuesday" }, { v: "wed", label: "Wednesday" },
      { v: "thu", label: "Thursday" }, { v: "fri", label: "Friday" }, { v: "sat", label: "Saturday" },
      { v: "sun", label: "Sunday" },
    ],
  },
  {
    id: "constraints.fixed",
    section: "constraints",
    kind: "text",
    q: "What's fixed in your week that can't move?",
    sub: "Work hours, school runs, a commute, caregiving, a standing commitment.",
    optional: true,
  },
  {
    id: "constraints.energy",
    section: "constraints",
    kind: "scale5",
    q: "By the end of a normal day, how much is left in the tank?",
    low: "Nothing",
    high: "Plenty",
  },
  {
    id: "constraints.environment",
    section: "constraints",
    kind: "text",
    q: "What's around you that helps or gets in the way?",
    sub: "Equipment, a gym nearby, a quiet room, people in the house, no car.",
    optional: true,
  },
  {
    id: "constraints.support",
    section: "constraints",
    kind: "choice",
    q: "Does anyone in your life know you're trying to do this?",
    options: [
      { v: "nobody", label: "Nobody" },
      { v: "one", label: "One person" },
      { v: "some", label: "A few people" },
      { v: "public", label: "It's fairly public" },
    ],
  },

  /* ── THE WIRING — configures the coach, not decoration ── */
  {
    id: "wiring.deadline",
    section: "wiring",
    kind: "choice",
    q: "A hard deadline does what to you?",
    options: [
      { v: "fuel", label: "Focuses me", note: "I do my best work against a clock" },
      { v: "freeze", label: "Freezes me", note: "Pressure makes it harder, not easier" },
      { v: "neutral", label: "Neither much" },
    ],
  },
  {
    id: "wiring.tone",
    section: "wiring",
    kind: "choice",
    q: "When you're off track, what do you want from me?",
    sub: "This sets my voice, permanently and changeably.",
    options: [
      { v: "asked", label: "Ask me a question", note: "Let me work out what happened" },
      { v: "pushed", label: "Push me", note: "Tell me straight and expect an answer" },
      { v: "plain", label: "Just show me the facts", note: "No commentary, no encouragement" },
    ],
  },
  {
    id: "wiring.public",
    section: "wiring",
    kind: "choice",
    q: "Telling people what you're going to do — does that help?",
    options: [
      { v: "helps", label: "Helps", note: "I don't want to be the person who said it and didn't" },
      { v: "backfires", label: "Backfires", note: "Saying it out loud somehow satisfies the urge" },
      { v: "private", label: "I'd rather keep it to myself" },
    ],
  },
  {
    id: "wiring.choice",
    section: "wiring",
    kind: "choice",
    q: "Would you rather be told what to do, or choose from options?",
    options: [
      { v: "told", label: "Tell me", note: "Deciding is the part that exhausts me" },
      { v: "options", label: "Give me two or three" },
      { v: "own", label: "I'll decide myself", note: "Just help me see it clearly" },
    ],
  },
  {
    id: "wiring.streak",
    section: "wiring",
    kind: "choice",
    q: "A streak counter — how does that land?",
    sub: "There's no right answer. Streaks help some people and quietly wreck others.",
    options: [
      { v: "motivating", label: "Motivating", note: "I'll protect a streak" },
      { v: "anxious", label: "Stressful", note: "I dread breaking it more than I enjoy building it" },
      { v: "brittle", label: "Fine until it breaks", note: "Then I stop entirely" },
      { v: "indifferent", label: "Doesn't touch me" },
    ],
  },
  {
    id: "wiring.miss",
    section: "wiring",
    kind: "text",
    q: "What do you tell yourself after you miss a day?",
    sub: "In your own words. I'm going to be careful not to say the same thing back to you.",
    optional: true,
  },
  {
    id: "wiring.win",
    section: "wiring",
    kind: "choice",
    q: "What does a win need to feel like a win?",
    options: [
      { v: "visible", label: "I need to see it", note: "A chart, a number going up" },
      { v: "said", label: "Someone has to notice it out loud" },
      { v: "felt", label: "I just need to feel different" },
      { v: "done", label: "It's done — that's enough" },
    ],
  },

  /* ── THE ASK — reached last, on purpose ── */
  {
    id: "ask.want",
    section: "ask",
    kind: "text",
    q: "So — what do you want?",
    sub: "You've just spent seven minutes surfacing the material. Use it.",
  },
  {
    id: "ask.real",
    section: "ask",
    kind: "text",
    q: "And what's the real challenge in that, for you?",
    sub: "Both of those words matter. Real, and for you. Not the version you'd give someone at a party.",
  },
  {
    id: "ask.else",
    section: "ask",
    kind: "text",
    q: "And what else?",
    sub: "The first answer is rarely the only one. This is the last time I'll ask.",
    optional: true,
  },
  {
    id: "ask.matters",
    section: "ask",
    kind: "scale10",
    q: "How much does this actually matter to you?",
    sub: "Honestly. A 6 is a completely fine answer and changes how I'd plan it.",
    low: "Not much",
    high: "Enormously",
  },

  /* ── THE CONTRACT — makes every later nudge legitimate ── */
  {
    id: "contract.how",
    section: "contract",
    kind: "choice",
    q: "How do you want to be held to this?",
    sub: "You design this, not me. I'll do what you pick and nothing else.",
    options: [
      { v: "daily", label: "Check in with me daily" },
      { v: "weekly", label: "Weekly only", note: "Leave me alone in between" },
      { v: "missed", label: "Only when I miss something" },
      { v: "none", label: "Don't chase me at all", note: "I'll come to you" },
    ],
  },
  {
    id: "contract.know",
    section: "contract",
    kind: "choice",
    q: "How will I know you've done it?",
    sub: "An artefact beats a promise. A photo can't be fudged the way \"yeah, I did it\" can.",
    options: [
      { v: "tick", label: "I'll tick it off" },
      { v: "artefact", label: "I'll send proof", note: "A photo, a screenshot, a number" },
      { v: "words", label: "I'll tell you how it went" },
    ],
  },
  {
    id: "contract.quiet",
    section: "contract",
    kind: "choice",
    q: "What should I do when you go quiet?",
    sub: "Everyone goes quiet eventually. Decide now, while it's hypothetical.",
    options: [
      { v: "once", label: "Reach out once, then wait" },
      { v: "keep", label: "Keep checking in", note: "Even if I don't answer" },
      { v: "wait", label: "Say nothing until I come back" },
    ],
  },
];

/** The full instrument in order. Gap questions for the two lowest domains are
 *  spliced in at runtime by `buildInstrument`. */
export const INSTRUMENT: ReadQuestion[] = [...mapQuestions, ...staticQuestions];

/** Where the mid-survey payoff fires — right after the history section, which is
 *  the first point at which there is genuinely something to say back. */
export const PAYOFF_AFTER = "history.different";

/**
 * Splice the two per-domain gap questions in against the lowest-rated domains.
 * Called once the map section is complete.
 */
export function buildInstrument(answers: Record<string, unknown>): ReadQuestion[] {
  const scored = DOMAINS.map((d) => ({ d, v: Number(answers[`map.${d.id}`] ?? 99) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => a.v - b.v)
    .slice(0, 2);
  if (scored.length < 2) return INSTRUMENT;

  const generated: ReadQuestion[] = scored.map(({ d }) => ({
    ...GAP_TEMPLATES[0],
    id: `gap.ten.${d.id}`,
    q: GAP_TEMPLATES[0].q.replace("{domain}", d.label.toLowerCase()),
  }));

  const firstGapIdx = INSTRUMENT.findIndex((q) => q.section === "gap");
  return [
    ...INSTRUMENT.slice(0, firstGapIdx),
    ...generated,
    ...INSTRUMENT.slice(firstGapIdx),
  ];
}
