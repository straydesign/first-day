import type { Plan, ProgressMap, EngagementState, Achievement, GoalFormData, SprintMeta, DayPlan, RiffNote } from "@/types";

// --- Helpers ---

/** Returns YYYY-MM-DD for today minus N days, in the LOCAL timezone — matches how
 *  the rest of the app builds start dates (buildDemoGoalDetail, useGoalManager) and
 *  how engagement.ts keys days, so "today" lines up. `toISOString()` would emit a
 *  UTC date that can be a day ahead/behind local in US timezones. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  riffs: "demo-riffs",
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
    Array.from({ length: 28 }, (_, i) => {
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
  sprints: [
    { number: 1, title: "Sprint 1: Foundations", theme: "Hold the guitar, learn 3 chords, get one finger-strength routine that you can repeat anywhere." },
    { number: 2, title: "Sprint 2: Build Momentum", theme: "Chain chords into a strumming pattern. Play your first full song." },
    { number: 3, title: "Sprint 3: Stretch", theme: "Add barre chords, rhythm variation, and play in front of one other person." },
    { number: 4, title: "Sprint 4: Integrate", theme: "Combine technique + repertoire into a 10-minute set you actually like." },
  ],
  sprintsGenerated: 1,
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
    Array.from({ length: 28 }, (_, i) => {
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
  sprints: [
    { number: 1, title: "Sprint 1: Foundations", theme: "Wake up on time, hit one anchor habit (water, sunlight, movement), and finish the morning before checking your phone." },
    { number: 2, title: "Sprint 2: Build Momentum", theme: "Add the second anchor. Lock in a consistent wake time even on weekends." },
    { number: 3, title: "Sprint 3: Stretch", theme: "Layer in deeper work — journaling, mobility, focused planning. Make the morning feel valuable, not just productive." },
    { number: 4, title: "Sprint 4: Integrate", theme: "Trim what isn't serving you. Run the routine through one tough day to prove it's bulletproof." },
  ],
  sprintsGenerated: 1,
};

const MORNING_PROGRESS: ProgressMap = {
  1: { completed: { 0: true, 1: true, 2: true }, feedback: "Woke up on time! The cold water splash really helped.", completedAt: daysAgoISO(0) },
};

// =========================================================
// GOAL 3: Learn a new guitar riff every day (30 days, fresh start)
// A riff-a-day challenge built for filming: each day is one short,
// playable lick (10–20 notes) rendered as tablature, ramping in
// difficulty from open-string warm-ups to expressive lead phrases.
// =========================================================

// Compact riff-note builder. Strings: 1 = high e … 6 = low E (tab order).
const nt = (string: number, fret: number, technique?: RiffNote["technique"]): RiffNote =>
  technique ? { string, fret, technique } : { string, fret };

const RIFF_START = daysAgo(0); // starts today — day 1 is ready to play

// "Record it" line varies slightly so 30 days don't read like a template.
const RIFF_DAYS: Record<number, DayPlan> = {
  // ── WEEK 1: Foundations — picking, palm muting, first chord, first hammer-on ──
  1: {
    title: "Day 1: Open-String Launch",
    activities: [
      {
        text: "Day one spans three strings right away — low E, A, and D. Play it at ♩=60 with strict down-strokes and let the open strings ring. Today's chord: Em — two fingers, 2nd fret of the A and D strings, strum all six. You'll end each loop on it.",
        riff: {
          name: "Open-String Launch",
          difficulty: 1,
          key: "E minor",
          bpm: 60,
          teaches: "down-picking across three strings + first Em chord",
          steps: [
            nt(6,0), nt(5,0), nt(4,0), nt(5,0),
            nt(6,0), nt(5,2), nt(4,2), nt(5,2),
            nt(6,0), nt(5,0), nt(4,0), nt(5,0),
            nt(6,0), { chord: "Em" }, nt(6,0), { chord: "Em" },
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Em drill: place your middle and ring fingers on the 2nd fret of the A and D strings, strum down six times. Focus on the two fretted notes ringing clean — that low hum is E minor, the foundation of a hundred classic riffs." },
      { text: "Film a slow, clean pass — even Day 1 is content. Caption it 'Day 1 of 30' and save it as your before clip." },
    ],
    tip: "Day one is about the picking hand and landing your first chord. Steady and clean beats fast and sloppy.",
  },
  2: {
    title: "Day 2: Low-E Groove",
    activities: [
      {
        text: "A repeating groove on the low E with a chord landing at the end. Build to ♩=64. Keep every down-stroke even — your picking hand is learning to keep time.",
        riff: {
          name: "Low-E Groove",
          difficulty: 1,
          key: "E minor",
          bpm: 64,
          teaches: "down-picking pulse + Em chord landing",
          steps: [
            nt(6,0), nt(6,0), nt(6,3), nt(6,3),
            nt(6,0), nt(6,0), nt(6,5), nt(6,3),
            nt(6,0), nt(6,0), nt(6,3), nt(6,3),
            nt(6,0), nt(5,2), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Loop the riff 4 times without stopping. Count '1-2-3-4' out loud to keep yourself honest about the tempo." },
      { text: "Record one clean loop. Watch it back and check that every note rings — no dead buzzes." },
    ],
    tip: "Switching from single notes into a chord is the real skill today. Slow the chord landing until it's clean.",
  },
  3: {
    title: "Day 3: A-String Walk",
    activities: [
      {
        text: "Step down the A string in a bass-line walk, then cross to the low E and land on Em. One finger per fret — keep your thumb behind the neck.",
        riff: {
          name: "A-String Walk",
          difficulty: 1,
          key: "E minor",
          bpm: 66,
          teaches: "fretting-hand position, finger-per-fret & Em",
          steps: [
            nt(5,7), nt(5,5), nt(5,3), nt(5,2),
            nt(6,0), nt(5,2), nt(5,3), nt(5,5),
            nt(5,7), nt(5,5), nt(5,3), nt(5,2),
            nt(6,0), nt(5,2), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Press each fret just behind the metal strip, not on top of it — that one change kills 90% of string buzz." },
      { text: "Record the walk slow. Smooth and in-time films better than fast and shaky — and it's actually harder to do right." },
    ],
    tip: "One finger per fret now saves a world of pain when riffs speed up.",
  },
  4: {
    title: "Day 4: Palm-Mute Pulse",
    activities: [
      {
        text: "Rest the edge of your picking hand on the strings near the bridge — that's the palm mute. This line pairs the muted chug with an open Em at the end. Power chords are two-string shapes that anchor rock riffs; E5 is the easiest: just the low two strings, 0 and 2.",
        riff: {
          name: "Palm-Mute Pulse",
          difficulty: 2,
          key: "E",
          bpm: 70,
          teaches: "palm muting + E5 power chord",
          steps: [
            nt(6,0), nt(6,0), nt(6,0), nt(6,3),
            nt(6,3), nt(6,5), nt(6,5), nt(6,3),
            nt(6,0), nt(6,0), { chord: "E5" }, nt(6,0),
            nt(6,0), nt(6,3), { chord: "E5" }, nt(6,0),
          ],
          chords: [
            { name: "E5", frets: [0,2,2,-1,-1,-1], hint: "A power chord: just the low two strings, one finger shape. The engine of rock riffs — palm-mute it for maximum chug." },
          ],
        },
      },
      { text: "Palm-mute sweet spot: too far from the bridge and the note dies, too far forward and it rings fully. Find the edge — a slight muffled buzz is the target.", resources: [{ type: "youtube", query: "how to palm mute guitar for beginners" }] },
      { text: "Film it muted, then open — two clips, one lesson. The contrast is your first 'tone' post." },
    ],
    tip: "Palm muting is a hand position, not a press. Let the palm rest gently; don't clamp.",
  },
  5: {
    title: "Day 5: Two-String Shuffle",
    activities: [
      {
        text: "Bounce between the low E and A strings in a shuffle pattern. End on Am — your second open chord. Am: first, second, and third fingers on the B, D, and G strings at frets 1 and 2.",
        riff: {
          name: "Two-String Shuffle",
          difficulty: 2,
          key: "A minor",
          bpm: 68,
          teaches: "two-string crossing + Am chord",
          steps: [
            nt(6,0), nt(5,0), nt(6,3), nt(5,2),
            nt(6,0), nt(5,0), nt(6,3), nt(5,2),
            nt(6,0), nt(5,2), nt(6,3), nt(5,0),
            nt(6,0), nt(5,2), { chord: "Am" }, nt(6,0),
          ],
          chords: [
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "Today you add Am — your second chord. It lives next door to Em on the fretboard: same shape zone, one string over. Practice the Em→Am switch ten times before you play the full riff." },
      { text: "Record a clean loop and post it. Two new chords in five days is real progress." },
    ],
    tip: "Switching strings is where timing slips. Count out loud if you have to.",
  },
  6: {
    title: "Day 6: First Hammer-On",
    activities: [
      {
        text: "Meet the hammer-on (h). Pick the first note, then snap your finger down on the higher fret without picking again — the second note rings from the impact alone. This riff weaves hammer-ons across the D and G strings and ends on Em.",
        riff: {
          name: "First Hammer",
          difficulty: 2,
          key: "E minor",
          bpm: 70,
          teaches: "hammer-ons across two strings + Em landing",
          steps: [
            nt(4,5), nt(4,7,"h"), nt(4,5), nt(3,4),
            nt(3,5), nt(4,5), nt(4,7,"h"), nt(4,5),
            nt(3,4), nt(3,5), { chord: "Em" }, nt(6,0),
            nt(4,5), nt(4,7,"h"), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Hammer hard enough that the second note rings as loud as the picked one. A weak hammer-on is just a finger landing. Commit — the snap comes from the tip of the finger, not the whole hand.", resources: [{ type: "youtube", query: "how to do a hammer on guitar" }] },
      { text: "Record it — hammer-ons are the first thing that makes you look like you can really play. One clean take is all you need." },
    ],
    tip: "A weak hammer-on is just a finger landing. Commit to it.",
  },
  7: {
    title: "Day 7: Week-1 Hook",
    activities: [
      {
        text: "Stitch everything from this week into one hook — open strings, Em, Am, and a hammer-on. This is your first riff that sounds like a song idea. Loop it 4 times for a take.",
        riff: {
          name: "Week-1 Hook",
          difficulty: 2,
          key: "E minor",
          bpm: 72,
          teaches: "phrasing a complete riff with chords + hammer-on",
          steps: [
            nt(6,0), nt(6,3), nt(5,0), nt(5,2),
            nt(4,0), nt(4,2,"h"), nt(4,0), nt(5,2),
            nt(6,0), nt(5,0), { chord: "Em" }, nt(6,0),
            nt(5,0), nt(5,2), { chord: "Am" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "Four loops without stopping — that's the take. The rule: if you mess up, keep going. Stopping is the bigger error." },
      { text: "Film your best loop and post it as your Week 1 highlight. You've earned the flex." },
    ],
    tip: "One week in. Most people who 'always wanted to learn guitar' never make it here.",
    weeklyBook: { title: "Guitar Aerobics", author: "Troy Nelson", description: "A one-riff-a-day workout that pairs perfectly with this challenge." },
  },

  // ── WEEK 2: Pentatonic + Pull-offs + Em/Am/E5/A5 Chords ──
  8: {
    title: "Day 8: Pentatonic Climb",
    activities: [
      {
        text: "Welcome to the minor pentatonic — the scale behind most riffs ever written. This climb starts at the 5th fret on the low E and works up all six strings. Hit E5 at the peak, then descend back. Memorize this shape.",
        riff: {
          name: "Pentatonic Climb",
          difficulty: 3,
          key: "A minor",
          bpm: 80,
          teaches: "minor pentatonic box-1 shape across six strings",
          steps: [
            nt(6,5), nt(6,8), nt(5,5), nt(5,7),
            nt(4,5), nt(4,7), { chord: "A5" }, nt(4,7),
            nt(4,5), nt(5,7), nt(5,5), nt(6,8),
            nt(6,5), nt(6,8), nt(5,5), nt(5,7),
          ],
          chords: [
            { name: "A5", frets: [-1,0,2,2,-1,-1], hint: "Power chord on the A and D strings. No pinky needed — just index and ring. Rock and punk staple." },
          ],
        },
      },
      { text: "Learn this box cold — up and down without looking. You'll use it every week from here on.", resources: [{ type: "youtube", query: "minor pentatonic scale box 1 guitar" }] },
      { text: "Film the climb slow and accurate. This shape is what your solos will live in." },
    ],
    tip: "Learn the shape with your eyes closed and you'll never run out of riffs.",
  },
  9: {
    title: "Day 9: Pull-Off Tumble",
    activities: [
      {
        text: "The pull-off (p) is a hammer-on in reverse — snap your fretting finger downward off the string and the lower note rings on its own. This riff tumbles down the pentatonic box using pull-offs on each string, landing on Am.",
        riff: {
          name: "Pull-Off Tumble",
          difficulty: 3,
          key: "A minor",
          bpm: 80,
          teaches: "pull-offs descending the pentatonic box",
          steps: [
            nt(4,7), nt(4,5,"p"), nt(5,7), nt(5,5,"p"),
            nt(6,8), nt(6,5,"p"), nt(4,7), nt(4,5,"p"),
            nt(5,7), nt(5,5,"p"), nt(6,8), nt(6,5),
            nt(6,5), nt(5,5), { chord: "Am" }, nt(6,5),
          ],
          chords: [
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "Don't just lift the finger — flick it slightly downward so the lower note sounds clearly. The flick is the technique." },
      { text: "Record the tumble. The goal is two even notes from one pick — if both notes are equally loud, you nailed it." },
    ],
    tip: "Hammer-ons + pull-offs = legato, the smooth sound that hides between picked notes.",
  },
  10: {
    title: "Day 10: Box Roundtrip",
    activities: [
      {
        text: "Run the open-position E-minor pentatonic all the way up and all the way back down. Land on Em at the bottom. One clean loop — going down is always harder than going up.",
        riff: {
          name: "Box Roundtrip",
          difficulty: 3,
          key: "E minor",
          bpm: 84,
          teaches: "ascending & descending the box fluently + Em landing",
          steps: [
            nt(6,0), nt(6,3), nt(5,0), nt(5,2),
            nt(4,0), nt(4,2), nt(3,0), nt(3,2),
            nt(3,0), nt(4,2), nt(4,0), nt(5,2),
            nt(5,0), nt(6,3), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Slow the descent until every note is even. Up-and-back fluency is what turns a scale into something you can improvise with." },
      { text: "Film a full roundtrip. Ten days, ten riffs — show the progress." },
    ],
    tip: "Up-and-back fluency is what turns a scale into something you can improvise with.",
  },
  11: {
    title: "Day 11: Hammer-Pull Combo",
    activities: [
      {
        text: "Chain a hammer-on straight into a pull-off on each string — one pick, three notes. Land on E5 at the end. This is legato: smooth, vocal, and efficient.",
        riff: {
          name: "Hammer-Pull Combo",
          difficulty: 3,
          key: "A minor",
          bpm: 80,
          teaches: "hammer-on into pull-off (legato trills)",
          steps: [
            nt(6,5), nt(6,8,"h"), nt(6,5,"p"), nt(5,5),
            nt(5,7,"h"), nt(5,5,"p"), nt(4,5), nt(4,7,"h"),
            nt(4,5,"p"), nt(5,7), nt(5,5), nt(6,8),
            nt(6,5), nt(5,5), { chord: "E5" }, nt(6,5),
          ],
          chords: [
            { name: "E5", frets: [0,2,2,-1,-1,-1], hint: "A power chord: just the low two strings, one finger shape. The engine of rock riffs — palm-mute it for maximum chug." },
          ],
        },
      },
      { text: "Keep the fretting hand relaxed. Tension is the enemy of legato — the more you squeeze, the worse it sounds." },
      { text: "Record it — this is the sound of 'fast' without actually picking fast. That's the legato trick." },
    ],
    tip: "Pick once, let the fretting hand do the rest. That's the legato trick.",
  },
  12: {
    title: "Day 12: Treble Lick",
    activities: [
      {
        text: "Move up to the G and B strings for a brighter lick that cuts through a mix. These strings record louder on a phone mic. Land on Am. Use your pinky for the 8th-fret notes — it'll feel weak now but strong in a week.",
        riff: {
          name: "Treble Lick",
          difficulty: 3,
          key: "A minor",
          bpm: 88,
          teaches: "treble-string licks + pinky training",
          steps: [
            nt(3,5), nt(3,7), nt(2,5), nt(2,8),
            nt(2,5), nt(3,7), nt(3,5), nt(3,7),
            nt(2,5), nt(2,8), nt(2,5), nt(3,5),
            nt(3,7), nt(3,5), { chord: "Am" }, nt(3,5),
          ],
          chords: [
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "Train the pinky now. Most beginners avoid it and pay for it later — every fast run you'll ever play lives on that pinky." },
      { text: "Film it. Higher strings record brighter — this is a great phone-camera clip." },
    ],
    tip: "Train the pinky now. Most beginners avoid it and pay for it later.",
  },
  13: {
    title: "Day 13: Bend Intro",
    activities: [
      {
        text: "The bend (b) — push the string sideways (toward the ceiling) to raise its pitch. Use two fingers behind the bending finger for support. This riff bends on the G string and ends on Em.",
        riff: {
          name: "Bend Intro",
          difficulty: 3,
          key: "A minor",
          bpm: 76,
          teaches: "bending in tune on the G string",
          steps: [
            nt(3,7,"b"), nt(3,5), nt(4,7), nt(4,5),
            nt(3,7,"b"), nt(3,5), nt(4,7), nt(4,5),
            nt(3,7,"b"), nt(3,5), nt(3,7,"b"), nt(3,5),
            nt(4,7), nt(5,5), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Bend up to match the pitch of the 9th fret. Aim for that note — check it against a tuner if you can. Bend with your wrist and arm, not just the finger.", resources: [{ type: "youtube", query: "how to bend guitar strings in tune" }] },
      { text: "Record a few bends. A bend that lands in tune is the most expressive note you'll play this week." },
    ],
    tip: "Bend with your wrist and arm, not just the finger. That's where the control is.",
  },
  14: {
    title: "Day 14: Week-2 Hook",
    activities: [
      {
        text: "Your Week 2 showcase — a full pentatonic lick with a bend and a vibrato (~) at the end. Vibrato means rocking the string back and forth in tiny fast pulses once you hit the note. This riff uses Em and Am to frame the lead line.",
        riff: {
          name: "Week-2 Hook",
          difficulty: 3,
          key: "A minor",
          bpm: 84,
          teaches: "combining the box, bend, vibrato & chords",
          steps: [
            { chord: "Em" }, nt(6,5), nt(6,8), nt(5,5),
            nt(5,7), nt(5,7,"b"), nt(5,5), nt(6,8),
            nt(6,5), nt(3,7,"b"), nt(3,5), nt(2,5),
            nt(2,8), nt(2,8,"~"), { chord: "Am" }, nt(6,5),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "Hold that last vibrato note and shake it gently — bend it up a tiny bit, then back, repeatedly. Let it sing. Vibrato is your signature; no two players' vibrato sounds exactly the same." },
      { text: "Film your Week 2 hook. Two weeks of riffs — line it up next to Day 1 for the glow-up." },
    ],
    tip: "Vibrato is your signature. No two players' vibrato sounds exactly the same.",
    weeklyBook: { title: "Hal Leonard Guitar Method", author: "Will Schmid", description: "Solid reference for the scale shapes and techniques you're now using." },
  },

  // ── WEEK 3: Expression — slides, full-step bends, vibrato, open D & G chords ──
  15: {
    title: "Day 15: Slide Into It",
    activities: [
      {
        text: "The slide (/) — pick a note and slide your finger up the string to the next fret without lifting. The pitch rises smoothly, like a vocal glide. This riff introduces D — three strings, three fingers, a bright major chord.",
        riff: {
          name: "Slide Into It",
          difficulty: 3,
          key: "D",
          bpm: 86,
          teaches: "slides + D major chord",
          steps: [
            nt(5,5), nt(5,7,"/"), nt(4,5), nt(4,7,"/"),
            nt(5,7), nt(5,5), nt(4,7), nt(4,5),
            nt(5,5), nt(5,7,"/"), nt(4,5), nt(4,7,"/"),
            nt(5,7), nt(4,5), { chord: "D" }, nt(4,5),
          ],
          chords: [
            { name: "D", frets: [-1,-1,0,2,3,2], hint: "Three fingers on the top three strings in a small triangle. Strum only four strings — start from the D string." },
          ],
        },
      },
      { text: "Today you add D major — open, bright, and essential. Your first finger on the 2nd fret of the G string, second finger on the 2nd fret of the high e, ring finger on the 3rd fret of the B string. Strum from the D string down." },
      { text: "Record it. Slides are pure feel — they always read well on camera. Keep light pressure through the slide so the note doesn't cut out." },
    ],
    tip: "Slides connect notes the way a singer connects words. Use them to phrase.",
  },
  16: {
    title: "Day 16: Full-Step Bend",
    activities: [
      {
        text: "Bigger bends now — full-step bends on the B string, the classic crying lead sound. Add vibrato at the top of the bend — bend up, then shake. That's the money move. Land on G at the end.",
        riff: {
          name: "Full-Step Bend",
          difficulty: 4,
          key: "G",
          bpm: 80,
          teaches: "confident full-step bends + vibrato on the B string",
          steps: [
            nt(2,8,"b"), nt(2,5), nt(3,7), nt(3,5),
            nt(2,8,"b"), nt(2,5), nt(3,7), nt(3,5),
            nt(2,8,"b"), nt(2,8,"~"), nt(2,5), nt(3,5),
            nt(4,5), nt(5,5), { chord: "G" }, nt(6,3),
          ],
          chords: [
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
          ],
        },
      },
      { text: "Today adds G major — one of the most common open chords. It uses three spread-out fingers but once it's in your muscle memory it's fast. Practice it ten times before the full riff." },
      { text: "Film it. A bend-and-vibrato is the single most 'guitarist' thing you can post." },
    ],
    tip: "If the bend sounds flat, it is. Push further than feels necessary.",
  },
  17: {
    title: "Day 17: Vibrato Hold",
    activities: [
      {
        text: "A slow, expressive line built around sustained notes you shake with vibrato. Space is part of the riff — let each held note breathe before you move on. Land on Em.",
        riff: {
          name: "Vibrato Hold",
          difficulty: 3,
          key: "E minor",
          bpm: 72,
          teaches: "vibrato & note sustain",
          steps: [
            nt(3,7), nt(3,7,"~"), nt(3,5), nt(4,7),
            nt(4,7,"~"), nt(4,5), nt(3,7), nt(3,7,"~"),
            nt(3,5), nt(2,8), nt(2,8,"~"), nt(2,5),
            nt(3,7), nt(4,5), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Let each held note breathe before you move on. The notes you don't play matter as much as the ones you do — that space is phrasing." },
      { text: "Record it slow and emotional. Not every clip has to be fast to be good." },
    ],
    tip: "The notes you don't play matter as much as the ones you do.",
  },
  18: {
    title: "Day 18: Blues Curl",
    activities: [
      {
        text: "A gritty blues lick with a chromatic passing note and a bend with vibrato. The fret-6 note is a quick passing tone — don't sit on it, slide through it. Land on Am.",
        riff: {
          name: "Blues Curl",
          difficulty: 4,
          key: "A blues",
          bpm: 84,
          teaches: "blues phrasing, passing tones & A5 power chord",
          steps: [
            nt(5,7), nt(5,5), nt(4,7), nt(4,5),
            nt(4,6), nt(4,5), nt(3,7,"b"), nt(3,5),
            nt(2,5), nt(2,8), nt(2,8,"~"), nt(2,5),
            nt(3,7), nt(4,5), { chord: "Am" }, nt(5,5),
          ],
          chords: [
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "That fret-6 note is a chromatic passing tone — a half-step between two scale notes. It creates tension that resolves to the bend. Don't slow down on it; slide through it." },
      { text: "Film it. Blues licks are forgiving and always sound intentional. This one already has a story." },
    ],
    tip: "The blues is about feel over precision. Let it be a little dirty.",
  },
  19: {
    title: "Day 19: Em → D → G Riff",
    activities: [
      {
        text: "Your first three-chord riff. Em, D, and G are the backbone of hundreds of songs. This riff stitches a lead line between chord hits — real song structure, not just a scale run.",
        riff: {
          name: "Em–D–G Hook",
          difficulty: 3,
          key: "E minor",
          bpm: 80,
          teaches: "three-chord progression Em–D–G + lead transitions",
          steps: [
            nt(6,0), nt(5,2), { chord: "Em" }, nt(6,0),
            nt(5,0), nt(4,2), { chord: "D" }, nt(4,0),
            nt(4,0), nt(5,2), { chord: "G" }, nt(6,3),
            nt(6,0), nt(5,2), { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
            { name: "D", frets: [-1,-1,0,2,3,2], hint: "Three fingers on the top three strings in a small triangle. Strum only four strings — start from the D string." },
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
          ],
        },
      },
      { text: "Em → D → G is one of the most used progressions in popular music. Learn those three chord transitions cold — you'll be able to play along with a huge chunk of songs you already know." },
      { text: "Film the full progression. A chord-riff hybrid is the most 'song' you've sounded yet." },
    ],
    tip: "Three chords. Hundreds of songs. That's not a coincidence.",
  },
  20: {
    title: "Day 20: Position Shift",
    activities: [
      {
        text: "Move between two pentatonic positions using a slide as the bridge — your first trip up the neck. Let the slide carry your hand; don't jump and hope. End on A5.",
        riff: {
          name: "Position Shift",
          difficulty: 4,
          key: "A minor",
          bpm: 88,
          teaches: "shifting position up the neck via slide",
          steps: [
            nt(6,5), nt(6,8), nt(5,5), nt(5,7),
            nt(4,5), nt(4,7,"/"), nt(4,9), nt(4,7),
            nt(3,5), nt(3,7,"/"), nt(3,9), nt(2,8),
            nt(2,10), nt(2,8), { chord: "A5" }, nt(5,5),
          ],
          chords: [
            { name: "A5", frets: [-1,0,2,2,-1,-1], hint: "Power chord on the A and D strings. No pinky needed — just index and ring. Rock and punk staple." },
          ],
        },
      },
      { text: "Slides are how pros change position without a gap. The slide takes you to the new position — treat it like a map, not a mistake." },
      { text: "Film it. Moving up the neck on camera looks (and feels) like leveling up." },
    ],
    tip: "Slides are how pros change position without a gap. Use the slide as your map.",
  },
  21: {
    title: "Day 21: Week-3 Hook",
    activities: [
      {
        text: "Everything from this week — slide, bend, vibrato, and three chords — in one expressive lead line. This is your Week 3 showcase. Play it like you mean it: phrasing beats perfection at this stage.",
        riff: {
          name: "Week-3 Hook",
          difficulty: 4,
          key: "A minor",
          bpm: 90,
          teaches: "combining slides, bends, vibrato & chords in one phrase",
          steps: [
            { chord: "Em" }, nt(6,5), nt(6,8), nt(5,5),
            nt(5,7), nt(5,9,"/"), nt(4,7), nt(4,9),
            nt(3,7,"b"), nt(3,9), nt(3,9,"~"), nt(3,7),
            nt(2,8), nt(2,10,"b"), { chord: "Am" }, nt(6,5),
          ],
          chords: [
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
          ],
        },
      },
      { text: "You're now playing actual lead guitar. Sit with that for a second. The techniques you've built — bends, vibratos, slides — are the vocabulary of every guitarist you admire." },
      { text: "Film your Week 3 hook. Three weeks of riffs is a real highlight reel now." },
    ],
    tip: "You're now playing actual lead guitar. Sit with that for a second.",
    weeklyBook: { title: "Zen Guitar", author: "Philip Toshio Sudo", description: "A short read on practice and feel for when the technique starts clicking." },
  },

  // ── WEEK 4: Speed & Rhythm — alternate picking, legato, gallop, C chord, Cadd9 ──
  22: {
    title: "Day 22: Sixteenth Run",
    activities: [
      {
        text: "Speed week begins. A full pentatonic box run — up and down — at ♩=100. Start at half-speed with a metronome. Alternate pick everything: down-up-down-up. Speed comes from the picking hand, not the fretting hand.",
        riff: {
          name: "Sixteenth Run",
          difficulty: 4,
          key: "A minor",
          bpm: 100,
          teaches: "speed & strict alternate picking",
          steps: [
            nt(6,5), nt(6,8), nt(5,5), nt(5,7),
            nt(4,5), nt(4,7), nt(3,5), nt(3,7),
            nt(2,5), nt(2,8), nt(2,5), nt(3,7),
            nt(3,5), nt(4,7), nt(4,5), nt(5,5),
          ],
          chords: [],
        },
      },
      { text: "Alternate pick everything — down, up, down, up. Speed comes from the picking hand. Set a metronome at 70 BPM and only bump it up 5 BPM once you can play it perfectly three times in a row.", resources: [{ type: "youtube", query: "alternate picking exercises guitar" }] },
      { text: "Film it at whatever tempo is clean. A clean slow run beats a messy fast one — both on camera and in reality." },
    ],
    tip: "Speed is a byproduct of accuracy. Get it clean slow, then nudge the metronome up.",
  },
  23: {
    title: "Day 23: Legato Flow",
    activities: [
      {
        text: "A pick-once-per-string legato run across all six strings using hammer-ons and pull-offs. One pick per string, then the fretting hand does everything. Land on C — your newest chord: three strings, root on the A string.",
        riff: {
          name: "Legato Flow",
          difficulty: 5,
          key: "E minor",
          bpm: 96,
          teaches: "six-string legato + C major chord",
          steps: [
            nt(6,0), nt(6,3,"h"), nt(6,0,"p"), nt(5,0),
            nt(5,2,"h"), nt(5,0,"p"), nt(4,0), nt(4,2,"h"),
            nt(4,0,"p"), nt(3,0), nt(3,2,"h"), nt(3,0,"p"),
            nt(2,0), nt(2,3,"h"), { chord: "C" }, nt(5,3),
          ],
          chords: [
            { name: "C", frets: [-1,3,2,0,1,0], hint: "Root on the 3rd fret of the A string. Four fingers, skip the low E. Open strings on G and high e ring out bright and clear." },
          ],
        },
      },
      { text: "Today adds C major — the fourth essential open chord. Ring finger on 3rd fret A string, middle finger on 2nd fret D string, first finger on 1st fret B string. Open G and high e ring free. Practice the landing ten times before the riff." },
      { text: "Record the flow. Legato runs sound effortless — that's the whole appeal." },
    ],
    tip: "If your hand cramps, you're squeezing too hard. Legato is about lightness.",
  },
  24: {
    title: "Day 24: Gallop Riff",
    activities: [
      {
        text: "A palm-muted gallop on the low E — the driving rhythm behind a thousand rock and metal songs. The 'x' notes are dead chucks: touch the string lightly with your fretting hand and pick it for a percussive click. The gallop is down-down-up.",
        riff: {
          name: "Gallop Riff",
          difficulty: 4,
          key: "E",
          bpm: 110,
          teaches: "gallop rhythm, palm muting & dead-note chucks",
          steps: [
            nt(6,0), nt(6,0), nt(6,0,"x"), nt(6,3),
            nt(6,0), nt(6,0), nt(6,0,"x"), nt(6,5),
            nt(6,0), nt(6,0), nt(6,0,"x"), nt(6,3),
            nt(6,5), nt(6,3), { chord: "E5" }, nt(6,0),
          ],
          chords: [
            { name: "E5", frets: [0,2,2,-1,-1,-1], hint: "A power chord: just the low two strings, one finger shape. The engine of rock riffs — palm-mute it for maximum chug." },
          ],
        },
      },
      { text: "The gallop is down-down-up. Keep the palm mute tight so it stays percussive. Lock it to a metronome — the groove only works if the rhythm is dead-on." },
      { text: "Film it loud and chuggy. Gallops are made for short, punchy clips." },
    ],
    tip: "Lock the gallop to a metronome. The groove only works if the rhythm is dead-on.",
  },
  25: {
    title: "Day 25: Pentatonic Sequence",
    activities: [
      {
        text: "Sequence the box in groups of four — a pattern that sounds like a composed solo, not just a scale. Hear how the same four-note shape repeats as it climbs. Land on G.",
        riff: {
          name: "Pentatonic Sequence",
          difficulty: 5,
          key: "A minor",
          bpm: 104,
          teaches: "four-note sequencing across the pentatonic box",
          steps: [
            nt(6,5), nt(6,8), nt(5,5), nt(5,7),
            nt(6,8), nt(5,5), nt(5,7), nt(4,5),
            nt(5,5), nt(5,7), nt(4,5), nt(4,7),
            nt(5,7), nt(4,5), { chord: "G" }, nt(6,3),
          ],
          chords: [
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
          ],
        },
      },
      { text: "Hear the pattern repeat as it climbs — that's the sequence doing the work. Sequencing is how players make one scale sound like a hundred different licks." },
      { text: "Record it. Sequences turn a plain scale into something that sounds composed." },
    ],
    tip: "Sequencing is how players make one scale sound like a hundred licks.",
  },
  26: {
    title: "Day 26: Cadd9 Color",
    activities: [
      {
        text: "Cadd9 — C with two extra open strings ringing. It's lush and immediately sounds like a 90s rock or indie song. This riff weaves it with a slide lead into a flowing line. Stay relaxed as the tempo climbs.",
        riff: {
          name: "Cadd9 Color",
          difficulty: 5,
          key: "G",
          bpm: 100,
          teaches: "Cadd9 chord + slide lead at speed",
          steps: [
            { chord: "Cadd9" }, nt(3,7), nt(3,9,"/"), nt(2,8),
            nt(2,10,"b"), nt(2,8), nt(3,9), nt(3,7),
            nt(4,7), nt(4,9,"/"), nt(4,7), nt(3,7),
            nt(3,9,"~"), nt(2,8), { chord: "Cadd9" }, nt(3,7),
          ],
          chords: [
            { name: "Cadd9", frets: [-1,3,2,0,3,3], hint: "C major with your pinky and ring finger on the 3rd fret of the B and high e strings. The open G and e strings ring and give it that wide, ringing quality." },
          ],
        },
      },
      { text: "Today's chord is Cadd9 — C major with the 9th degree added. Skip the low E, put your ring finger on 3rd fret A, middle on 2nd fret D, then pinky and ring finger spread to 3rd fret of B and high e. Those top two open strings are the 'add9' color." },
      { text: "Film it. This is a proper lead lick now — frame it like a highlight." },
    ],
    tip: "Smoothness reads as 'good' on camera more than raw speed does.",
  },
  27: {
    title: "Day 27: The Climb",
    activities: [
      {
        text: "An ascending run that travels across all six strings and up the neck, using slides to change position without a gap. Map it out slowly — practice it in two halves, then join them. End on G.",
        riff: {
          name: "The Climb",
          difficulty: 5,
          key: "E minor",
          bpm: 100,
          teaches: "full-neck ascending run with position shifts",
          steps: [
            nt(6,0), nt(6,3), nt(5,2), nt(5,3),
            nt(4,0), nt(4,2), nt(3,0), nt(3,2),
            nt(2,0), nt(2,3), nt(1,0), nt(1,3),
            nt(1,5,"/"), nt(2,5), nt(3,4), { chord: "G" },
          ],
          chords: [
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
          ],
        },
      },
      { text: "Practice it in two halves, then join them. Long runs are just short runs glued together — that's the whole game." },
      { text: "Record the full climb. Watching your hand travel the neck is a great progress clip." },
    ],
    tip: "Break big things into small things. That's the whole game.",
  },
  28: {
    title: "Day 28: Week-4 Hook",
    activities: [
      {
        text: "A fast, expressive lead phrase across the top strings — slides, bends, vibrato, all of it. Then a C → G → Em chord landing to close it out. Your Week 4 showcase.",
        riff: {
          name: "Week-4 Hook",
          difficulty: 5,
          key: "A minor",
          bpm: 104,
          teaches: "complete lead phrase + chord resolution",
          steps: [
            nt(6,5), nt(6,8), nt(5,5), nt(5,7,"/"),
            nt(5,9), nt(4,7), nt(4,9), nt(3,7,"b"),
            nt(3,9), nt(3,9,"~"), nt(2,8), nt(2,10,"b"),
            { chord: "C" }, { chord: "G" }, { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "C", frets: [-1,3,2,0,1,0], hint: "Root on the 3rd fret of the A string. Four fingers, skip the low E. Open strings on G and high e ring out bright and clear." },
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Four weeks ago you played one note on one string. Now you're throwing lead lines into chord resolutions. Look where you are." },
      { text: "Film your Week 4 hook. This is the clip you compare to Day 1. Two days to go." },
    ],
    tip: "Two days to go. Finish strong.",
    weeklyBook: { title: "The Advancing Guitarist", author: "Mick Goodrick", description: "A lifelong reference for where to take the guitar after these 30 days." },
  },

  // ── WEEK 5: Showcase — two full showcase riffs ──
  29: {
    title: "Day 29: Showcase — Minor Groove",
    activities: [
      {
        text: "Showcase #1: a groove-meets-lead riff that pulls together rhythm and the techniques you've built. It alternates single notes with chord hits — real song structure. Play it like a song, not an exercise.",
        riff: {
          name: "Minor Groove",
          difficulty: 5,
          key: "A minor",
          bpm: 96,
          teaches: "blending rhythm, lead & chords in one riff",
          steps: [
            { chord: "Am" }, nt(6,5), nt(6,8), nt(6,5),
            nt(5,5), nt(5,7), { chord: "Em" }, nt(6,5),
            nt(6,8), nt(4,7), nt(4,5), nt(3,7,"b"),
            nt(3,5), nt(2,8), nt(2,8,"~"), { chord: "Am" },
          ],
          chords: [
            { name: "Am", frets: [-1,0,2,2,1,0], hint: "Three fingers forming a small triangle. Strum the top five strings — skip the low E. Warm and minor-sounding." },
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Dynamics — loud and soft — make it yours. Play the chord hits with authority and the single notes with control. Let the vibrato at the end ring out as long as possible." },
      { text: "Film your first showcase riff. Pick your best angle — this one's for the highlight reel." },
    ],
    tip: "A riff with groove AND a hook is what people actually remember.",
  },
  30: {
    title: "Day 30: Showcase — The Finale",
    activities: [
      {
        text: "The finale: an expressive E-minor riff using every technique in the book — hammer, pull, slide, bend, vibrato — then a C → G → Em landing to close the month. Your best take.",
        riff: {
          name: "The Finale",
          difficulty: 5,
          key: "E minor",
          bpm: 100,
          teaches: "every technique in one phrase with full chord resolution",
          steps: [
            nt(6,0), nt(6,3), nt(5,0), nt(5,2),
            nt(4,0), nt(4,2,"h"), nt(4,0,"p"), nt(3,2),
            nt(3,4,"/"), nt(2,3,"b"), nt(2,3,"~"), nt(2,0),
            { chord: "C" }, { chord: "G" }, { chord: "Em" }, nt(6,0),
          ],
          chords: [
            { name: "C", frets: [-1,3,2,0,1,0], hint: "Root on the 3rd fret of the A string. Four fingers, skip the low E. Open strings on G and high e ring out bright and clear." },
            { name: "G", frets: [3,2,0,0,0,3], hint: "Fingers on 3rd fret of low E and high e, 2nd fret of A. Let all six strings ring. Bright, full, and extremely common." },
            { name: "Em", frets: [0,2,2,0,0,0], hint: "Two fingers — 2nd fret of the A and D strings. Strum all six. The friendliest chord on guitar." },
          ],
        },
      },
      { text: "Take your time and nail it. There's no Day 31 — make this one count. A hammer, a pull, a slide, a bend, a vibrato, and three chords. That's the whole language." },
      { text: "Film the finale and post the 30-day montage: Day 1 → Day 30. You did the whole thing. 30 riffs, 30 days, 30 clips — that's not a hobby anymore, that's a habit." },
    ],
    tip: "30 riffs. 30 days. 30 clips. That's not a hobby anymore — that's a habit.",
  },
};

const RIFF_PLAN: Plan = {
  cleanedGoal: "Learn a new guitar riff every day",
  startDate: RIFF_START,
  totalDays: 30,
  days: RIFF_DAYS,
  sprints: [
    { number: 1, title: "Week 1: Foundations", theme: "Multi-string picking from day one, Em and Am chords introduced early, palm muting, and your first hammer-on — all stitched into a hook by day 7." },
    { number: 2, title: "Week 2: Pentatonic + Pull-offs", theme: "Learn the minor pentatonic box — the engine behind most riffs — plus pull-offs, treble licks, bends, and D5/A5 power chords. Finish with a bend-and-vibrato hook." },
    { number: 3, title: "Week 3: Expression", theme: "Slides, full-step bends, vibrato, and a three-chord Em–D–G progression. This is the week your playing starts to sound like you." },
    { number: 4, title: "Week 4: Speed & Chords", theme: "Alternate picking, six-string legato, gallop rhythm, sequencing, and the C and Cadd9 chords. Combine technique with tempo into a full lead phrase." },
    { number: 5, title: "Week 5: Showcase", theme: "Two highlight-reel riffs that pull the whole month together — chord-anchored grooves and a finale that uses every technique you've built. Film your best takes." },
  ],
  sprintsGenerated: 5, // all 30 days visible from the start — it's a see-the-whole-journey challenge
};

const RIFF_PROGRESS: ProgressMap = {}; // fresh start — day 1 is ready to play

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
    id: DEMO_GOAL_IDS.riffs,
    title: "Learn a new guitar riff every day",
    timeCommitment: "15 min/day",
    startDate: RIFF_START,
    completedDays: 0,
    totalDays: 30,
  },
  {
    id: DEMO_GOAL_IDS.guitar,
    title: "Learn to play guitar",
    timeCommitment: "30 min/day",
    startDate: GUITAR_START,
    completedDays: 4,
    totalDays: 28,
  },
  {
    id: DEMO_GOAL_IDS.morning,
    title: "Build a morning routine",
    timeCommitment: "60 min/day",
    startDate: MORNING_START,
    completedDays: 1,
    totalDays: 28,
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

// 28-day arc template (4 sprints × 7 days). Each entry is { title, activityTemplates: string[], tip }.
// {{goal}} is replaced with the user's goal text at build time.
const DEMO_ARC: { title: string; activities: string[]; tip: string }[] = [
  { title: "Day 1: Lay the foundation", activities: ["Write one sentence answering: what does success with {{goal}} actually look like?", "Identify the single smallest first step you can take today.", "Block 20 focused minutes tomorrow on your calendar."], tip: "Clarity beats motivation. A vague goal stalls; a specific one moves." },
  { title: "Day 2: Make it visible", activities: ["Set up your physical or digital space so the work is one tap away.", "Tell one person what you're working on this week.", "Spend 15 minutes doing the smallest version of the work."], tip: "Friction is the silent killer. Lower it now, glide later." },
  { title: "Day 3: First real attempt", activities: ["Spend 25 minutes on the core skill — no setup, just doing.", "Write 2 sentences on what felt hard.", "Note the time of day you worked — energy matters."], tip: "Showing up imperfectly today beats waiting until you feel ready." },
  { title: "Day 4: Build the muscle", activities: ["Repeat yesterday's core work for 25 minutes.", "Pick ONE thing you'll improve tomorrow.", "Track: did you do this at the same time as yesterday?"], tip: "Same time, same place, same trigger. That's how habits root." },
  { title: "Day 5: Push the edge", activities: ["Spend 30 minutes on the work — go 5 min longer than last time.", "Identify the part you're avoiding. Spend 5 min on just that.", "Write down one question you still have."], tip: "Growth lives at the edge of what you can already do." },
  { title: "Day 6: Reflect & adjust", activities: ["Review this week's progress: what worked, what didn't?", "Spend 20 minutes on the core skill.", "Plan tomorrow's session in writing — be specific."], tip: "An unreviewed week repeats itself. A reviewed week compounds." },
  { title: "Day 7: Sprint 1 complete", activities: ["Do a 30-minute focused session.", "Celebrate: you've finished your first 7-day sprint.", "Write 3 sentences on how sprint 1 actually felt."], tip: "You didn't just do 7 days — you proved sprint 1 is real. Sprint 2 generates next." },
  { title: "Day 8: Sprint 2 begins", activities: ["Re-read your day-1 success definition. Still right?", "30 minutes of focused work.", "Choose one habit to drop that competes with this goal."], tip: "Sprint 2 is where most people quit. Stay boring on purpose." },
  { title: "Day 9: Find the rhythm", activities: ["Same time slot as yesterday. 30 min of work.", "Note one micro-pattern you've noticed about your work.", "Save one resource (book, video, person) for later."], tip: "Patterns become routines. Routines become identity." },
  { title: "Day 10: Double down", activities: ["35 minutes today — push the duration slightly.", "Do the thing you've been quietly avoiding.", "Share one specific update with someone."], tip: "The boring middle is where most of the gains live." },
  { title: "Day 11: Refine technique", activities: ["Spend 10 minutes studying how someone better than you does this.", "Apply one new technique for 20 minutes.", "Compare: what's the difference between their work and yours?"], tip: "Imitate the masters first. Innovate later." },
  { title: "Day 12: Strength check", activities: ["Do a 30-minute session focused on your weakest area.", "Note what felt easier than week 1.", "Plan a 'showcase day' for end of week 2."], tip: "Weak spots fixed now compound. Ignored, they cap you." },
  { title: "Day 13: Eyes open", activities: ["Spend 30 minutes. Pay close attention to one small detail.", "Write down what you noticed that you'd missed before.", "Reduce one distraction in your environment."], tip: "Skill is mostly noticing what you couldn't notice before." },
  { title: "Day 14: Sprint 2 complete", activities: ["Do 30 minutes of your favorite version of the work.", "Re-read your first reflection. How have you changed?", "Take a screenshot or photo of your progress."], tip: "Two sprints down. Sprint 3 generates next — you're past the dropout zone." },
  { title: "Day 15: Sprint 3 begins", activities: ["30 minutes — push slightly harder than last session.", "Identify ONE constraint you can remove this sprint.", "Plan tomorrow's session in writing."], tip: "The compound starts to bend now. Trust the curve." },
  { title: "Day 16: Build leverage", activities: ["Set up a tool, template, or system to make next week easier.", "Spend 25 minutes on the core skill.", "Write one sentence on what feels different now."], tip: "Systems multiply effort. Build them when the work is fresh." },
  { title: "Day 17: Teach to learn", activities: ["Explain what you've learned to someone — out loud or in writing.", "Do 25 minutes of the work.", "Note what you couldn't explain — that's your gap."], tip: "If you can't teach it, you don't fully own it yet." },
  { title: "Day 18: Stack a skill", activities: ["Pick one sub-skill you've been weak on. Spend 20 minutes just on that.", "Spend 15 minutes integrating it into your main work.", "Write 1 sentence on what clicked."], tip: "Specialized practice beats general practice every time." },
  { title: "Day 19: Volume day", activities: ["Do 40 minutes today — your longest session yet if you can.", "Don't optimize, just produce.", "Note: was it easier or harder than expected?"], tip: "Output beats input. Make things. Don't just consume." },
  { title: "Day 20: Audit your time", activities: ["For 24 hours, track where each 30-min block of your day goes.", "Do 25 minutes of the core work.", "Identify one block you'll reclaim for this goal."], tip: "You can't change what you don't measure. Measure once, change forever." },
  { title: "Day 21: Sprint 3 complete", activities: ["Do a 30-minute session — your most polished version.", "Write down what your day-1 self would think of your day-21 self.", "Commit to the final 7-day sprint in writing."], tip: "Three sprints down. The last one decides whether this becomes who you are." },
  { title: "Day 22: Sprint 4 begins — integrate", activities: ["Combine 2 skills you've practiced into one 30-min session.", "Identify the highest-leverage habit to keep after day 28.", "Spend 5 minutes journaling about momentum."], tip: "The last sprint is about turning practice into identity." },
  { title: "Day 23: Pressure test", activities: ["Do the work under a small constraint (less time, less perfect setup).", "Note how you adapted.", "30 minutes total."], tip: "Adaptability is the test of real skill." },
  { title: "Day 24: Public step", activities: ["Share one specific piece of your work or progress publicly (text, post, demo).", "30 minutes on the core skill.", "Note how it felt to put it out there."], tip: "Public commitments compound private progress." },
  { title: "Day 25: Final big push", activities: ["Plan a 45-minute deep work session.", "Execute it without checking your phone.", "Note one breakthrough or stuck point."], tip: "Deep work is the multiplier most people skip." },
  { title: "Day 26: Polish", activities: ["Take something you made and improve ONE specific thing about it.", "30 minutes of focused work.", "Identify your top 3 strengths from these 4 sprints."], tip: "The last 10% is what makes something memorable." },
  { title: "Day 27: Document", activities: ["Write down your 3 biggest lessons from these 4 sprints.", "Do 25 minutes of the work.", "Save your favorite session's output somewhere you'll find it."], tip: "Memory fades. Documents stay." },
  { title: "Day 28: Victory day", activities: ["Do one full, intentional session — your best work.", "Write a short letter to your day-1 self.", "Decide: what do the next 4 sprints look like?"], tip: "You did 4 sprints. Most people don't finish one. That's identity, not luck." },
];

// Four sprint themes — each one is a quarter of the goal arc. Used as headers
// across the calendar + congrats screens. Order is fixed; theme intent stays the
// same regardless of which goal the user picked.
const SPRINT_THEMES: ReadonlyArray<{ title: string; theme: string }> = [
  { title: "Sprint 1: Foundations", theme: "Define what success means for your goal, set up your space, and take your first real steps." },
  { title: "Sprint 2: Build Momentum", theme: "Lock in a daily rhythm. Stretch the duration of each session. Make showing up automatic." },
  { title: "Sprint 3: Stretch", theme: "Push past your edges, refine technique, and pressure-test your skill in public." },
  { title: "Sprint 4: Integrate", theme: "Combine everything you've practiced, document your wins, and make the habit permanent." },
] as const;

/** Build sprint-meta array for any user goal. Themes are goal-agnostic; the user's
 *  goal string fills in the activity bodies via DEMO_ARC's {{goal}} placeholder. */
