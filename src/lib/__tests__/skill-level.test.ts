import { describe, expect, it } from "vitest";
import {
  SKILL_BANDS,
  bandGuidance,
  clampLevel,
  experienceFromLevel,
  levelFromExperience,
  levelLabel,
  nextLevel,
  skillBand,
} from "../skill-level";

describe("skillBand", () => {
  it.each([
    [1, "Starting out"],
    [20, "Starting out"],
    [21, "Beginner"],
    [40, "Beginner"],
    [41, "Intermediate"],
    [60, "Intermediate"],
    [61, "Advanced"],
    [80, "Advanced"],
    [81, "Expert"],
    [100, "Expert"],
  ])("level %i is %s", (level, name) => {
    expect(skillBand(level).name).toBe(name);
  });

  it("covers 1-100 with no gaps or overlaps", () => {
    for (let l = 1; l <= 100; l++) {
      expect(SKILL_BANDS.filter((b) => l >= b.min && l <= b.max)).toHaveLength(1);
    }
  });

  it("clamps out-of-range levels into the end bands", () => {
    expect(skillBand(0).name).toBe("Starting out");
    expect(skillBand(250).name).toBe("Expert");
  });

  it("gives each band its own guidance", () => {
    const all = new Set([10, 30, 50, 70, 90].map(bandGuidance));
    expect(all.size).toBe(5);
  });
});

describe("clampLevel", () => {
  it("rounds and clamps numbers and numeric strings", () => {
    expect(clampLevel(34.6)).toBe(35);
    expect(clampLevel(-5)).toBe(1);
    expect(clampLevel(1000)).toBe(100);
    expect(clampLevel("42")).toBe(42);
  });
  it("rejects non-numbers", () => {
    expect(clampLevel(undefined)).toBeUndefined();
    expect(clampLevel("abc")).toBeUndefined();
    expect(clampLevel(Number.NaN)).toBeUndefined();
    expect(clampLevel({})).toBeUndefined();
    expect(clampLevel("")).toBeUndefined();
  });
});

describe("levelLabel", () => {
  it("reads like the slider label", () => {
    expect(levelLabel(34)).toBe("34 · Beginner");
    expect(levelLabel(90)).toBe("90 · Expert");
  });
});

describe("nextLevel", () => {
  it("rises 6 per sprint with no marks", () => {
    expect(nextLevel(30)).toBe(36);
  });
  it("adds 2 per easy day and removes 2 per hard day", () => {
    expect(nextLevel(50, { easy: 7 })).toBe(70);
    expect(nextLevel(50, { hard: 7 })).toBe(42);
    expect(nextLevel(50, { easy: 2, hard: 1 })).toBe(58);
  });
  it("stays within 1-100", () => {
    expect(nextLevel(98, { easy: 7 })).toBe(100);
    expect(nextLevel(3, { hard: 7 })).toBe(1);
  });
  it("ignores negative mark counts", () => {
    expect(nextLevel(50, { easy: -4, hard: -4 })).toBe(56);
  });
});

describe("experience mapping", () => {
  it("derives the old three-way value from the band", () => {
    expect(experienceFromLevel(10)).toBe("beginner");
    expect(experienceFromLevel(40)).toBe("beginner");
    expect(experienceFromLevel(55)).toBe("intermediate");
    expect(experienceFromLevel(61)).toBe("advanced");
    expect(experienceFromLevel(95)).toBe("advanced");
  });
  it("maps old saved values to a starting level that round-trips", () => {
    for (const exp of ["beginner", "intermediate", "advanced"] as const) {
      const l = levelFromExperience(exp);
      expect(l).toBeDefined();
      expect(experienceFromLevel(l as number)).toBe(exp);
    }
    expect(levelFromExperience(undefined)).toBeUndefined();
    expect(levelFromExperience("pro")).toBeUndefined();
  });
});
