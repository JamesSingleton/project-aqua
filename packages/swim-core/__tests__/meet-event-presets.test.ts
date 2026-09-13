import { describe, expect, it } from "vitest";
import {
  BUILT_IN_MEET_EVENT_PRESETS,
  getBuiltInMeetEventPreset,
  suggestNextEventNumber,
} from "../src/meet-event-presets";

describe("meet-event-presets", () => {
  it("includes SCY dual and age-group presets", () => {
    expect(BUILT_IN_MEET_EVENT_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(getBuiltInMeetEventPreset("scy_dual")?.events.length).toBe(22);
  });

  it("suggests next event number", () => {
    expect(suggestNextEventNumber([])).toBe(1);
    expect(suggestNextEventNumber([1, 3, 5])).toBe(6);
  });
});
