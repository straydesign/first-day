/**
 * Guitar tablature artifact — the first domain on the artifact seam.
 *
 * Everything guitar-specific lives here: when to ask for tab, how to describe the
 * JSON to the model, and how to refuse anything unplayable. `anthropic.ts` knows
 * only the ArtifactSpec interface.
 */
import type { Artifact, ChordShape, GuitarRiff, RiffNote, RiffStep } from "@/types";
import type { ArtifactSpec } from "./types";

/**
 * Deliberately narrow. GuitarTab draws SIX strings, so bass (4) and ukulele (4)
 * would render wrong — they need their own spec, not a loose match here. "tab"
 * and a bare "chords" are excluded too: they collide with browser tabs and with
 * piano goals, and a false positive spends output budget on an artifact the day
 * view will not use.
 */
const GUITAR = /\b(guitars?|fretboard|riffs?|tablature|power ?chords?|barre ?chords?|strumming|fingerpicking)\b/i;

const TECHNIQUES = new Set(["h", "p", "/", "\\", "b", "~", "x"]);
const MAX_FRET = 24;

const PROMPT = `
GUITAR TABLATURE
This goal is about playing guitar, so a day that says "practise the minor pentatonic"
should SHOW the notes, not describe them. On days where the user practises a specific
riff, scale run, or chord progression, attach a playable artifact to that ONE activity
by using the object form instead of a plain string:

  { "text": "Practise this Em pentatonic climb slowly", "artifact": { "kind": "guitar-riff", "data": { ... } } }

The "data" object:
{
  "name": "Minor Pentatonic Climb",   // short descriptive name
  "difficulty": 1,                    // 1 easiest … 5 hardest
  "key": "E minor",                   // display label
  "bpm": 70,                          // suggested practice tempo
  "teaches": "hammer-ons",            // the one skill this drills
  "steps": [                          // 12-24 entries, read left to right
    { "string": 6, "fret": 0 },
    { "string": 6, "fret": 3, "technique": "h" },
    { "chord": "Em" }
  ],
  "chords": [                                                  // only if a step uses "chord"
    { "name": "Em", "frets": [0, 2, 2, 0, 0, 0], "hint": "two fingers, strum all six" }
  ]
}

A CHORD PROGRESSION is an artifact too, and it is the one most days need. Every chord
listed in "chords" is drawn as a full fingering diagram under the tab, so a day that
teaches or practises a chord should attach one rather than describing the shape in
words. A progression is just steps that are all chord hits:

  { "text": "Play this Em to Am progression, four beats each",
    "artifact": { "kind": "guitar-riff", "data": {
      "name": "Em - Am, four beats each", "bpm": 60, "teaches": "clean chord changes",
      "steps": [ {"chord":"Em"}, {"chord":"Em"}, {"chord":"Em"}, {"chord":"Em"},
                 {"chord":"Am"}, {"chord":"Am"}, {"chord":"Am"}, {"chord":"Am"} ],
      "chords": [ { "name": "Em", "frets": [0,2,2,0,0,0], "hint": "two fingers, strum all six" },
                  { "name": "Am", "frets": [-1,0,2,2,1,0], "hint": "skip the low E" } ] } } }

Read these two orderings carefully — they run OPPOSITE ways and getting them
backwards produces a riff that is silently wrong:
- "string" in a step: 1 = high e (thinnest), 6 = low E (thickest). Same as any tab site.
- "frets" in a chord: SIX numbers, low E FIRST → high e last. 0 = open, -1 = not played.

More rules:
- "fret" is 0-${MAX_FRET}; 0 means the open string.
- "technique" is optional and must be one of: h (hammer-on), p (pull-off), / (slide up),
  \\\\ (slide down), b (bend), ~ (vibrato), x (muted).
- Every "chord" named in steps MUST have a matching entry in "chords".
- At most ONE artifact per day, and only on days it earns its place — a day about
  restringing the guitar or listening to records should not have tab.
- Never write "play THIS riff" or "THIS progression" on an activity with no artifact
  attached — the user has nothing to look at. Either attach the artifact or name what
  they should play ("play the Em to Am change you learned on day 4").
- Keep it playable at the user's stated level. A beginner gets open strings and
  first-position shapes, not 12th-fret stretches.
`.trim();

