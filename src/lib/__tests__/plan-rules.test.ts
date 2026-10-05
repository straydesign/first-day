import { describe, expect, it } from "vitest";
import { findNonActions, isDirectAction } from "../plan-rules";

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
