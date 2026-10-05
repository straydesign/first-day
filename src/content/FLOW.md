# First Day — Flow Map

The whole app in one page. Three keyed sources of truth drive everything:

| Concern | File | What it owns |
|---|---|---|
| **Words** | `src/content/copy/` (`COPY`) | Every user-facing string, grouped by screen. Edit copy here. |
| **Structure** | `src/content/flow.ts` (`SCREENS`) | Every screen: title, back target, auth, URL. Drives nav. |
| **Wizard steps** | `src/content/steps.ts` (`WIZARD_FIELDS`) | The goal-creation form, field by field. |

To change a screen's words → edit its `copy/` module. To change where "back" goes or add a
deep-linkable page → edit `SCREENS`. To add/reorder a goal-creation question → edit `WIZARD_FIELDS`.

---

## Screens (`SCREENS` in flow.ts)

| View | Title | Back → | Auth | URL | Copy module |
|---|---|---|---|---|---|
| `landing` | _(welcome)_ | — | no | `/` | `copy/login.ts` |
| `goals` | "Your goals" | _(home)_ | yes | — | `copy/goals.ts` |
| `onboarding` | "Let's Create Your Goal" | `goals` | yes | — | `copy/goalCreation.ts` |
| `calendar` | _(goal name)_ | `goals` | yes | — | `copy/calendar.ts` |
| `day` | _("Day N")_ | `calendar` | yes | — | `copy/day.ts` |
| `congrats` | _(milestone)_ | `calendar` | yes | — | `copy/congrats.ts` |
| `privacy` | "Privacy Policy" | `landing` | no | `/privacy` | `copy/legal.ts` |
| `terms` | "Terms of Service" | `landing` | no | `/terms` | `copy/legal.ts` |

**Signed out:** `landing` renders `WelcomeScreen` — Google / Apple sign-in + demo (`copy/login.ts`).

**Sequences (already data-driven):** onboarding tour (`copy/tour.ts`), loading steps
(`copy/loading.ts`), celebrations (`copy/congrats.ts`, `copy/planComplete.ts`), beast mode
(`copy/beastMode.ts`).

### Navigation wiring
- **Escape / back** → `backTarget(view)` (AuthenticatedApp + TopBar `onBack`).
- **URL deep-links** → `viewForPath(path)` (page.tsx mount effect) + `next.config.ts` rewrites.
- **Public-page guard** → `isPublicSubpage(view)` (page.tsx session check).
- **Titles** → `screenTitle(view)` (TopBars for goals / legal).

---

## Goal-creation wizard (`WIZARD_FIELDS` in steps.ts)

| # | Field key | Type | Section | Required |
|---|---|---|---|---|
| 1 | `goal` | textarea | primary | ✓ |
| 2 | `why` | textarea | context | |
| 3 | `skillLevel` | slider 1–100, live "34 · Beginner" label + one example line per band | context | |
| 4 | `priorExperience` | text | optional | |
| 5 | `preferredTactics` | text | optional | |

Plus: template grid + scroll-suggestion rows (from `@/constants`), an empty-goal validation
modal, and the Generate / Cancel CTAs. `optional` fields render inside the "Tell us more"
collapsible and are mapped from config — add another optional question by appending to
`WIZARD_FIELDS`.

Submitting builds `GoalFormData { goal, why, skillLevel, experienceLevel (derived from the band),
priorExperience, preferredTactics, contextAnswers, timestamp }` → `/api/generate-plan`.

---

## Cross-cutting copy (`copy/common.ts`)
- `COPY.toasts.*` — every toast (auth, goal data, plan, share).
- `COPY.confirms.*` — destructive-action `window.confirm` prompts.
- `COPY.notFound.*` — the 404 page.

