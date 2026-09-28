import { describe, expect, it } from "vitest";
import {
  canManageTeam,
  getTeamCapabilities,
  roleHasExportAccess,
  TEAM_MANAGEMENT_ROLES,
} from "../src/team-capabilities";

describe("canManageTeam", () => {
  it("allows owner and head_coach", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("head_coach")).toBe(true);
  });

  it("denies other coach roles", () => {
    expect(canManageTeam("assistant_coach")).toBe(false);
    expect(canManageTeam("admin")).toBe(false);
    expect(canManageTeam("member")).toBe(false);
  });

  it("denies missing role", () => {
    expect(canManageTeam(null)).toBe(false);
    expect(canManageTeam(undefined)).toBe(false);
    expect(canManageTeam("")).toBe(false);
  });
});

describe("getTeamCapabilities", () => {
  it("mirrors canManageTeam", () => {
    expect(getTeamCapabilities("assistant_coach")).toEqual({
      canManageTeam: false,
    });
    expect(getTeamCapabilities("owner")).toEqual({ canManageTeam: true });
  });
});

describe("roleHasExportAccess", () => {
  it("matches TEAM_MANAGEMENT_ROLES", () => {
    for (const role of TEAM_MANAGEMENT_ROLES) {
      expect(roleHasExportAccess(role)).toBe(true);
    }
    expect(roleHasExportAccess("assistant_coach")).toBe(false);
  });
});
