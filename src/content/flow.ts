/**
 * FLOW — the whole app's screen structure in one place.
 *
 * Every screen the user can reach, its title, where "back" goes, whether it
 * needs a session, and its public URL (if deep-linkable). Read this top to
 * bottom to reason about the entire flow: what's reachable, what gates on auth,
 * and how back-navigation chains. The app routes its real navigation through
 * `SCREENS` (Escape/back targets, auth guards, URL routing) — change the map
 * here, not scattered conditionals.
 *
 * Content vs. structure: COPY (src/content/copy) owns the words; FLOW owns the
 * structure. `title` here points back into COPY so the catalogue shows the real
 * title; dynamic titles (e.g. "Day 3", the goal name) are computed in-component
 * and left undefined here.
 */
import type { AppView } from "@/types";
import { COPY } from "@/content/copy";

export type ScreenKind = "page" | "modal";

export interface ScreenMeta {
  /** Static TopBar/nav title. Undefined when the title is dynamic. */
  title?: string;
  /** Back-button / Escape destination. Undefined for root screens (landing, goals). */
  back?: AppView;
  /** Requires an authenticated or demo session to render. */
  auth: boolean;
  kind: ScreenKind;
  /** Public URL path, when the screen is deep-linkable. */
  path?: string;
}

export const SCREENS: Record<AppView, ScreenMeta> = {
  landing:          { auth: false, kind: "page", path: "/" },
  goals:            { title: COPY.goals.topBarTitle,            auth: true,  kind: "page" },
  onboarding:       { title: COPY.goalCreation.title,          back: "goals",    auth: true,  kind: "page" },
  calendar:         {                                          back: "goals",    auth: true,  kind: "page" },
  day:              {                                          back: "calendar", auth: true,  kind: "page" },
  congrats:         {                                          back: "calendar", auth: true,  kind: "page" },
  settings:         { title: COPY.settings.topBarTitle,        back: "goals",    auth: true,  kind: "page" },
  privacy:          { title: COPY.legal.page.privacyTitle,     back: "landing",  auth: false, kind: "page", path: "/privacy" },
  terms:            { title: COPY.legal.page.termsTitle,       back: "landing",  auth: false, kind: "page", path: "/terms" },
  "reset-password": { title: COPY.resetPassword.topBarTitle,   back: "landing",  auth: false, kind: "page" },
};

/** The login screen is a modal overlay (not an AppView), surfaced over landing. */
export const LOGIN_MODAL = { kind: "modal" as const, auth: false } as const;

/** Canonical screen order — for review, the flow map, and nav reasoning. */
export const SCREEN_ORDER: readonly AppView[] = [
  "landing",
  "goals",
  "onboarding",
  "calendar",
  "day",
  "congrats",
  "settings",
  "privacy",
  "terms",
  "reset-password",
] as const;

/** Where "back" / Escape goes from a screen, if anywhere. */
export function backTarget(view: AppView): AppView | undefined {
  return SCREENS[view].back;
}

/** The static title for a screen ("" when the title is computed in-component). */
export function screenTitle(view: AppView): string {
  return SCREENS[view].title ?? "";
}

/** Resolve a public URL path to its screen, for deep-link routing. */
export function viewForPath(path: string): AppView | undefined {
  const entry = (Object.keys(SCREENS) as AppView[]).find(
    (v) => SCREENS[v].path === path && v !== "landing",
  );
  return entry;
}

/** A non-landing public page (privacy / terms / reset-password). */
export function isPublicSubpage(view: AppView): boolean {
  return !SCREENS[view].auth && view !== "landing";
}
