import { describe, expect, it } from "vitest";
import {
  buildEventKey,
  COMMON_EVENTS,
  eventGenderFromCode,
  eventGenderToCode,
  formatEventLabel,
  formatEventName,
  formatGenderLabel,
  formatGenderShort,
  formatStrokeLabel,
  isSwimmerEligibleForEvent,
  parseEventGender,
  parseEventKey,
} from "../src/events";

describe("event gender codes", () => {
  it("converts between EventGender and codes", () => {
    expect(eventGenderToCode("male")).toBe("m");
    expect(eventGenderToCode("female")).toBe("f");
    expect(eventGenderToCode("mixed")).toBe("x");
  });

  it("parses gender codes and aliases", () => {
    expect(eventGenderFromCode("f")).toBe("female");
    expect(eventGenderFromCode("female")).toBe("female");
    expect(eventGenderFromCode("g")).toBe("female");
    expect(eventGenderFromCode("girl")).toBe("female");
    expect(eventGenderFromCode("w")).toBe("female");
    expect(eventGenderFromCode("women")).toBe("female");
    expect(eventGenderFromCode("x")).toBe("mixed");
    expect(eventGenderFromCode("mixed")).toBe("mixed");
    expect(eventGenderFromCode("open")).toBe("mixed");
    expect(eventGenderFromCode("m")).toBe("male");
    expect(eventGenderFromCode(null)).toBe("male");
    expect(parseEventGender("W")).toBe("female");
  });
});

describe("isSwimmerEligibleForEvent", () => {
  it("allows mixed events and matching gender", () => {
    expect(isSwimmerEligibleForEvent("male", "mixed")).toBe(true);
    expect(isSwimmerEligibleForEvent("female", "female")).toBe(true);
    expect(isSwimmerEligibleForEvent("male", "female")).toBe(false);
    expect(isSwimmerEligibleForEvent("female", "f")).toBe(true);
  });
});

describe("formatStrokeLabel", () => {
  it("formats known strokes", () => {
    expect(formatStrokeLabel("free")).toBe("Freestyle");
    expect(formatStrokeLabel("medley_relay")).toBe("Medley Relay");
  });

  it("title-cases unknown strokes and handles empty", () => {
    expect(formatStrokeLabel("custom_stroke")).toBe("Custom stroke");
    expect(formatStrokeLabel("")).toBe("");
  });
});

describe("event naming and keys", () => {
  it("builds display names and labels", () => {
    expect(formatEventName(200, "im")).toBe("200 IM");
    expect(formatEventLabel(50, "free")).toBe("50 Freestyle");
  });

  it("labels diving events distinctly from swim strokes", () => {
    expect(formatEventName(0, "dive")).toBe("Diving");
    expect(formatEventName(0, "dive", null)).toBe("Diving");
    expect(formatEventName(0, "dive", 0)).toBe("Diving");
    expect(formatEventName(0, "dive", 6)).toBe("Diving (6 dives)");
  });

  it("builds and parses event keys", () => {
    expect(buildEventKey(200, "medley_relay", "SCY", "mixed")).toBe(
      "200_medley_relay_scy_x",
    );
    expect(buildEventKey(100, "free", "SCY", "m")).toBe("100_free_scy_m");
    expect(parseEventKey("200_medley_relay_scy_x")).toEqual({
      distance: 200,
      stroke: "medley_relay",
      course: "SCY",
      gender: "mixed",
    });
    expect(parseEventKey("100_free_scy_m")).toEqual({
      distance: 100,
      stroke: "free",
      course: "SCY",
      gender: "male",
    });
    expect(parseEventKey("bad")).toBeNull();
    expect(parseEventKey("100_free_bad_m")).toBeNull();
    expect(parseEventKey("x_free_scy_m")).toBeNull();
    expect(parseEventKey("100__scy_m")).toBeNull();
    expect(parseEventKey("100_free_scy")).toBeNull();
    expect(parseEventKey("100_free_scy_")).toEqual({
      distance: 100,
      stroke: "free",
      course: "SCY",
      gender: "male",
    });
  });
});

describe("gender display helpers", () => {
  it("formatGenderShort", () => {
    expect(formatGenderShort("female")).toBe("F");
    expect(formatGenderShort("f")).toBe("F");
    expect(formatGenderShort("mixed")).toBe("X");
    expect(formatGenderShort("x")).toBe("X");
    expect(formatGenderShort("male")).toBe("M");
    expect(formatGenderShort("m")).toBe("M");
    expect(formatGenderShort("other")).toBe("");
  });

  it("formatGenderLabel", () => {
    expect(formatGenderLabel("female")).toBe("Female");
    expect(formatGenderLabel("mixed")).toBe("Mixed");
    expect(formatGenderLabel("male")).toBe("Male");
    expect(formatGenderLabel("custom")).toBe("custom");
  });
});

describe("COMMON_EVENTS", () => {
  it("is non-empty", () => {
    expect(COMMON_EVENTS.length).toBeGreaterThan(0);
    expect(COMMON_EVENTS[0]?.key).toBeTruthy();
  });
});
