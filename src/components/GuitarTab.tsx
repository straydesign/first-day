"use client";
import { useMemo } from "react";
import { Video, Music2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";
import { ChordDiagram } from "./ChordDiagram";
import type { GuitarRiff, RiffNote, RiffStep, ChordShape } from "@/types";

/**
 * GuitarTab — renders a {@link GuitarRiff} as standard guitar tablature.
 *
 * Why tab (and not staff notation): tab is the format every guitarist already
 * reads — numbers = which fret, lines = which string, read left → right. No
 * music-reading required, which is exactly the "not confusing" bar. Orientation
 * matches every tab site (Songsterr, Ultimate Guitar): the TOP line is the
 * thinnest/highest string (high e), the BOTTOM line is the thickest (low E).
 *
 * A riff is a sequence of STEPS — each a single note or a chord (several strings
 * struck together). Chords render as stacked fret numbers in one column and are
 * diagrammed beneath the board so the player learns the shape.
 *
 * The board sits on a solid near-black surface — never the busy VoronoiMosaic
 * the surrounding tile uses — so fret numbers stay legible.
 */

// Rows top → bottom = strings 1..6 = high e down to low E.
const STRING_ROWS: ReadonlyArray<{ string: number; label: string }> = [
  { string: 1, label: "e" },
  { string: 2, label: "B" },
  { string: 3, label: "G" },
  { string: 4, label: "D" },
  { string: 5, label: "A" },
  { string: 6, label: "E" },
];

const TECHNIQUE_LEGEND: Record<NonNullable<RiffNote["technique"]>, string> = {
  h: "hammer-on",
  p: "pull-off",
  "/": "slide up",
  "\\": "slide down",
  b: "bend",
  "~": "vibrato",
  x: "muted",
};

const isChord = (step: RiffStep): step is { chord: string } => "chord" in step;

/** Render one note's cell text, e.g. "h7", "/9", "7b", "x". The technique glyph
 *  sits where a guitarist expects it: lead-in techniques (hammer/pull/slide that
 *  carry you INTO this note) before the fret, expressive ones (bend/vibrato that
 *  act ON the note) after. */
function cellText(note: RiffNote): string {
  if (note.technique === "x") return "x";
  const fret = String(note.fret);
  switch (note.technique) {
    case "h":
    case "p":
    case "/":
    case "\\":
      return `${note.technique}${fret}`;
    case "b":
      return `${fret}b`;
    case "~":
      return `${fret}~`;
    default:
      return fret;
  }
}

export function GuitarTab({ riff, accent: _accent }: { riff: GuitarRiff; accent?: string }) {
  // accent prop is kept for API compatibility but we use greyscale chrome

  const steps = useMemo(() => riff.steps ?? [], [riff.steps]);
  const chordShapes = useMemo<ChordShape[]>(() => riff.chords ?? [], [riff.chords]);
  const chordByName = useMemo(() => {
    const m = new Map<string, ChordShape>();
    for (const c of chordShapes) m.set(c.name, c);
    return m;
  }, [chordShapes]);

  const noteCount = useMemo(() => steps.filter((s) => !isChord(s)).length, [steps]);
  const chordCount = useMemo(() => steps.filter(isChord).length, [steps]);
  const hasChordSteps = chordCount > 0;

  // Which techniques actually appear → only show those in the legend.
  const usedTechniques = useMemo(() => {
    const seen = new Set<NonNullable<RiffNote["technique"]>>();
    for (const s of steps) if (!isChord(s) && s.technique) seen.add(s.technique);
    return [...seen];
  }, [steps]);

  const difficulty = riff.difficulty ?? 1;

  // Fret to show for a given string within a chord step (null = string not played).
  const chordFretFor = (chordName: string, string: number): number | null => {
    const shape = chordByName.get(chordName);
    if (!shape) return null;
    const f = shape.frets[6 - string]; // frets[] is low E(6) → high e(1)
    return f < 0 ? null : f;
  };

  return (
    <div className="mt-4 select-text">
      {/* Header: name + meta chips */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 flex-shrink-0 text-white/50" aria-hidden />
          <span
            className="text-[16px] md:text-[18px] font-semibold tracking-[-0.01em] text-white leading-none"
            style={{ fontFamily: FONT }}
          >
            {riff.name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {riff.key && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/55">
              {riff.key}
            </span>
          )}
          {riff.bpm != null && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/55">
              ♩ = {riff.bpm}
            </span>
          )}
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/55">
            {noteCount} {noteCount === 1 ? "note" : "notes"}
          </span>
          {hasChordSteps && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/55">
              {chordCount} {chordCount === 1 ? "chord" : "chords"}
            </span>
          )}
          {/* Difficulty dots — functional contrast, greyscale */}
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5" aria-label={`Difficulty ${difficulty} of 5`}>
            {[1, 2, 3, 4, 5].map((d) => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: d <= difficulty ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </span>
        </div>
      </div>

      {/* The tab board — Panel surface keeps it readable */}
      <Panel contentClassName="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-max px-3 py-3">
            {/* Chord-name header row — only when the riff has chords */}
            {hasChordSteps && (
              <div className="flex items-stretch">
                <div className="w-5 flex-shrink-0" />
                {steps.map((step, i) => (
                  <div key={i} className="relative flex h-4 w-8 items-end justify-center overflow-visible">
                    {isChord(step) && (
                      <span
                        className="whitespace-nowrap text-[10px] font-semibold uppercase leading-none text-white/70"
                        style={{ fontFamily: FONT }}
                      >
                        {step.chord}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {STRING_ROWS.map(({ string, label }) => (
              <div key={string} className="flex items-stretch">
                {/* String label (left gutter) */}
                <div className="flex w-5 flex-shrink-0 items-center justify-center font-mono text-xs font-bold text-white/35">
                  {label}
                </div>
                {/* Step cells for this string */}
                {steps.map((step, i) => {
                  let text: string | null = null;
                  if (isChord(step)) {
                    const f = chordFretFor(step.chord, string);
                    if (f != null) text = String(f);
                  } else if (step.string === string) {
                    text = cellText(step);
                  }
                  return (
                    <div key={i} className="relative flex h-7 w-8 items-center justify-center">
                      {/* The string line runs through every cell */}
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden />
                      {text != null && (
                        <span
                          className="relative z-10 bg-[#0d0d0f] px-1 font-mono text-sm font-bold leading-none text-white"
                        >
                          {text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Right-edge fade hint that there's more to scroll on narrow screens */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#08080a]/80 to-transparent" aria-hidden />
      </Panel>

      {/* How to read */}
      <p className="mt-2 text-[11px] leading-snug text-white/40">
        Read left → right, one note or chord per column. Numbers are which fret to press; the top line is the
        thinnest string (high e), the bottom is the thickest (low E).
        {hasChordSteps && " A stack of numbers in one column = strum those strings together."}
        {steps.length > 9 && " Swipe to see the whole riff."}
      </p>

      {/* Technique legend — only the symbols this riff actually uses */}
      {usedTechniques.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {usedTechniques.map((t) => (
            <span key={t} className="text-[11px] text-white/45">
              <span className="font-mono font-bold text-white/65">{t}</span> = {TECHNIQUE_LEGEND[t]}
            </span>
          ))}
        </div>
      )}

      {/* Chord shapes */}
      {chordShapes.length > 0 && (
        <Panel className="mt-3" contentClassName="p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            Chords in this riff
          </p>
          <div className="flex flex-wrap gap-4">
            {chordShapes.map((shape) => (
              <ChordDiagram key={shape.name} shape={shape} accent="rgba(255,255,255,0.75)" />
            ))}
          </div>
        </Panel>
      )}

      {riff.teaches && (
        <p className="mt-3 text-[12px] text-white/55">
          <span className="font-semibold text-white/70">Drills:</span> {riff.teaches}
        </p>
      )}

      {/* Social-media cue */}
      <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-white/55">
        <Video className="w-4 h-4 flex-shrink-0 text-white/35" aria-hidden />
        <span>Film it once you can play it clean three times in a row.</span>
      </div>
    </div>
  );
}
