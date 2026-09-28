import { describe, expect, it } from "vitest";
import { ROSTER_MANAGEMENT_ROLES } from "../src/team-capabilities";

describe("roster import/export roles", () => {
  it("includes assistant coaches", () => {
    expect(ROSTER_MANAGEMENT_ROLES).toContain("assistant_coach");
    expect(ROSTER_MANAGEMENT_ROLES).toEqual([
      "owner",
      "head_coach",
      "assistant_coach",
    ]);
  });
});
