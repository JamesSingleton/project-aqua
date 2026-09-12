import { describe, expect, it } from "vitest";
import {
  parseWorkoutText,
  textEditDistance,
  workoutParserNormalization,
} from "../src/workout-parser";

describe("parseWorkoutText", () => {
  it("parses sections, sets, distance-only lines, and intensities", () => {
    const workout = `
# comment line

Warm-up
4x100 free easy
200 IM moderate

Main set
8x50 fly race
10 x 25 kick sprint
200 choice recovery

Pre-set
400 pull threshold

Drill
6x50 drill slow

Kick block
100 kick

Pull block
100 pull

Cool-down
200 fr

Unrecognized gibberish line
`;

    const parsed = parseWorkoutText(workout);

    expect(parsed.sets.length).toBeGreaterThan(0);
    expect(parsed.totalDistance).toBeGreaterThan(0);
    expect(parsed.warnings).toContain(
      "Unparsed line: Unrecognized gibberish line",
    );

    const warmup = parsed.sets.find((s) => s.section === "warmup");
    expect(warmup).toMatchObject({
      reps: 4,
      distance: 100,
      stroke: "free",
      intensity: "easy",
    });

    const imSet = parsed.sets.find((s) => s.stroke === "im" && s.reps === 1);
    expect(imSet).toMatchObject({
      distance: 200,
      intensity: "moderate",
    });

    const mainFly = parsed.sets.find((s) => s.stroke === "fly");
    expect(mainFly).toMatchObject({
      reps: 8,
      distance: 50,
      intensity: "race",
      section: "main",
    });

    expect(parsed.sets.some((s) => s.stroke === "kick")).toBe(true);
    expect(parsed.sets.some((s) => s.intensity === "sprint")).toBe(true);
    expect(parsed.sets.some((s) => s.intensity === "recovery")).toBe(true);
    expect(parsed.sets.some((s) => s.intensity === "threshold")).toBe(true);
    expect(parsed.sets.some((s) => s.section === "cooldown")).toBe(true);
    expect(parsed.sets.some((s) => s.section === "preset")).toBe(true);
    expect(parsed.sets.some((s) => s.section === "drill")).toBe(true);
    expect(parsed.sets.some((s) => s.section === "kick")).toBe(true);
    expect(parsed.sets.some((s) => s.section === "pull")).toBe(true);
  });

  it("parses distance-only lines with interval and notes", () => {
    const parsed = parseWorkoutText(`
Main
200 free @ 1:30
200 breast easy hold smooth
`);
    expect(parsed.sets).toHaveLength(2);
    expect(parsed.sets[0]).toMatchObject({
      reps: 1,
      distance: 200,
      interval: "1:30",
      notes: null,
    });
    expect(parsed.sets[1]).toMatchObject({
      stroke: "breast",
      intensity: "easy",
      notes: "hold smooth",
      interval: null,
    });
  });

  it("parses stroke abbreviations and defaults unknown set strokes to free", () => {
    const parsed = parseWorkoutText(`
Main
2x50 bk @ :45
2x50 br @ :50
2x50 fl @ :50
2x50 p @ 1:00
2x50 ch @ 1:00
2x50 custom @ 1:00
`);

    expect(parsed.sets.map((s) => s.stroke)).toEqual([
      "back",
      "breast",
      "fly",
      "pull",
      "choice",
      "free",
    ]);
  });

  it("captures interval and trailing notes when intensity follows interval", () => {
    const parsed = parseWorkoutText("Main\n4x100 free @ 1:30 easy");
    expect(parsed.sets[0]).toMatchObject({
      interval: "1:30",
      intensity: "unknown",
      notes: "easy",
    });
  });

  it("skips short distance-only lines", () => {
    const parsed = parseWorkoutText("Main\n10 free");
    expect(parsed.sets).toHaveLength(0);
    expect(parsed.warnings).toHaveLength(1);
  });
});

describe("workoutParserNormalization", () => {
  it("covers normalization fallbacks", () => {
    const { normalizeStroke, normalizeIntensity, normalizeSection } =
      workoutParserNormalization;
    expect(normalizeStroke(undefined)).toBe("free");
    expect(normalizeStroke("im")).toBe("im");
    expect(normalizeStroke("fly")).toBe("fly");
    expect(normalizeStroke("free")).toBe("free");
    expect(normalizeStroke("fl")).toBe("fly");
    expect(normalizeStroke("bk")).toBe("back");
    expect(normalizeStroke("br")).toBe("breast");
    expect(normalizeStroke("ch")).toBe("choice");
    expect(normalizeStroke("k")).toBe("kick");
    expect(normalizeStroke("p")).toBe("pull");
    expect(normalizeStroke("dr")).toBe("drill");
    expect(normalizeStroke("underwater")).toBe("underwater");
    expect(normalizeIntensity(undefined)).toBe("unknown");
    expect(normalizeIntensity("slow")).toBe("easy");
    expect(normalizeIntensity("turbo")).toBe("unknown");
    expect(normalizeIntensity("mod")).toBe("moderate");
    expect(normalizeIntensity("thresh")).toBe("threshold");
    expect(normalizeSection("Warm-up")).toBe("warmup");
    expect(normalizeSection("CD")).toBe("cooldown");
    expect(normalizeSection("Pre-set")).toBe("preset");
    expect(normalizeSection("MS")).toBe("main");
    expect(normalizeSection("Sprint")).toBe("sprint");
    expect(normalizeIntensity("rec")).toBe("recovery");
    expect(normalizeIntensity("fast")).toBe("race");
  });
});

describe("textEditDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(textEditDistance("abc", "abc")).toBe(0);
  });

  it("returns length when one string is empty", () => {
    expect(textEditDistance("", "abc")).toBe(3);
    expect(textEditDistance("abc", "")).toBe(3);
  });

  it("computes edit distance", () => {
    expect(textEditDistance("kitten", "sitting")).toBe(3);
    expect(textEditDistance("abc", "abd")).toBe(1);
    expect(textEditDistance("a", "b")).toBe(1);
    expect(textEditDistance("abc", "ab")).toBe(1);
    expect(textEditDistance("abc", "abcd")).toBe(1);
    expect(textEditDistance("ab", "ba")).toBe(2);
  });
});
