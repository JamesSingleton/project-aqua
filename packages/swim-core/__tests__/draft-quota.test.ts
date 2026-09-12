import { describe, expect, it } from "vitest";
import {
  canUseSharedDraftQuota,
  formatSharedDraftQuotaHint,
  sharedDraftQuotaExhaustedMessage,
} from "../src/draft-quota";

describe("formatSharedDraftQuotaHint", () => {
  const base = {
    included: 5,
    used: 2,
    allowed: true,
    overageAllowed: false,
  };

  it("formats relay remaining", () => {
    expect(formatSharedDraftQuotaHint("relay", { ...base, remaining: 3 })).toBe(
      "3 relay suggestions left this month (shared with workout drafts).",
    );
  });

  it("formats workout singular remaining", () => {
    expect(
      formatSharedDraftQuotaHint("workout", { ...base, remaining: 1 }),
    ).toBe("1 workout draft left this month (shared with relay suggestions).");
  });

  it("returns exhausted copy when blocked", () => {
    expect(
      formatSharedDraftQuotaHint("relay", {
        ...base,
        remaining: 0,
        allowed: false,
      }),
    ).toBe("No relay suggestions left this month. Upgrade to Pro for more.");
  });

  it("hides hint when included is unlimited", () => {
    expect(
      formatSharedDraftQuotaHint("relay", {
        remaining: 10,
        included: Number.POSITIVE_INFINITY,
        used: 0,
        allowed: true,
        overageAllowed: false,
      }),
    ).toBeNull();
  });

  it("returns null when allowed with zero remaining but no overage edge", () => {
    expect(
      formatSharedDraftQuotaHint("workout", {
        remaining: 0,
        included: 5,
        used: 5,
        allowed: true,
        overageAllowed: false,
      }),
    ).toBeNull();
  });

  it("hides hint when pro overage applies at zero remaining", () => {
    expect(
      formatSharedDraftQuotaHint("workout", {
        ...base,
        remaining: 0,
        allowed: true,
        overageAllowed: true,
      }),
    ).toBeNull();
  });
});

describe("canUseSharedDraftQuota", () => {
  it("allows when remaining or overage", () => {
    expect(
      canUseSharedDraftQuota({
        remaining: 1,
        included: 5,
        used: 4,
        allowed: true,
        overageAllowed: false,
      }),
    ).toBe(true);
    expect(
      canUseSharedDraftQuota({
        remaining: 0,
        included: 20,
        used: 25,
        allowed: true,
        overageAllowed: true,
      }),
    ).toBe(true);
    expect(
      canUseSharedDraftQuota({
        remaining: 0,
        included: 5,
        used: 5,
        allowed: false,
        overageAllowed: false,
      }),
    ).toBe(false);
  });
});

describe("sharedDraftQuotaExhaustedMessage", () => {
  it("mentions both surfaces", () => {
    expect(sharedDraftQuotaExhaustedMessage()).toContain("relay suggestions");
    expect(sharedDraftQuotaExhaustedMessage()).toContain("workout drafts");
  });
});
