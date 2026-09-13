import { describe, expect, it } from "vitest";
import { toSharedDraftQuota } from "@/lib/draft-quota";

describe("toSharedDraftQuota", () => {
  it("maps quota fields", () => {
    expect(
      toSharedDraftQuota({
        remaining: 3,
        included: 10,
        used: 7,
        allowed: true,
        overageAllowed: false,
      }),
    ).toEqual({
      remaining: 3,
      included: 10,
      used: 7,
      allowed: true,
      overageAllowed: false,
    });
  });
});
