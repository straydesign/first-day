/**
 * One live generation against the real API, printed as an ASCII tab board.
 *
 * Proves the whole seam end to end: matcher fires → prompt fragment lands →
 * model returns object-form activities → coercion accepts them. Reading the
 * board is the only way to catch the ordering trap (string 1 = high e, but
 * chord frets run low E first) — a swapped riff type-checks perfectly and is
 * silently unplayable.
 *
 * Needs a real key — without one generateSprintWithAI serves the template and
 * this prints nothing useful:
 *   export ANTHROPIC_API_KEY="$(~/.claude/hooks/secrets-helper.sh get anthropic api-key)"
 *   npx tsx scripts/try-artifact.mts "learn to play guitar"
 */
import { generateSprintWithAI } from "../src/lib/anthropic";
import { artifactSpecsFor, activityArtifact } from "../src/lib/artifacts";
import type { Activity, RiffNote } from "../src/types";

const goal = process.argv[2] || "learn to play guitar";
const specs = artifactSpecsFor(goal);
console.log(`goal: ${goal}\nmatched specs: ${specs.map((s) => s.kind).join(", ") || "(none)"}\n`);

const result = await generateSprintWithAI({ goal, experienceLevel: "beginner", timeCommitment: "20 minutes" }, 1, {});
if (!result) {
  console.log("generateSprintWithAI returned null — fell back to the template.");
  process.exit(1);
}

let found = 0;
for (const [dayNo, day] of Object.entries(result.days)) {
  const withArt = (day.activities as Array<string | Activity>).filter((a) => activityArtifact(a));
  console.log(`Day ${dayNo}: ${day.title}  [${day.activities.length} activities, ${withArt.length} artifact]`);
  for (const a of day.activities) {
    const art = activityArtifact(a);
    console.log(`   - ${typeof a === "string" ? a : a.text}`);
    if (!art || art.kind !== "guitar-riff") continue;
    found++;
    const r = art.data;
    console.log(`     ↳ ${r.name} · ${r.key ?? "?"} · ${r.bpm ?? "?"}bpm · teaches ${r.teaches ?? "?"} · ${r.steps.length} steps`);
    // Draw the board: row 0 = string 1 = high e (top), as every tab site does.
    const cols = r.steps.map((s) => {
      const col = Array(6).fill("-");
      if ("chord" in s) {
        const shape = (r.chords ?? []).find((c) => c.name === s.chord);
        // shape.frets is low E first → reverse to put high e on the top row.
        if (shape) [...shape.frets].reverse().forEach((f, i) => { col[i] = f < 0 ? "x" : String(f); });
      } else {
        const n = s as RiffNote;
        col[n.string - 1] = `${n.technique && n.technique !== "x" ? n.technique : ""}${n.fret}`;
      }
      return col;
    });
    const w = Math.max(2, ...cols.flat().map((c) => c.length)) + 1;
    ["e", "B", "G", "D", "A", "E"].forEach((label, row) => {
      console.log(`       ${label}|${cols.map((c) => c[row].padEnd(w, "-")).join("")}|`);
    });
    for (const c of r.chords ?? []) console.log(`       chord ${c.name}: [${c.frets.join(" ")}] (low E → high e)${c.hint ? ` — ${c.hint}` : ""}`);
  }
}
console.log(`\nartifacts that survived validation: ${found}`);
