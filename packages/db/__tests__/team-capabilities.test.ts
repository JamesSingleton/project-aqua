import { describe, expect, it } from "vitest";
import {
  canManageRosterFiles,
  canManageTeam,
  EXPORT_ROLES,
  getTeamCapabilities,
  ROSTER_MANAGEMENT_ROLES,
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

describe("canManageRosterFiles", () => {
  it("allows roster management roles", () => {
    for (const role of ROSTER_MANAGEMENT_ROLES) {
      expect(canManageRosterFiles(role)).toBe(true);
    }
  });

  it("denies admin and member", () => {
    expect(canManageRosterFiles("admin")).toBe(false);
    expect(canManageRosterFiles("member")).toBe(false);
  });
});

describe("getTeamCapabilities", () => {
  it("splits team vs roster file permissions", () => {
    expect(getTeamCapabilities("assistant_coach")).toEqual({
      canManageTeam: false,
      canManageRosterFiles: true,
    });
    expect(getTeamCapabilities("owner")).toEqual({
      canManageTeam: true,
      canManageRosterFiles: true,
    });
  });
});

describe("roleHasExportAccess", () => {
  it("matches EXPORT_ROLES / TEAM_MANAGEMENT_ROLES", () => {
    expect(TEAM_MANAGEMENT_ROLES).toBe(EXPORT_ROLES);
    for (const role of EXPORT_ROLES) {
      expect(roleHasExportAccess(role)).toBe(true);
    }
    expect(roleHasExportAccess("assistant_coach")).toBe(false);
  });
});
