/**
 * Shared, cross-cutting copy — strings fired outside a single screen
 * (toasts from hooks/components, browser-confirm prompts). One place to
 * edit every notification the app shows.
 */

export const toasts = {
  // auth / session
  loggedOut: "Logged out successfully",
  logoutFailed: "Failed to logout",
  welcome: "Welcome!",
  sessionExpired: "Session expired. Please log in again.",
  googleFailed: "Google sign-in failed",
  appleFailed: "Apple sign-in failed",
  signInFailed: "Sign-in failed",

  // goal data / plan generation
  loadGoalDataRetry: "Failed to load goal data. Please try again.",
  loadGoalData: "Failed to load goal data",
  saveFailed: "Failed to save goal",
  generatePlanFailed: (message: string) => `Failed to generate plan: ${message}`,
  goalUpdated: "Goal updated!",
  planReady: "Your plan is ready!",
  planUpdated: "Your plan has been updated!",
  goalNotFound: "Goal not found",
  todayUnavailable: "Today's activities are not available yet",
  loadTodayFailed: "Failed to load today's activities",
  noGoalToRegenerate: "No goal data to regenerate",
  regenerateFailed: "Failed to regenerate plan. Please try again.",
  nextSprintFailed: "Couldn't build your next sprint. Please try again.",
  signUpRegenerate: {
    title: "Sign up to regenerate plans!",
    description: "Make an account to get a plan built for you.",
  },

  // goals management
  loadGoalsFailed: (message: string) => `Failed to load your goals: ${message}`,
  goalDeleted: "Goal deleted successfully",
  deleteGoalFailed: "Failed to delete goal",
  signUpManage: {
    title: "Sign up to manage goals!",
    description: "Create an account to add and delete your own goals.",
  },

  // settings / account
  notificationsOn: "Daily reminders on",
  notificationsOff: "Daily reminders off",
  planConsentDeclined: "We need your OK to build a plan.",
  notificationsFailed: "Couldn't change reminders. Please try again.",
  accountDeleted: "Your account has been deleted",
  deleteAccountFailed: "Couldn't delete your account. Please try again.",

  // reset password
  passwordsNoMatch: "Passwords do not match",
  resetFailed: "Failed to reset password",
  passwordUpdated: "Password updated! Please log in.",

  // share
  copied: "Copied — paste it anywhere.",
} as const;

/** 404 / not-found page. */
export const notFound = {
  heading: "404",
  body: "This page doesn't exist. It may have been moved or the link might be wrong.",
  back: "Back to First Day",
} as const;

/** Browser confirm() prompts — destructive-action gates. */
export const confirms = {
  deleteGoal: (title: string) =>
    `Are you sure you want to delete "${title}"? This action cannot be undone.`,
  regeneratePlan:
    "Are you sure you want to regenerate this plan? This will create a completely new 30-day plan.",
  planConsent:
    "To build your plan, we send your goal and your daily notes to Anthropic. They make the tool that writes the plan. Is that OK?",
  deleteAccount:
    "This deletes your account and every goal, plan, and day of progress. You can't undo it. Delete your account?",
} as const;