function buildSprintMeta(): SprintMeta[] {
  return SPRINT_THEMES.map((t, i) => ({ number: i + 1, title: t.title, theme: t.theme }));
}

/** Materialize days [from, to] inclusive into a Plan.days record, with the user's
 *  goal text spliced into each activity template. Preserves existing day entries
 *  (so legacy fixture plans with hand-written days keep their content). */
function materializeDays(cleanedGoal: string, from: number, to: number, existing: Plan["days"] = {}): Plan["days"] {
  const out: Plan["days"] = { ...existing };
  for (let d = from; d <= to; d++) {
    if (out[d]) continue; // preserve hand-authored entries
    const arcDay = DEMO_ARC[d - 1];
    if (!arcDay) continue;
    out[d] = {
      title: arcDay.title,
      activities: arcDay.activities.map(text => ({ text: text.replace(/\{\{goal\}\}/g, cleanedGoal) })),
      tip: arcDay.tip,
    };
  }
  return out;
}

/** Generate a fresh demo plan with ONLY sprint 1 (days 1-7) populated. Sprints
 *  2-4 generate as the user completes day 7 / 14 / 21 (see generateNextSprint). */
export function buildDemoGoalDetail(formData: GoalFormData): { goalId: string; detail: DemoGoalDetail; listItem: DemoGoalListItem } {
  const cleanedGoal = formData.goal.trim().replace(/[.!?]+$/, "");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today.toISOString().split("T")[0];
  const goalId = `demo-${Date.now().toString(36)}`;

  const days = materializeDays(cleanedGoal, 1, 7);

  const plan: Plan = {
    cleanedGoal,
    startDate,
    days,
    sprints: buildSprintMeta(),
    sprintsGenerated: 1,
  };

  return {
    goalId,
    detail: {
      goal: cleanedGoal,
      timeCommitment: formData.timeCommitment || "30 min/day",
      availableDays: formData.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      plan,
      progress: {},
    },
    listItem: {
      id: goalId,
      title: cleanedGoal,
      timeCommitment: formData.timeCommitment || "30 min/day",
      startDate,
      completedDays: 0,
      totalDays: 28,
    },
  };
}

