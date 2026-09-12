import { describe, expect, it } from "vitest";
import {
  canUseAiGeneration,
  getAiQuotaRemaining,
  getPlanLimits,
  type PlanFeature,
  planHasFeature,
} from "../src/plans";

describe("planHasFeature", () => {
  it("returns feature flags per tier", () => {
    expect(planHasFeature("free", "meet_import")).toBe(true);
    expect(planHasFeature("free", "progression")).toBe(true);
    expect(planHasFeature("free", "swims_sync")).toBe(true);
    expect(planHasFeature("free", "lineup_suggestions")).toBe(false);
    expect(planHasFeature("free", "advanced_analytics")).toBe(false);
    expect(planHasFeature("pro", "lineup_suggestions")).toBe(true);
    expect(planHasFeature("pro", "advanced_analytics")).toBe(true);
    expect(planHasFeature("enterprise", "swims_sync")).toBe(true);
  });

  it("returns false for unknown features", () => {
    expect(planHasFeature("free", "unknown" as PlanFeature)).toBe(false);
  });
});

describe("getPlanLimits", () => {
  it("returns limits for each tier", () => {
    expect(getPlanLimits("free").maxSwimmers).toBe(Number.POSITIVE_INFINITY);
    expect(getPlanLimits("pro").maxSwimmers).toBe(Number.POSITIVE_INFINITY);
    expect(getPlanLimits("enterprise").maxCoaches).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe("getAiQuotaRemaining", () => {
  it("never returns negative remaining quota", () => {
    expect(getAiQuotaRemaining("free", 0)).toBe(5);
    expect(getAiQuotaRemaining("free", 10)).toBe(0);
  });
});

describe("canUseAiGeneration", () => {
  it("allows when quota remains", () => {
    expect(canUseAiGeneration("free", 2)).toEqual({
      allowed: true,
      remaining: 3,
    });
  });

  it("allows overage on paid tiers", () => {
    expect(canUseAiGeneration("pro", 25)).toEqual({
      allowed: true,
      remaining: 0,
    });
  });

  it("blocks free tier when quota exhausted", () => {
    expect(canUseAiGeneration("free", 5)).toEqual({
      allowed: false,
      remaining: 0,
      reason: expect.stringContaining("relay suggestions"),
    });
  });
});
