import type { Plan, ProgressMap, EngagementState, Achievement } from "@/types";

// --- Helpers ---

/** Returns YYYY-MM-DD for today minus N days (local timezone). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

// --- Goal IDs ---

export const DEMO_GOAL_IDS = {
  guitar: "demo-guitar",
  morning: "demo-morning",
} as const;

// --- Day data type ---

type DayData = {
  title: string;
  activities: { text: string; resources?: { type: "youtube"; query: string }[] }[];
  tip: string;
  weeklyBook?: { title: string; author: string; description: string };
};

// =========================================================
// Detailed day plans (defined BEFORE plans that reference them)
// =========================================================

const GUITAR_DAYS: Record<number, DayData> = {
  1: {
    title: "Day 1: Getting Started",
    activities: [
      { text: "Learn to hold the guitar properly — posture, hand position, and pick grip", resources: [{ type: "youtube", query: "how to hold a guitar for beginners" }] },
      { text: "Practice the E minor chord (Em) — the easiest chord to start with", resources: [{ type: "youtube", query: "E minor chord guitar beginner tutorial" }] },
      { text: "Strum down on open strings for 5 minutes to build comfort" },
    ],
    tip: "Don't worry about sounding perfect. Just get comfortable holding the guitar.",
    weeklyBook: { title: "Guitar Aerobics", author: "Troy Nelson", description: "A comprehensive daily workout for developing speed, accuracy, and tone." },
  },
  2: {
    title: "Day 2: First Chords",
    activities: [
      { text: "Review Em from yesterday, then learn the A minor (Am) chord", resources: [{ type: "youtube", query: "A minor chord guitar beginner" }] },
      { text: "Practice switching between Em and Am — 1 minute per switch direction" },
      { text: "Try a simple down-down-up-up-down-up strum pattern", resources: [{ type: "youtube", query: "basic strumming pattern for beginners guitar" }] },
    ],
    tip: "Slow is smooth, smooth is fast. Don't rush chord changes.",
  },
  3: {
    title: "Day 3: Adding Rhythm",
    activities: [
      { text: "Learn the C major chord — stretch those fingers!", resources: [{ type: "youtube", query: "C major chord guitar tutorial beginner" }] },
      { text: "Practice the Am → C → Em chord progression slowly" },
      { text: "Play along with a metronome at 60 BPM", resources: [{ type: "youtube", query: "60 BPM metronome for guitar practice" }] },
    ],
    tip: "If a chord sounds buzzy, check that your fingers are pressing close to the fret.",
  },
  4: {
    title: "Day 4: Building Strength",
    activities: [
      { text: "Learn the G major chord — the big stretch", resources: [{ type: "youtube", query: "G major chord guitar easy beginner" }] },
      { text: "Practice switching between all 4 chords: Em, Am, C, G" },
      { text: "Do a 5-minute finger strength exercise: press and release each fret" },
    ],
    tip: "Your fingertips will be sore — that's normal! Calluses are forming.",
  },
  5: {
    title: "Day 5: Your First Song",
    activities: [
      { text: "Practice the Am, C, and G chord shapes for 10 minutes", resources: [{ type: "youtube", query: "Am C G chord shapes beginner guitar" }] },
      { text: 'Learn to play "Horse With No Name" — it only uses 2 chords!', resources: [{ type: "youtube", query: "Horse With No Name guitar tutorial beginner" }] },
      { text: "Record yourself playing and listen back for timing" },
    ],
    tip: "Focus on clean chord transitions rather than speed.",
  },
  6: {
    title: "Day 6: Strumming Patterns",
    activities: [
      { text: "Learn 3 different strumming patterns", resources: [{ type: "youtube", query: "3 essential strumming patterns guitar beginner" }] },
      { text: 'Apply each pattern to "Horse With No Name"' },
      { text: "Practice palm muting for a percussive effect" },
    ],
    tip: "Your strumming hand matters just as much as your fretting hand.",
  },
  7: {
    title: "Day 7: Week 1 Review",
    activities: [
      { text: "Play through all 4 chords (Em, Am, C, G) cleanly at 80 BPM" },
      { text: "Play your first song from start to finish without stopping" },
      { text: "Write down what felt easy and what needs more work" },
    ],
    tip: "You've survived week 1! Most people quit before this point.",
    weeklyBook: { title: "The Guitarist's Way", author: "Peter Fischer", description: "A structured approach to mastering guitar fundamentals." },
  },
  8: {
    title: "Day 8: New Chords",
    activities: [
      { text: "Learn the D major chord", resources: [{ type: "youtube", query: "D major chord guitar beginner tutorial" }] },
      { text: "Practice D → G → A progression" },
      { text: "Play along to a simple backing track", resources: [{ type: "youtube", query: "simple guitar backing track G major" }] },
    ],
    tip: "The D chord is tricky — make sure your 1st finger doesn't mute the high E string.",
  },
  9: {
    title: "Day 9: Finger Picking Intro",
    activities: [
      { text: "Learn basic finger picking: thumb on bass, fingers on treble", resources: [{ type: "youtube", query: "fingerpicking for beginners guitar" }] },
      { text: "Practice a simple p-i-m-a pattern on Em" },
      { text: "Alternate between strumming and finger picking" },
    ],
    tip: "Finger picking opens up a whole new world of guitar sound.",
  },
  10: {
    title: "Day 10: Power Chords",
    activities: [
      { text: "Learn what power chords are and how to play them", resources: [{ type: "youtube", query: "power chords guitar beginner easy" }] },
      { text: "Play a 3-chord rock progression with power chords" },
      { text: "Practice moving power chords up and down the neck" },
    ],
    tip: "Power chords are the backbone of rock music — just 2 fingers!",
  },
};

const MORNING_DAYS: Record<number, DayData> = {
  1: {
    title: "Day 1: Wake Up Right",
    activities: [
      { text: "Set your alarm 30 minutes earlier than usual — place it across the room" },
      { text: "Splash cold water on your face immediately after getting up" },
      { text: "Drink a full glass of water before anything else" },
    ],
    tip: "The hardest part is getting out of bed. Everything after that is momentum.",
    weeklyBook: { title: "The Miracle Morning", author: "Hal Elrod", description: "The not-so-obvious secret to transforming your life before 8AM." },
  },
  2: {
    title: "Day 2: Add Movement",
    activities: [
      { text: "Repeat yesterday's wake-up routine (alarm across room, cold water, water)" },
      { text: "Do 10 minutes of stretching or yoga", resources: [{ type: "youtube", query: "10 minute morning yoga for beginners" }] },
      { text: "Write down 3 things you're grateful for today" },
    ],
    tip: "Movement first thing floods your brain with endorphins. You'll feel awake faster.",
  },
  3: {
    title: "Day 3: Fuel Your Body",
    activities: [
      { text: "Wake up, cold water, hydrate (this is now your anchor habit)" },
      { text: "Prepare a simple, healthy breakfast — eggs, oats, or a smoothie", resources: [{ type: "youtube", query: "5 minute healthy breakfast ideas" }] },
      { text: "Eat without your phone. Just eat and be present." },
    ],
    tip: "What you eat first determines your energy for the next 4 hours.",
  },
  4: {
    title: "Day 4: Mindset Block",
    activities: [
      { text: "Anchor habits: wake up, cold water, hydrate, stretch" },
      { text: "Spend 5 minutes journaling: What's your #1 priority today?", resources: [{ type: "youtube", query: "morning journaling prompts for productivity" }] },
      { text: "Read 10 pages of a book (physical, not on a screen)" },
    ],
    tip: "The morning is for input — feed your mind before the world feeds it for you.",
  },
  5: {
    title: "Day 5: No Phone Zone",
    activities: [
      { text: "Do your full morning routine without touching your phone for the first hour" },
      { text: "Replace phone scrolling with 10 minutes of meditation", resources: [{ type: "youtube", query: "10 minute guided morning meditation" }] },
      { text: "After meditation, write your top 3 tasks for the day" },
    ],
    tip: "Every notification is someone else's priority. Protect your first hour.",
  },
  6: {
    title: "Day 6: Cold Shower Challenge",
    activities: [
      { text: "End your morning shower with 30 seconds of cold water" },
      { text: "Do 5 minutes of breathing exercises (box breathing: 4-4-4-4)", resources: [{ type: "youtube", query: "box breathing technique 4 4 4 4" }] },
      { text: "Review your week so far — what's sticking, what needs adjusting?" },
    ],
    tip: "Cold exposure builds mental resilience. If you can handle the cold, you can handle anything.",
  },
  7: {
    title: "Day 7: Full Routine Lock-In",
    activities: [
      { text: "Execute your full routine: wake, hydrate, stretch, journal, read, eat" },
      { text: "Time your full routine — aim to complete it in under 60 minutes" },
      { text: "Write a reflection: How different do mornings feel now vs day 1?" },
    ],
    tip: "You've built the foundation. Week 2 is about making it automatic.",
    weeklyBook: { title: "Atomic Habits", author: "James Clear", description: "Tiny changes, remarkable results. The definitive guide to building good habits." },
  },
  8: {
    title: "Day 8: Optimize Your Space",
    activities: [
      { text: "Lay out tomorrow's clothes tonight — remove morning friction" },
      { text: "Set up a 'morning station': water, journal, book in one spot" },
      { text: "Run your full routine and note any friction points" },
    ],
    tip: "Environment design > willpower. Make the right behavior the easy behavior.",
  },
  9: {
    title: "Day 9: Add Creative Time",
    activities: [
      { text: "After your core routine, add 15 minutes of creative work" },
      { text: "This could be writing, drawing, music, coding — anything creative" },
      { text: "Journal about what you created and how it felt" },
    ],
    tip: "The morning is when your mind is freshest. Use it for creation, not consumption.",
  },
  10: {
    title: "Day 10: Accountability Check",
    activities: [
      { text: "Send a message to a friend about your morning routine progress" },
      { text: "Run your routine without any modifications — pure consistency" },
      { text: "Rate your energy level at noon: 1-10. Compare to pre-routine days." },
    ],
    tip: "Sharing your progress makes you 65% more likely to stick with it.",
  },
};

// =========================================================
// GOAL 1: Learn to play guitar (4 days done, day 5 = today)
// =========================================================

const GUITAR_START = daysAgo(4);

const GUITAR_PLAN: Plan = {
  cleanedGoal: "Learn to play guitar",
  startDate: GUITAR_START,
  days: Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayData = GUITAR_DAYS[day] ?? {
        title: `Day ${day}`,
        activities: [
          { text: `Guitar practice activity ${day}.1` },
          { text: `Guitar practice activity ${day}.2` },
          { text: `Guitar practice activity ${day}.3` },
        ],
        tip: "Consistency beats perfection. 15 focused minutes > 60 distracted ones.",
      };
      return [day, dayData];
    })
  ),
};

const GUITAR_PROGRESS: ProgressMap = {
  1: { completed: { 0: true, 1: true, 2: true }, feedback: "Great first day! Fingers hurt a bit but I got the hang of holding the guitar.", completedAt: daysAgoISO(3) },
  2: { completed: { 0: true, 1: true, 2: true }, feedback: "Getting the hang of it. E minor sounds decent now.", completedAt: daysAgoISO(2) },
  3: { completed: { 0: true, 1: true, 2: false }, feedback: "Tough day but pushed through. Chord transitions are hard.", completedAt: daysAgoISO(1) },
  4: { completed: { 0: true, 1: true, 2: true }, feedback: "Feeling more confident! Can switch between Em and Am now.", completedAt: daysAgoISO(0) },
};

// =========================================================
// GOAL 2: Build a morning routine (1 day done, day 2 = today)
// =========================================================

const MORNING_START = daysAgo(1);

const MORNING_PLAN: Plan = {
  cleanedGoal: "Build a morning routine",
  startDate: MORNING_START,
  days: Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayData = MORNING_DAYS[day] ?? {
        title: `Day ${day}`,
        activities: [
          { text: `Morning routine activity ${day}.1` },
          { text: `Morning routine activity ${day}.2` },
          { text: `Morning routine activity ${day}.3` },
        ],
        tip: "Your morning sets the tone for the entire day.",
      };
      return [day, dayData];
    })
  ),
};

const MORNING_PROGRESS: ProgressMap = {
  1: { completed: { 0: true, 1: true, 2: true }, feedback: "Woke up on time! The cold water splash really helped.", completedAt: daysAgoISO(0) },
};

// =========================================================
// Goals list (what GoalsManagement displays)
// =========================================================

export interface DemoGoalListItem {
  id: string;
  title: string;
  timeCommitment: string;
  startDate: string;
  completedDays: number;
  totalDays: number;
}

export const DEMO_GOALS_LIST: DemoGoalListItem[] = [
  {
    id: DEMO_GOAL_IDS.guitar,
    title: "Learn to play guitar",
    timeCommitment: "30 min/day",
    startDate: GUITAR_START,
    completedDays: 4,
    totalDays: 30,
  },
  {
    id: DEMO_GOAL_IDS.morning,
    title: "Build a morning routine",
    timeCommitment: "60 min/day",
    startDate: MORNING_START,
    completedDays: 1,
    totalDays: 30,
  },
];

// =========================================================
// Goal details (keyed by goal ID — what useGoalManager loads)
// =========================================================

export interface DemoGoalDetail {
  goal: string;
  timeCommitment: string;
  availableDays: string[];
  plan: Plan;
  progress: ProgressMap;
}

export const DEMO_GOAL_DETAILS: Record<string, DemoGoalDetail> = {
  [DEMO_GOAL_IDS.guitar]: {
    goal: "Learn to play guitar",
    timeCommitment: "30 min/day",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    plan: GUITAR_PLAN,
    progress: GUITAR_PROGRESS,
  },
  [DEMO_GOAL_IDS.morning]: {
    goal: "Build a morning routine",
    timeCommitment: "60 min/day",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    plan: MORNING_PLAN,
    progress: MORNING_PROGRESS,
  },
};

// =========================================================
// Engagement state (for the goals dashboard)
// =========================================================

const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: "first-step", name: "First Step", description: "Complete your first day", icon: "🚀", unlocked: true },
  { id: "on-fire", name: "On Fire", description: "3-day streak", icon: "🔥", unlocked: true },
  { id: "week-warrior", name: "Week Warrior", description: "Complete 7 days total", icon: "⭐", unlocked: false },
  { id: "unstoppable", name: "Unstoppable", description: "7-day streak", icon: "💪", unlocked: false },
  { id: "perfect-week", name: "Perfect Week", description: "7 consecutive days", icon: "🏅", unlocked: false },
  { id: "halfway-hero", name: "Halfway Hero", description: "Complete 15 days", icon: "🎯", unlocked: false },
  { id: "deep-thinker", name: "Deep Thinker", description: "Write 10 reflections", icon: "🧠", unlocked: false },
  { id: "goal-crusher", name: "Goal Crusher", description: "Complete all 30 days", icon: "🏆", unlocked: false },
];

export const DEMO_ENGAGEMENT: EngagementState = {
  currentStreak: 4,
  longestStreak: 4,
  isAtRisk: false,
  totalXP: 560,
  level: { name: "Committed", threshold: 500, nextThreshold: 1200 },
  levelProgress: 0.086,
  achievements: DEMO_ACHIEVEMENTS,
  completionRate: 0.17,
  totalDaysCompleted: 5,
};
