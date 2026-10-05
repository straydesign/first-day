import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDirectAction } from "../plan-rules";

/** Every hardcoded activity string in the backup template and the demo must be an exact action too. */
function quotedActivities(file: string): string[] {
  const src = readFileSync(join(__dirname, "..", file), "utf8");
  const out: string[] = [];
  for (const m of src.matchAll(/(?:text:\s*|activities:\s*\[|^\s*)"([A-Z][^"\n]{8,})"/gm)) out.push(m[1]);
  return out;
}

describe("hardcoded plans are exact actions", () => {
  for (const file of ["plan-generator.ts", "demo-data.ts"]) {
    it(file, () => {
      const bad = quotedActivities(file).filter((t) => !isDirectAction(t) && !/^(Day|Sprint|Week)\b/.test(t));
      expect(bad).toEqual([]);
    });
  }
});
