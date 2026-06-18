"use client";
import type { ChordShape } from "@/types";

/**
 * ChordDiagram — the standard chord box every guitar method uses to teach a
 * shape: six vertical strings (low E on the LEFT, high e on the RIGHT), frets
 * running top → bottom, dots where your fingers press, and ×/○ above the nut
 * for muted/open strings. This is the "explain the chord" surface that pairs
 * with the tab: the tab shows WHEN to hit the chord, the diagram shows HOW.
 *
 * `shape.frets` is ordered low E (6th) → high e (1st); 0 = open, -1 = muted.
 */
export function ChordDiagram({ shape, accent = "rgba(255,255,255,0.85)" }: { shape: ChordShape; accent?: string }) {
  // Columns: render in diagram order (low E left → high e right) = the frets array as-is.
  const frets = shape.frets;
  const fretted = frets.filter((f) => f > 0);
  const maxFret = fretted.length ? Math.max(...fretted) : 1;
  const minFret = fretted.length ? Math.min(...fretted) : 1;

  // Open chords (everything ≤ 4) draw from the nut; higher shapes show a base-fret label.
  const showNut = maxFret <= 4;
  const startFret = showNut ? 1 : minFret;
  const rows = showNut ? 4 : Math.max(4, maxFret - minFret + 1);

  // Geometry (compact). 6 strings → 5 gaps.
  const COLS = 6;
  const colGap = 12;
  const rowGap = 13;
  const padX = 8;
  const topY = 16; // room for ×/○ markers above the grid
  const gridW = (COLS - 1) * colGap;
  const gridH = rows * rowGap;
  const w = gridW + padX * 2;
  const h = topY + gridH + 14; // room for string labels below

  const xFor = (col: number) => padX + col * colGap;
  const yForFret = (fret: number) => topY + (fret - startFret + 0.5) * rowGap;

  const stringLabels = ["E", "A", "D", "G", "B", "e"]; // low → high, matches column order

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-semibold leading-none tracking-[-0.01em] text-white">
        {shape.name}
      </span>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`${shape.name} chord diagram`}>
        {/* Base-fret label for up-the-neck shapes */}
        {!showNut && (
          <text x={padX - 5} y={topY + rowGap * 0.7} fontSize="8" fill="rgba(255,255,255,0.6)" textAnchor="end">
            {startFret}fr
          </text>
        )}
        {/* Nut (thick) or top fret line */}
        <line
          x1={xFor(0)}
          y1={topY}
          x2={xFor(COLS - 1)}
          y2={topY}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={showNut ? 3 : 1}
        />
        {/* Fret lines */}
        {Array.from({ length: rows }).map((_, r) => (
          <line
            key={`f${r}`}
            x1={xFor(0)}
            y1={topY + (r + 1) * rowGap}
            x2={xFor(COLS - 1)}
            y2={topY + (r + 1) * rowGap}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
          />
        ))}
        {/* Strings (vertical) */}
        {Array.from({ length: COLS }).map((_, c) => (
          <line
            key={`s${c}`}
            x1={xFor(c)}
            y1={topY}
            x2={xFor(c)}
            y2={topY + gridH}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          />
        ))}
        {/* ×/○ markers + finger dots */}
        {frets.map((fret, c) => {
          const x = xFor(c);
          if (fret < 0) {
            return (
              <text key={`m${c}`} x={x} y={topY - 5} fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="middle">
                ×
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={`m${c}`} cx={x} cy={topY - 8} r={3} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
            );
          }
          return <circle key={`m${c}`} cx={x} cy={yForFret(fret)} r={4.5} fill={accent} />;
        })}
        {/* String labels below */}
        {stringLabels.map((lbl, c) => (
          <text
            key={`l${c}`}
            x={xFor(c)}
            y={h - 3}
            fontSize="7"
            fill="rgba(255,255,255,0.4)"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
          >
            {lbl}
          </text>
        ))}
      </svg>
      {shape.hint && <span className="max-w-[160px] text-center text-[11px] leading-snug text-white/60">{shape.hint}</span>}
    </div>
  );
}
