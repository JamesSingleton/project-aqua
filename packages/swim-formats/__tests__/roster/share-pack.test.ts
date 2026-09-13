import { describe, expect, it } from "vitest";
import {
  buildRosterSharePack,
  isRosterSharePack,
  isRosterSharePackFilename,
  parseRosterSharePack,
  rosterSharePackFilename,
  serializeRosterSharePack,
} from "../../src/roster/share-pack";

const sampleAthlete = {
  aquaSwimmerId: "swimmer_abc123",
  firstName: "Jane",
  lastName: "Doe",
  preferredName: "Jay",
  dateOfBirth: "2012-04-15",
  gender: "female" as const,
  governingBodyId: "USA123",
};

describe("roster share pack", () => {
  it("round-trips serialize → parse", () => {
    const pack = buildRosterSharePack({
      sourceOrganizationId: "org_1",
      sourceOrganizationName: "Aqua Club",
      exportedAt: "2026-09-10T12:00:00.000Z",
      athletes: [sampleAthlete],
    });
    const json = serializeRosterSharePack(pack);
    const parsed = parseRosterSharePack(json);
    expect(parsed).toEqual(pack);
    expect(isRosterSharePack(json)).toBe(true);
  });

  it("strips duplicate athletes by aquaSwimmerId", () => {
    const pack = buildRosterSharePack({
      sourceOrganizationId: "org_1",
      sourceOrganizationName: "Aqua Club",
      athletes: [sampleAthlete, { ...sampleAthlete, firstName: "Janet" }],
    });
    expect(pack.athletes).toHaveLength(1);
    expect(pack.athletes[0]?.firstName).toBe("Janet");
  });

  it("does not serialize contact or medical fields even if present on input objects", () => {
    const sneaky = {
      ...sampleAthlete,
      email: "jane@example.com",
      phone: "555-0100",
      parentEmail: "parent@example.com",
    };
    const pack = buildRosterSharePack({
      sourceOrganizationId: "org_1",
      sourceOrganizationName: "Aqua Club",
      athletes: [sneaky],
    });
    const json = serializeRosterSharePack(pack);
    expect(json).not.toContain("jane@example.com");
    expect(json).not.toContain("555-0100");
    expect(json).not.toContain("parent@example.com");
    expect(JSON.parse(json).athletes[0]).toEqual({
      aquaSwimmerId: sampleAthlete.aquaSwimmerId,
      firstName: "Jane",
      lastName: "Doe",
      preferredName: "Jay",
      dateOfBirth: "2012-04-15",
      gender: "female",
      governingBodyId: "USA123",
    });
  });

  it("rejects invalid packs", () => {
    expect(() => parseRosterSharePack("{")).toThrow(/not valid JSON/);
    expect(() => parseRosterSharePack("null")).toThrow(/expected an object/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "other",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [sampleAthlete],
        }),
      ),
    ).toThrow(/unrecognized format/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 99,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [sampleAthlete],
        }),
      ),
    ).toThrow(/Unsupported roster share pack version/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "",
          sourceOrganizationName: "t",
          athletes: [sampleAthlete],
        }),
      ),
    ).toThrow(/missing source organization/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "   ",
          athletes: [sampleAthlete],
        }),
      ),
    ).toThrow(/missing source team name/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [],
        }),
      ),
    ).toThrow(/no athletes/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [{ firstName: "Jane" }],
        }),
      ),
    ).toThrow(/athlete missing/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [null],
        }),
      ),
    ).toThrow(/athlete missing/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [
            {
              aquaSwimmerId: "x",
              firstName: 12,
              lastName: "Doe",
              dateOfBirth: "2012-01-01",
              gender: "female",
            },
          ],
        }),
      ),
    ).toThrow(/athlete missing/);
    expect(() =>
      parseRosterSharePack(
        JSON.stringify({
          format: "project-aqua-roster-share",
          version: 1,
          sourceOrganizationId: "o",
          sourceOrganizationName: "t",
          athletes: [
            {
              aquaSwimmerId: "x",
              firstName: "Jane",
              lastName: "Doe",
              dateOfBirth: "2012-01-01",
              gender: "other",
            },
          ],
        }),
      ),
    ).toThrow(/athlete missing/);
  });

  it("detects share pack content and filenames", () => {
    expect(isRosterSharePack("not json")).toBe(false);
    expect(isRosterSharePack("{]")).toBe(false);
    expect(isRosterSharePack('{"format":"nope"}')).toBe(false);
    expect(isRosterSharePackFilename("club-roster-share.aqua.json")).toBe(true);
    expect(isRosterSharePackFilename("pack.aqua-roster.json")).toBe(true);
    expect(isRosterSharePackFilename("team-share.json")).toBe(true);
    expect(isRosterSharePackFilename("roster.csv")).toBe(false);
  });

  it("drops incomplete athletes when building", () => {
    const pack = buildRosterSharePack({
      sourceOrganizationId: "org_1",
      sourceOrganizationName: "Aqua Club",
      athletes: [
        { ...sampleAthlete, aquaSwimmerId: "" },
        {
          aquaSwimmerId: "ok",
          firstName: "Ann",
          lastName: "Bee",
          dateOfBirth: "2011-01-01",
          gender: "female",
          preferredName: null,
          governingBodyId: null,
        },
        {
          aquaSwimmerId: "boy",
          firstName: "Bob",
          lastName: "Bee",
          dateOfBirth: "2010-02-02",
          gender: "male",
        },
      ],
    });
    expect(pack.athletes.map((a) => a.aquaSwimmerId)).toEqual(["ok", "boy"]);
  });

  it("defaults exportedAt when missing on parse", () => {
    const parsed = parseRosterSharePack(
      JSON.stringify({
        format: "project-aqua-roster-share",
        version: 1,
        sourceOrganizationId: "o",
        sourceOrganizationName: "Team",
        athletes: [sampleAthlete],
      }),
    );
    expect(parsed.exportedAt).toBe(new Date(0).toISOString());
  });

  it("builds a safe download filename", () => {
    expect(rosterSharePackFilename("East High  Aquatic!")).toBe(
      "east-high-aquatic-roster-share.aqua.json",
    );
    expect(rosterSharePackFilename("!!!")).toBe("team-roster-share.aqua.json");
  });
});
