import { describe, expect, it } from "vitest";
import { pickTeamLandingPath } from "@/lib/team-landing";

describe("pickTeamLandingPath", () => {
  it("sends new coaches to onboarding", () => {
    expect(pickTeamLandingPath([])).toBe("/onboarding");
  });

  it("sends single-team coaches straight to their dashboard", () => {
    expect(pickTeamLandingPath([{ id: "team-a" }])).toBe("/team/team-a");
  });

  it("restores the last active team for multi-team coaches", () => {
    expect(
      pickTeamLandingPath([{ id: "team-a" }, { id: "team-b" }], "team-b"),
    ).toBe("/team/team-b");
  });

  it("ignores active org when the user is no longer a member", () => {
    expect(pickTeamLandingPath([{ id: "team-a" }], "team-removed")).toBe(
      "/team/team-a",
    );
  });

  it("shows the team picker when multiple teams and no active org", () => {
    expect(pickTeamLandingPath([{ id: "team-a" }, { id: "team-b" }])).toBe("/");
  });
});
