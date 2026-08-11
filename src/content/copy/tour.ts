export const tour = {
  steps: [
    {
      heading: "One Week At A Time.",
      body: "Your goal becomes a series of 7-day sprints. Each day unlocks a small set of activities — tap to start.",
    },
    {
      heading: "Build A Streak.",
      body: "Show up daily and your streak climbs. Each streak day boosts your XP multiplier.",
    },
    {
      heading: "Unlock Achievements.",
      body: "Hit milestones — first day, week warrior, halfway hero — and we'll celebrate every win.",
    },
    {
      heading: "Finish Strong.",
      body: "Finish every sprint and earn a shareable certificate. Your story, your proof.",
    },
  ],

  skipButton: "Skip",
  nextButton: "Next",
  finishButton: "Let's Go",

  stepCounter: (current: number, total: number) => `Step ${current} of ${total}`,
} as const;