/** Mutate the demo plan in place to add the next sprint's days. Returns the
 *  updated Plan reference. No-op if the requested sprint is already generated
 *  or out of range. */
export function generateNextSprint(goalId: string, sprintNumber: number): Plan | null {
  const detail = DEMO_GOAL_DETAILS[goalId];
  if (!detail) return null;
  if (sprintNumber < 1 || sprintNumber > 4) return null;
  const currentlyGenerated = detail.plan.sprintsGenerated ?? 4;
  if (sprintNumber <= currentlyGenerated) return detail.plan;

  const cleanedGoal = detail.plan.cleanedGoal ?? detail.goal;
  const from = (sprintNumber - 1) * 7 + 1;
  const to = sprintNumber * 7;
  const newDays = materializeDays(cleanedGoal, from, to, detail.plan.days);

  const updatedPlan: Plan = {
    ...detail.plan,
    days: newDays,
    sprintsGenerated: sprintNumber,
  };
  detail.plan = updatedPlan;
  return updatedPlan;
}

export const DEMO_GOAL_DETAILS: Record<string, DemoGoalDetail> = {
  [DEMO_GOAL_IDS.riffs]: {
    goal: "Learn a new guitar riff every day",
    timeCommitment: "15 min/day",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    plan: RIFF_PLAN,
    progress: RIFF_PROGRESS,
  },
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
  { id: "goal-crusher", name: "Goal Crusher", description: "Complete every day of a goal", icon: "🏆", unlocked: false },
];

export const DEMO_ENGAGEMENT: EngagementState = {
  currentStreak: 4,
  longestStreak: 4,
  isAtRisk: false,
  totalXP: 560,
  level: { name: "Committed", threshold: 500, nextThreshold: 1200 },
  levelProgress: 0.086,
  achievements: DEMO_ACHIEVEMENTS,
  completionRate: 17,
  totalDaysCompleted: 5,
  streakFreezes: 0,
  dailyMultiplier: 1.5,
  dailyChallenge: { id: "all_activities", description: "Complete every activity", bonusXP: 75, checkKey: "all_activities" },
  isComeback: false,
};
