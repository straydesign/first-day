/**
 * Settings / Account screen copy. The one place the app talks about the
 * account itself — who's signed in, reminders, and the destructive
 * delete-everything path. Referenced by Privacy & Terms as "the Settings page".
 */
export const settings = {
  topBarTitle: "Settings",
  intro: "Your account, reminders, and data — all in one place.",

  account: {
    heading: "Account",
    signedInWith: "Signed in with Google",
    signOut: "Sign out",
    // Demo session — no real account yet.
    demoHeading: "You're exploring in demo mode",
    demoBody:
      "Nothing here is saved. Sign in to keep your goals, streak, and progress across devices.",
    exitDemo: "Exit demo",
  },

  notifications: {
    heading: "Daily reminders",
    label: "Remind me to show up",
    description: "A single daily nudge to keep your streak alive. Off by default elsewhere.",
  },

  data: {
    heading: "Your data",
    body: "First Day only ever stores the goals and progress you create. We never sell it.",
  },

  danger: {
    heading: "Danger zone",
    label: "Delete all my data",
    description:
      "Permanently erases every goal, plan, and day of progress, then signs you out. This can't be undone.",
    button: "Delete everything",
  },
} as const;
