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
    signedInWith: {
      google: "Signed in with Google",
      apple: "Signed in with Apple",
    } as Record<string, string>,
    signedInFallback: "Signed in",
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
    description: "One nudge each evening to keep your streak alive.",
    pushTitle: "Today's plan is ready",
    pushBody: "A few small steps. Keep your streak going.",
    denied: "Turn on notifications for First Day in iOS Settings.",
  },

  data: {
    heading: "Your data",
    body: "First Day only ever stores the goals and progress you create. We never sell it.",
  },

  danger: {
    heading: "Danger zone",
    label: "Delete account",
    description:
      "Deletes your account and every goal, plan, and day of progress. You can't undo this.",
    button: "Delete account",
  },
} as const;