function coerceNote(raw: Record<string, unknown>): RiffNote | null {
  const string = Number(raw.string);
  const fret = Number(raw.fret);
  if (!Number.isInteger(string) || string < 1 || string > 6) return null;
  if (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET) return null;
  const technique = typeof raw.technique === "string" && TECHNIQUES.has(raw.technique) ? (raw.technique as RiffNote["technique"]) : undefined;
  return { string, fret, ...(technique ? { technique } : {}) };
}

function coerceChordShape(raw: unknown): ChordShape | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;
  if (!Array.isArray(o.frets) || o.frets.length !== 6) return null;
  const frets = o.frets.map(Number);
  // -1 = muted, 0 = open, 1..MAX_FRET = fretted. Anything else is not a shape.
  if (frets.some((f) => !Number.isInteger(f) || f < -1 || f > MAX_FRET)) return null;
  // All six muted is not a chord — it is a typo that would draw an empty box.
  if (frets.every((f) => f === -1)) return null;
  return {
    name,
    frets: frets as ChordShape["frets"],
    ...(typeof o.hint === "string" && o.hint.trim() ? { hint: o.hint.trim() } : {}),
  };
}

/**
 * Returns a riff only if it is actually playable. Individual bad steps are
 * dropped rather than failing the whole artifact — one hallucinated fret number
 * should not cost the user their tab — but a riff that ends up too short to be
 * worth drawing is rejected so the activity falls back to plain text.
 */
export function coerceGuitarRiff(raw: unknown): Artifact | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : null;
  if (!name || !Array.isArray(o.steps)) return null;

  const chords = Array.isArray(o.chords)
    ? o.chords.map(coerceChordShape).filter((c): c is ChordShape => c !== null)
    : [];
  const known = new Set(chords.map((c) => c.name));

  const steps: RiffStep[] = [];
  for (const s of o.steps) {
    if (!s || typeof s !== "object") continue;
    const step = s as Record<string, unknown>;
    if (typeof step.chord === "string") {
      // A chord hit with no shape to draw would render a blank column and teach
      // nothing, so drop it rather than inventing a fingering.
      if (known.has(step.chord)) steps.push({ chord: step.chord });
      continue;
    }
    const note = coerceNote(step);
    if (note) steps.push(note);
  }

  // Fewer than 6 steps is a fragment, not a riff — the board would look broken.
  if (steps.length < 6) return null;

  const difficulty = Number(o.difficulty);
  const bpm = Number(o.bpm);
  const data: GuitarRiff = {
    name,
    steps,
    ...(chords.length ? { chords: chords.filter((c) => steps.some((s) => "chord" in s && s.chord === c.name)) } : {}),
    ...(Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 5 ? { difficulty: difficulty as GuitarRiff["difficulty"] } : {}),
    ...(typeof o.key === "string" && o.key.trim() ? { key: o.key.trim() } : {}),
    ...(Number.isFinite(bpm) && bpm >= 30 && bpm <= 300 ? { bpm: Math.round(bpm) } : {}),
    ...(typeof o.teaches === "string" && o.teaches.trim() ? { teaches: o.teaches.trim() } : {}),
  };
  return { kind: "guitar-riff", data };
}

export const guitarSpec: ArtifactSpec = {
  kind: "guitar-riff",
  matches: (goal) => GUITAR.test(goal),
  prompt: PROMPT,
  // A riff runs 300-700 output tokens. Budgeting for three across the sprint
  // keeps the model from truncating mid-JSON, which loses the whole day.
  tokenBudget: 2500,
  coerce: coerceGuitarRiff,
};
