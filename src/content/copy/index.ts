/**
 * COPY — the single source of truth for every user-facing string in the app.
 * One keyed entry per piece of copy, grouped by screen. Editing any wording is
 * a one-line change here; typos fail the build because every module is `as const`.
 *
 * Usage:  import { COPY } from "@/content/copy";  …  COPY.day.activitiesLabel
 * Interpolated copy is stored as a small function:  COPY.day.dayTitle(3)
 */
import { landing } from "./landing";
import { legal } from "./legal";
import { resetPassword } from "./resetPassword";
import { login } from "./login";
import { goals } from "./goals";
import { goalCreation } from "./goalCreation";
import { calendar } from "./calendar";
import { day } from "./day";
import { tour } from "./tour";
import { loading } from "./loading";
import { congrats } from "./congrats";
import { planComplete } from "./planComplete";
import { beastMode } from "./beastMode";
import { sprintRecap } from "./sprintRecap";
import { settings } from "./settings";
import { toasts, confirms, notFound } from "./common";

export const COPY = {
  landing,
  legal,
  resetPassword,
  login,
  goals,
  goalCreation,
  calendar,
  day,
  tour,
  loading,
  congrats,
  planComplete,
  beastMode,
  sprintRecap,
  settings,
  toasts,
  confirms,
  notFound,
} as const;

export type Copy = typeof COPY;
