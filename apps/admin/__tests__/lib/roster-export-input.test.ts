import { describe, expect, it } from "vitest";
import { rosterSearchFiltersToExportInput } from "../../lib/roster-export-input";

describe("rosterSearchFiltersToExportInput", () => {
  it("maps roster URL filters to RosterPageInput", () => {
    expect(
      rosterSearchFiltersToExportInput({
        seasonId: "season-1",
        firstName: "  ada ",
        status: ["active"],
        gender: ["female"],
        groupId: ["varsity", "none"],
        classYear: ["2027"],
        sort: [{ id: "lastName", desc: true }],
      }),
    ).toEqual({
      seasonId: "season-1",
      q: "ada",
      status: ["active"],
      gender: ["female"],
      groupId: ["varsity", "none"],
      classYear: ["2027"],
      sort: [{ id: "lastName", desc: true }],
    });
  });

  it("omits empty filters for full-season export", () => {
    expect(
      rosterSearchFiltersToExportInput({
        seasonId: "season-1",
        firstName: "   ",
        status: [],
      }),
    ).toEqual({ seasonId: "season-1" });
  });
});
