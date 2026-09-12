import { describe, expect, it } from "vitest";
import { isCoachingRole, roleHasPermission } from "../src/roles";

describe("roleHasPermission", () => {
  it("checks exact and prefix permissions", () => {
    expect(roleHasPermission("owner", "billing")).toBe(true);
    expect(roleHasPermission("assistant_coach", "roster")).toBe(true);
    expect(roleHasPermission("assistant_coach", "settings")).toBe(false);
    expect(roleHasPermission("assistant_coach", "billing")).toBe(false);
    expect(roleHasPermission("head_coach", "meets")).toBe(true);
    expect(roleHasPermission("unknown", "roster")).toBe(false);
  });
});

describe("isCoachingRole", () => {
  it("identifies coaching staff", () => {
    expect(isCoachingRole("owner")).toBe(true);
    expect(isCoachingRole("head_coach")).toBe(true);
    expect(isCoachingRole("member")).toBe(false);
  });
});
