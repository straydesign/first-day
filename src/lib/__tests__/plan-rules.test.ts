import { describe, expect, it } from "vitest";
import { findNonActions, findRepeats, isDirectAction } from "../plan-rules";

describe("isDirectAction", () => {
  it.each([
    "Play the C, G and Am chords, 10 clean switches each",
    "Walk 20 minutes at an easy pace",
    "Write 3 sentences in Spanish about your morning",
    "Record yourself playing the riff once",
    "Read pages 1-10 of the manual",
  ])("accepts an exact action: %s", (t) => {
    expect(isDirectAction(t)).toBe(true);
  });

  it.each([
    "What does success look like for you?",
    "Think about why you want to learn guitar",
    "Reflect on your progress so far",
    "Consider which songs you like",
    "Research beginner running plans",
    "Plan your week of workouts",
    "Set an intention for the week",
    "Visualize yourself finishing the race",
    "- Brainstorm 5 recipe ideas",
    "1. Identify your biggest obstacle",
  ])("rejects a thinking prompt: %s", (t) => {
    expect(isDirectAction(t)).toBe(false);
  });

  it("does not trip on action verbs that merely contain a banned word", () => {
    expect(isDirectAction("Planks: hold for 30 seconds, 3 times")).toBe(true);
    expect(isDirectAction("Play through the song once")).toBe(true);
  });
});

describe("findNonActions", () => {
  it("lists only the offending activities, including object activities", () => {
    const days = {
      1: { activities: ["Walk 10 minutes", "Think about your goals"] },
      2: { activities: [{ text: "Why do you want this?" }, { text: "Stretch for 5 minutes" }] },
    };
    expect(findNonActions(days)).toEqual(["Think about your goals", "Why do you want this?"]);
  });
});

describe("findRepeats", () => {
  it("finds a word-for-word repeat across days, ignoring case and punctuation", () => {
    const days = {
      1: { activities: ["Play the C chord 20 times", "Walk 10 minutes"] },
      2: { activities: ["play the C chord 20 times!", "Stretch for 5 minutes"] },
    };
    expect(findRepeats(days)).toEqual(["play the C chord 20 times!"]);
  });

  it("finds a repeat within one day and in object activities", () => {
    const days = {
      3: { activities: [{ text: "Run 1 mile" }, { text: "- Run 1 mile" }] },
    };
    expect(findRepeats(days)).toEqual(["- Run 1 mile"]);
  });

  it("treats a changed count as a new activity", () => {
    const days = {
      1: { activities: ["20 squats", "Play the C chord 20 times"] },
      2: { activities: ["30 squats", "Play the C chord 30 times"] },
    };
    expect(findRepeats(days)).toEqual([]);
  });

  it("lists each extra use once and walks days in order", () => {
    const days = {
      2: { activities: ["Cook rice"] },
      1: { activities: ["Cook rice"] },
      3: { activities: ["Cook rice"] },
    };
    expect(findRepeats(days)).toHaveLength(2);
  });
});
