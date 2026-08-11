/**
 * STEPS — the goal-creation wizard as data.
 *
 * Each field is ONE editable entry: its key, control type, which section of the
 * form it sits in, whether it's required, and its copy. The wizard renders from
 * this list, so adding / reordering / retyping a question is a change here — not
 * a hunt through JSX. Read WIZARD_FIELDS top-to-bottom to see "every step" of
 * goal creation in one place.
 *
 * Structure vs. content: the words live in COPY.goalCreation; this file owns the
 * field structure and points at the copy. `key` maps to GoalFormData.goal (the
 * primary field) or into contextAnswers (everything else).
 */
import { COPY } from "@/content/copy";

export type WizardFieldType = "textarea" | "text" | "choice";
export type WizardSection = "primary" | "context" | "optional";
export type WizardFieldKey =
  | "goal"
  | "why"
  | "experienceLevel"
  | "priorExperience"
  | "preferredTactics";

export interface WizardChoice {
  readonly value: string;
  readonly label: string;
  readonly desc?: string;
}

export interface WizardField {
  readonly key: WizardFieldKey;
  readonly type: WizardFieldType;
  readonly section: WizardSection;
  readonly label: string;
  readonly placeholder?: string;
  readonly choices?: readonly WizardChoice[];
  readonly required?: boolean;
  readonly autoFocus?: boolean;
}

export const WIZARD_FIELDS: readonly WizardField[] = [
  {
    key: "goal",
    type: "textarea",
    section: "primary",
    required: true,
    autoFocus: true,
    label: COPY.goalCreation.goalLabel,
    placeholder: COPY.goalCreation.goalPlaceholder,
  },
  {
    key: "why",
    type: "textarea",
    section: "context",
    label: COPY.goalCreation.whyLabel,
    placeholder: COPY.goalCreation.whyPlaceholder,
  },
  {
    key: "experienceLevel",
    type: "choice",
    section: "context",
    label: COPY.goalCreation.experienceLabel,
    choices: COPY.goalCreation.experienceOptions,
  },
  {
    key: "priorExperience",
    type: "text",
    section: "optional",
    label: COPY.goalCreation.priorExperienceLabel,
    placeholder: COPY.goalCreation.priorExperiencePlaceholder,
  },
  {
    key: "preferredTactics",
    type: "text",
    section: "optional",
    label: COPY.goalCreation.preferredTacticsLabel,
    placeholder: COPY.goalCreation.preferredTacticsPlaceholder,
  },
];

/** Fields rendered inside the collapsible "tell us more" section. */
export const OPTIONAL_FIELDS: readonly WizardField[] = WIZARD_FIELDS.filter(
  (f) => f.section === "optional",
);

/** Look up a field by key (the fixed-position fields are placed by key). */
export function wizardField(key: WizardFieldKey): WizardField {
  const f = WIZARD_FIELDS.find((x) => x.key === key);
  if (!f) throw new Error(`Unknown wizard field: ${key}`);
  return f;
}

export type WizardValues = Record<WizardFieldKey, string>;

/** Seed the form from defaults + any goal being edited. */
export function initialWizardValues(
  initial?: { goal?: string; contextAnswers?: Record<string, string> } | null,
): WizardValues {
  const ctx = initial?.contextAnswers ?? {};
  return {
    goal: initial?.goal ?? "",
    why: ctx.why ?? "",
    experienceLevel: ctx.experienceLevel ?? "beginner",
    priorExperience: ctx.priorExperience ?? "",
    preferredTactics: ctx.preferredTactics ?? "",
  };
}
