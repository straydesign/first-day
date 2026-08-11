export const landing = {
  nav: {
    logIn: "Log In",
    getStarted: "Get Started",
    getStartedShort: "Start",
  },
  hero: {
    title: "First Day",
    tagline:
      "The first day of the rest of your life. Pick a goal and get a plan that builds one week at a time — all the way to the finish.",
    getStarted: "Get Started",
    logIn: "Log In",
    scrollHint: "See it in 2s",
  },
  pills: {
    prompt: "Tap a goal to preview your first week",
  },
  howItWorks: {
    kicker: "The System",
    title: "How It Works",
    subtitle: "No vague vision boards. A real plan that unfolds one week at a time.",
    steps: [
      { title: "Set Your Goal", line: "Pick what's been nagging you. One sentence." },
      { title: "Get Your First Week", line: "AI builds your first 7-day sprint. Specific. Doable." },
      { title: "Build Week by Week", line: "Finish a sprint and the next one generates, shaped by how the last went." },
    ],
  },
  stayMotivated: {
    kicker: "The Loop",
    title: "Stay Motivated",
    subtitle: "Streaks, XP, and a daily reflection that shapes the week ahead",
    streaks: {
      title: "Daily Streaks",
      body: "Keep your streak alive by showing up every day. The longer you go, the more bonus XP you earn.",
      caption: "12-day streak",
    },
    xp: {
      title: "Earn XP",
      body: "Earn points for every activity you complete, every reflection you write, and every streak day.",
      tierLabel: "Dedicated",
      progressNote: "750 XP to Unstoppable",
    },
    achievements: {
      title: "Unlock Badges",
      body: "Hit milestones and earn achievements. Can you collect them all?",
    },
    stats: {
      rate: "Rate",
      streak: "Streak",
      badges: "Badges",
    },
  },
  plan: {
    kicker: "The Plan",
    title: "What Your Plan Looks Like",
    subtitle: "Four 7-day sprints — one week unlocked at a time",
    cards: [
      { label: "One Week at a Time", desc: "Your first sprint now; each next one generates as you finish." },
      { label: "Daily Activities", desc: "Tasks, videos, and reading picked for that day." },
      { label: "Daily Reflection", desc: "A line a day — it shapes the sprint that comes next." },
      { label: "Finish Strong", desc: "Badges, trophies, and the proof you did it." },
    ],
    ctaButton: "Create Your Plan",
    ctaNote: "Run more than one at once — every plan is personalized and built forward as you go",
  },
  stickyCta: {
    createPlan: "Create Your Plan →",
    logIn: "Log In",
  },
} as const;
