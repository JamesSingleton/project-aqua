import { describe, expect, it } from "vitest";
import { applyResultToBestTime } from "../src/best-times";

describe("applyResultToBestTime", () => {
  it("treats the first legal time as a personal best", () => {
    expect(applyResultToBestTime(null, 28000)).toEqual({
      previousMs: null,
      nextMs: 28000,
      isPersonalBest: true,
    });
    expect(applyResultToBestTime(0, 28000)).toEqual({
      previousMs: null,
      nextMs: 28000,
      isPersonalBest: true,
    });
  });

  it("updates only when the new time is faster", () => {
    expect(applyResultToBestTime(28000, 27500)).toEqual({
      previousMs: 28000,
      nextMs: 27500,
      isPersonalBest: true,
    });
    expect(applyResultToBestTime(28000, 28100)).toEqual({
      previousMs: 28000,
      nextMs: 28000,
      isPersonalBest: false,
    });
  });

  it("ignores DQ and empty times", () => {
    expect(applyResultToBestTime(28000, 27000, { isDq: true })).toEqual({
      previousMs: 28000,
      nextMs: 28000,
      isPersonalBest: false,
    });
    expect(applyResultToBestTime(undefined, 0)).toEqual({
      previousMs: null,
      nextMs: null,
      isPersonalBest: false,
    });
  });
});
